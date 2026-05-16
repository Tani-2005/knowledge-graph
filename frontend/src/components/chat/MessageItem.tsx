import { Terminal, Network } from 'lucide-react';
import type { Message } from '../../store/useAppStore';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div 
        className={`max-w-[85%] p-4 rounded-2xl ${
          isUser 
            ? 'bg-primary-color text-white rounded-br-sm' 
            : 'bg-black/30 border border-border-color text-textPrimary rounded-bl-sm'
        }`}
      >
        {/* If Assistant, show an icon */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-accent/80">
            <Network size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">AI Assistant</span>
          </div>
        )}
        
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
      
      {/* Cypher Query block */}
      {message.cypher && (
        <div className="mt-2 max-w-[85%] bg-[#0a0a0a] border border-border-color/50 rounded-xl p-3 text-xs font-mono text-textSecondary flex flex-col gap-2">
          <div className="flex items-center gap-2 text-accent">
            <Terminal size={14} /> 
            <span className="font-semibold tracking-wider">Generated Cypher</span>
          </div>
          <code className="text-[#a5b4fc] whitespace-pre-wrap word-break-all">
            {message.cypher}
          </code>
        </div>
      )}
    </div>
  );
}
