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
    <div className="h-screen flex flex-col bg-white dark:bg-[#13112a] transition-colors duration-300">
      {/* Header */}
      <header className="h-[70px] border-b border-[#e5e7eb] dark:border-[#2d2a4a] flex items-center justify-between px-6 bg-white dark:bg-[#13112a]">
        <div className="flex items-center gap-4">
          {/* Lyzr Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
              L
            </div>
            <span className="font-heading text-2xl font-semibold text-[#27272a] dark:text-white">Lyzr</span>
          </div>
          <div className="w-px h-6 bg-[#e5e7eb] dark:bg-[#2d2a4a]"></div>
          <h1 className="font-heading text-xl font-medium text-[#27272a] dark:text-white">Support Assistant</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f3f4f6] dark:hover:bg-[#2d2a4a] transition-colors"
          >
            {theme === 'light' ? (
              <FiMoon className="w-5 h-5 text-[#8f9bb7]" />
            ) : (
              <FiSun className="w-5 h-5 text-[#8f9bb7]" />
            )}
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
            <FiUser className="w-5 h-5" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[260px] border-r border-[#e5e7eb] dark:border-[#2d2a4a] bg-white dark:bg-[#13112a] flex flex-col">
            <div className="p-4 space-y-3">
              <button
                onClick={handleNewChat}
                className="lyzr-btn w-full flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                New Chat
              </button>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f9bb7]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#cbd5e0] dark:border-[#2d2a4a] bg-white dark:bg-[#1a1836] text-[#27272a] dark:text-white font-ui text-sm focus:outline-none focus:ring-2 focus:ring-[#7458e8]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-1 pb-4">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 font-ui ${
                      activeConversationId === conv.id
                        ? 'bg-[#f3f4f6] dark:bg-[#2d2a4a]'
                        : 'hover:bg-[#f9fafb] dark:hover:bg-[#1a1836]'
                    }`}
                  >
                    <div className="font-medium text-sm truncate text-[#27272a] dark:text-white">{conv.title}</div>
                    <div className="text-xs text-[#8f9bb7] mt-0.5">
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
          className="absolute top-4 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f3f4f6] dark:hover:bg-[#2d2a4a] transition-colors"
        >
          {sidebarOpen ? (
            <FiChevronLeft className="w-4 h-4 text-[#27272a] dark:text-white" />
          ) : (
            <FiMenu className="w-4 h-4 text-[#27272a] dark:text-white" />
          )}
        </button>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-12 px-6">
              {showPredefinedPrompts ? (
                <div>
                  <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
                        <RiSparklingFill className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h2 className="font-heading text-4xl md:text-5xl font-semibold mb-3 text-[#27272a] dark:text-white">
                      Hi! I'm your Lyzr Support Assistant
                    </h2>
                    <p className="font-body text-lg text-[#8f9bb7]">
                      Ask me anything about Lyzr's platform, APIs, or tutorials
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PREDEFINED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(prompt)}
                        className="lyzr-card-shadow p-5 rounded-lg border-2 border-[#e5e7eb] dark:border-[#2d2a4a] bg-white dark:bg-[#1a1836] hover:border-[#7458e8] dark:hover:border-[#7458e8] transition-all duration-200 text-left group"
                      >
                        <p className="font-ui text-sm font-medium text-[#27272a] dark:text-white group-hover:text-[#7458e8] transition-colors">
                          {prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {activeConversation?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 mb-8 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {message.role === 'agent' && (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
                          <RiRobot2Line className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                        <div
                          className={`rounded-2xl px-5 py-3.5 font-body ${
                            message.role === 'user'
                              ? 'text-white'
                              : 'bg-[#f3f4f6] dark:bg-[#1a1836] text-[#27272a] dark:text-white'
                          }`}
                          style={message.role === 'user' ? { background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' } : undefined}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                          {message.response && message.role === 'agent' && (
                            <div className="mt-5 space-y-4">
                              {/* Sources */}
                              {message.response.sources && message.response.sources.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold mb-2 text-[#8f9bb7] uppercase tracking-wide font-ui">
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
                                        <FiExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{source}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Related Topics */}
                              {message.response.related_topics && message.response.related_topics.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold mb-2 text-[#8f9bb7] uppercase tracking-wide font-ui">
                                    Related Topics
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.response.related_topics.map((topic, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs font-ui px-3 py-1 rounded-full bg-[#eddccd] dark:bg-[#2d2a4a] text-[#27272a] dark:text-white"
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
                                  <span className="text-xs font-ui px-3 py-1 rounded-full border-2 border-[#7458e8] text-[#7458e8]">
                                    Confidence: {(message.response.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-[#8f9bb7] mt-2 px-2 font-ui">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
                          <FiUser className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex gap-4 mb-8">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7458e8 0%, #8d65e9 100%)' }}>
                        <RiRobot2Line className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-[#f3f4f6] dark:bg-[#1a1836] rounded-2xl px-5 py-4">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#8f9bb7] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#8f9bb7] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#8f9bb7] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-[#e5e7eb] dark:border-[#2d2a4a] bg-white dark:bg-[#13112a] p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about Lyzr..."
                disabled={isLoading}
                className="flex-1 px-5 py-3 rounded-[50px] border-2 border-[#cbd5e0] dark:border-[#2d2a4a] bg-white dark:bg-[#1a1836] text-[#27272a] dark:text-white font-ui text-base focus:outline-none focus:ring-2 focus:ring-[#7458e8] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="lyzr-btn px-6 flex items-center justify-center"
              >
                {isLoading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
