import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Network } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cypher?: string;
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (query: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-panel glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '400px',
      minWidth: '350px',
      borderRight: '1px solid var(--border-color)',
    }}>
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: 'var(--primary-color)',
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Network size={24} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>KG Explorer</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Discover relationships</p>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Network size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Ask a question about the graph to begin.</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Try: "Find models that use the metric accuracy"</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
              
              {msg.cypher && (
                <div style={{
                  marginTop: '8px',
                  maxWidth: '85%',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6' }}>
                    <Terminal size={12} /> Cypher Query
                  </div>
                  <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{msg.cypher}</code>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
            <span>Querying graph...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '24px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (isLoading || !input.trim()) ? 0.5 : 1,
              cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
