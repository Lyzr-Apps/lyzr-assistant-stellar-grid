import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Send,
  Sun,
  Moon,
  Menu,
  Plus,
  Search,
  User,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Bot,
  Sparkles
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'

// Agent ID from workflow.json
const AGENT_ID = "69808344066158e77fde9b95"

// TypeScript interfaces based on actual_test_response
interface AgentResult {
  answer: string
  sources: string[]
  related_topics: string[]
  confidence: number
}

interface AgentMetadata {
  agent_name: string
  timestamp: string
}

interface AgentResponse {
  status: 'success' | 'error'
  result: AgentResult
  metadata: AgentMetadata
}

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  response?: AgentResult
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  timestamp: string
}

// Predefined prompts
const PREDEFINED_PROMPTS = [
  "How do I get started with Lyzr?",
  "How do I choose the right model?",
  "Show me available API endpoints",
  "What tutorials are available?",
  "How do I build my first agent?"
]

// Lyzr Logo Component with actual brand colors
function LyzrLogo({ className = "" }: { className?: string }) {
  return (
    <div className={cn("font-heading text-2xl flex items-center gap-2", className)}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center text-white font-bold shadow-sm">
        L
      </div>
      <span className="font-semibold">Lyzr</span>
    </div>
  )
}

// Header Component with Lyzr styling
function Header({
  theme,
  onToggleTheme
}: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  return (
    <header className="h-[70px] border-b flex items-center justify-between px-6 bg-background">
      <div className="flex items-center gap-4">
        <LyzrLogo />
        <Separator orientation="vertical" className="h-6" />
        <h1 className="font-heading text-xl font-medium">Support Assistant</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="rounded-full hover:bg-muted transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Sun className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center shadow-sm">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  )
}

// Sidebar Component
function Sidebar({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  searchQuery,
  onSearchChange
}: {
  isOpen: boolean
  onToggle: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {isOpen && (
        <aside className="w-[260px] border-r bg-background flex flex-col">
          <div className="p-4 space-y-3">
            <Button
              onClick={onNewChat}
              className="w-full rounded-[50px] border-2 border-[rgba(210,210,210,0.5)] bg-[#7458e8] hover:bg-[#8d65e9] text-white font-ui font-medium shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 font-ui rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 pb-4">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 font-ui",
                    "hover:bg-accent",
                    activeConversationId === conv.id && "bg-accent shadow-sm"
                  )}
                >
                  <div className="font-medium text-sm truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(conv.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute top-[80px] left-2 z-10 rounded-full hover:bg-muted"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <Menu className="w-4 h-4" />
        )}
      </Button>
    </>
  )
}

// Predefined Prompts Component with Lyzr branding
function PredefinedPrompts({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="font-heading text-4xl font-semibold mb-3 text-foreground">
          Hi! I'm your Lyzr Support Assistant
        </h2>
        <p className="font-body text-lg text-muted-foreground">
          Ask me anything about Lyzr's platform, APIs, or tutorials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PREDEFINED_PROMPTS.map((prompt, index) => (
          <Card
            key={index}
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#7458e8] group rounded-2xl border-2"
            onClick={() => onSelectPrompt(prompt)}
          >
            <CardContent className="p-5">
              <p className="font-ui text-sm font-medium group-hover:text-[#7458e8] transition-colors">
                {prompt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Chat Message Component with Lyzr styling
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn("flex gap-4 mb-8", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={cn("flex-1 max-w-[80%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-5 py-3.5 font-body",
            isUser
              ? "bg-gradient-to-br from-[#7458e8] to-[#8d65e9] text-white shadow-md"
              : "bg-muted"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

          {message.response && !isUser && (
            <div className="mt-5 space-y-4">
              {/* Sources */}
              {message.response.sources && message.response.sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide font-ui">
                    Sources
                  </p>
                  <div className="space-y-2">
                    {message.response.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#7458e8] hover:text-[#8d65e9] hover:underline transition-colors font-ui"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Topics */}
              {message.response.related_topics && message.response.related_topics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide font-ui">
                    Related Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.response.related_topics.map((topic, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs font-ui px-3 py-1 rounded-full bg-accent text-accent-foreground"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Score */}
              {message.response.confidence && message.response.confidence > 0.7 && (
                <div>
                  <Badge
                    variant="outline"
                    className="text-xs font-ui px-3 py-1 rounded-full border-[#7458e8] text-[#7458e8]"
                  >
                    Confidence: {(message.response.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 px-2 font-ui">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex gap-4 mb-8">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7458e8] to-[#8d65e9] flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-muted rounded-2xl px-5 py-4">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// Main Home Component
export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lyzr-conversations')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed)
        if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id)
        }
      } catch (e) {
        console.error('Failed to load conversations:', e)
      }
    }
  }, [])

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('lyzr-conversations', JSON.stringify(conversations))
    }
  }, [conversations])

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeConversationId, conversations, isLoading])

  const activeConversation = conversations.find(c => c.id === activeConversationId)
  const showPredefinedPrompts = !activeConversation || activeConversation.messages.length === 0

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      timestamp: new Date().toISOString()
    }
    setConversations(prev => [newConv, ...prev])
    setActiveConversationId(newConv.id)
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    let convId = activeConversationId

    // Create new conversation if none exists
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: messageText.slice(0, 50),
        messages: [],
        timestamp: new Date().toISOString()
      }
      setConversations(prev => [newConv, ...prev])
      convId = newConv.id
      setActiveConversationId(convId)
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    }

    setConversations(prev =>
      prev.map(conv =>
        conv.id === convId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 ? messageText.slice(0, 50) : conv.title
            }
          : conv
      )
    )

    setInputValue('')
    setIsLoading(true)

    try {
      // Call AI agent
      const result = await callAIAgent(messageText, AGENT_ID)

      if (result.success && result.response.status === 'success') {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: result.response.result.answer,
          timestamp: new Date().toISOString(),
          response: result.response.result
        }

        setConversations(prev =>
          prev.map(conv =>
            conv.id === convId
              ? { ...conv, messages: [...conv.messages, agentMessage] }
              : conv
          )
        )
      } else {
        // Error response
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: result.error || 'Sorry, I encountered an error processing your request.',
          timestamp: new Date().toISOString()
        }

        setConversations(prev =>
          prev.map(conv =>
            conv.id === convId
              ? { ...conv, messages: [...conv.messages, errorMessage] }
              : conv
          )
        )
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Sorry, I encountered a network error. Please try again.',
        timestamp: new Date().toISOString()
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === convId
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header theme={theme} onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewChat={handleNewChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 flex flex-col">
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-4xl mx-auto py-12 px-6">
              {showPredefinedPrompts ? (
                <PredefinedPrompts onSelectPrompt={handleSendMessage} />
              ) : (
                <div>
                  {activeConversation?.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && <TypingIndicator />}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-background p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about Lyzr..."
                disabled={isLoading}
                className="flex-1 rounded-[50px] border-2 font-ui text-base px-5 py-6 focus-visible:ring-[#7458e8]"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="rounded-[50px] border-2 border-[rgba(210,210,210,0.5)] bg-gradient-to-br from-[#7458e8] to-[#8d65e9] hover:from-[#8d65e9] hover:to-[#7458e8] text-white px-6 shadow-md transition-all duration-200 font-ui font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
