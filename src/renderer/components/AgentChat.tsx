import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Plus, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export default function AgentChat() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAgents = async () => {
    try {
      const result = await window.electronAPI.agents.list();
      setAgents(result);
      if (result.length > 0) {
        setSelectedAgent(result[0]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedAgent || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await window.electronAPI.agents.chat(selectedAgent.id, input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex">
      {/* Agent List */}
      <div className="w-80 bg-dark-900 border-r border-dark-800 flex flex-col">
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Agents</h2>
            <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent);
                setMessages([]);
              }}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedAgent?.id === agent.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Bot size={20} />
                <span className="font-medium">{agent.name}</span>
              </div>
              <p className="text-sm opacity-80 line-clamp-2">{agent.description}</p>
              <div className="mt-2 text-xs opacity-60">{agent.model}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedAgent && (
          <div className="p-4 border-b border-dark-800 bg-dark-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot size={24} className="text-primary-400" />
                <div>
                  <h3 className="font-semibold">{selectedAgent.name}</h3>
                  <p className="text-sm text-gray-400">{selectedAgent.description}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p>Start a conversation with {selectedAgent?.name || 'an agent'}</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600'
                      : 'bg-dark-700'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div
                  className={`max-w-2xl p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600'
                      : 'bg-dark-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-dark-700">
                <Bot size={20} />
              </div>
              <div className="bg-dark-800 px-4 py-2 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedAgent && (
          <div className="p-4 border-t border-dark-800 bg-dark-900">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${selectedAgent.name}...`}
                disabled={isLoading}
                className="flex-1 input"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="btn-primary px-6"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
