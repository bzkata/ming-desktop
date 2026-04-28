import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
      <div className="w-80 bg-background border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Agents</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus size={18} />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setMessages([]);
                }}
                className={cn(
                  'w-full text-left p-4 rounded-lg transition-all',
                  selectedAgent?.id === agent.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-secondary'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Bot size={20} />
                  <span className="font-medium">{agent.name}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {agent.model}
                </Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedAgent && (
          <>
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={24} className="text-primary" />
                  <div>
                    <h3 className="font-semibold">{selectedAgent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Bot size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with {selectedAgent?.name || 'an agent'}</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User size={20} />
                    ) : (
                      <Bot size={20} />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-2xl p-4 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bot size={20} />
                </div>
                <div className="bg-card px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        {selectedAgent && (
          <>
            <Separator />
            <div className="p-4 bg-background">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedAgent.name}...`}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="default"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
