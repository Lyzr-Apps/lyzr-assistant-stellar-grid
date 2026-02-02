import { useState, useEffect, useRef } from 'react'
import { FiSend, FiSun, FiMoon, FiMenu, FiPlus, FiSearch, FiUser, FiChevronLeft, FiLoader, FiExternalLink } from 'react-icons/fi'
import { RiRobot2Line, RiSparklingFill } from 'react-icons/ri'
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

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      {/* Header - Minimal architect.new style */}
      <header className="h-14 border-b border-black/30 dark:border-white/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black dark:bg-white rounded"></div>
            <span className="text-sm font-medium">Lyzr Support</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
          >
            {theme === 'light' ? (
              <FiMoon className="w-4 h-4" />
            ) : (
              <FiSun className="w-4 h-4" />
            )}
          </button>
          <div className="w-8 h-8 border border-black/30 dark:border-white/30 rounded-full flex items-center justify-center text-xs">
            U
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Minimal style */}
        {sidebarOpen && (
          <aside className="w-60 border-r border-black/30 dark:border-white/30 flex flex-col">
            <div className="p-3 space-y-2">
              <button
                onClick={handleNewChat}
                className="architect-btn w-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent border border-black/30 dark:border-white/30 rounded focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-0.5 pb-3">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left px-2.5 py-2 rounded text-sm transition-colors ${
                      activeConversationId === conv.id
                        ? 'bg-black/5 dark:bg-white/5'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="font-medium truncate text-xs">{conv.title}</div>
                    <div className="text-[10px] opacity-50 mt-0.5">
                      {new Date(conv.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-16 left-2 z-10 w-7 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
        >
          {sidebarOpen ? (
            <FiChevronLeft className="w-4 h-4" />
          ) : (
            <FiMenu className="w-4 h-4" />
          )}
        </button>

        {/* Main Chat Area - Architect.new style */}
        <main className="flex-1 flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-8 px-6">
              {showPredefinedPrompts ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="w-full max-w-2xl space-y-6">
                    <div className="text-center space-y-2">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-lg"></div>
                      </div>
                      <h1 className="text-2xl font-medium">Lyzr Support Assistant</h1>
                      <p className="text-sm opacity-60">Ask me anything about Lyzr's platform, APIs, or tutorials</p>
                    </div>

                    <div className="grid gap-2">
                      {PREDEFINED_PROMPTS.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(prompt)}
                          className="architect-btn text-left p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <p className="text-sm">{prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeConversation?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {message.role === 'agent' && (
                        <div className="w-7 h-7 rounded-full border border-black/30 dark:border-white/30 flex items-center justify-center flex-shrink-0 text-xs">
                          A
                        </div>
                      )}

                      <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`inline-block px-4 py-2.5 rounded-lg text-sm ${
                            message.role === 'user'
                              ? 'bg-black dark:bg-white text-white dark:text-black'
                              : 'bg-black/5 dark:bg-white/5'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                          {message.response && message.role === 'agent' && (
                            <div className="mt-4 space-y-3 pt-3 border-t border-black/10 dark:border-white/10">
                              {/* Sources */}
                              {message.response.sources && message.response.sources.length > 0 && (
                                <div>
                                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1.5">Sources</p>
                                  <div className="space-y-1">
                                    {message.response.sources.map((source, idx) => (
                                      <a
                                        key={idx}
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs hover:opacity-60 transition-opacity"
                                      >
                                        <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{source}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Related Topics */}
                              {message.response.related_topics && message.response.related_topics.length > 0 && (
                                <div>
                                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1.5">Related</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {message.response.related_topics.map((topic, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 rounded border border-black/20 dark:border-white/20"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Confidence Score */}
                              {message.response.confidence && message.response.confidence > 0.7 && (
                                <div>
                                  <span className="text-xs px-2 py-0.5 rounded border border-black/20 dark:border-white/20">
                                    {(message.response.confidence * 100).toFixed(0)}% confident
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] opacity-40 mt-1 px-1">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-7 h-7 rounded-full border border-black/30 dark:border-white/30 flex items-center justify-center flex-shrink-0 text-xs">
                          U
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full border border-black/30 dark:border-white/30 flex items-center justify-center flex-shrink-0 text-xs">
                        A
                      </div>
                      <div className="bg-black/5 dark:bg-white/5 rounded-lg px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Architect.new style */}
          <div className="border-t border-black/30 dark:border-white/30 p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about Lyzr..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm bg-transparent border border-black/30 dark:border-white/30 rounded-lg focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="architect-btn bg-black dark:bg-white text-white dark:text-black px-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
