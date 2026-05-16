import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import MessageItem from './MessageItem';
import { graphApi } from '../../services/api';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

// Helper to parse graph data
function extractGraphData(results: any[]) {
  const nodesMap = new Map<string, any>();
  const links: any[] = [];

  const processNode = (node: any) => {
    if (!node) return;
    const id = node.elementId || node.id || node.name || node.title;
    if (!id) return;

    if (!nodesMap.has(id)) {
      const labels = node.labels || [];
      const type = labels.length > 0 ? labels[0] : (node.type || 'Entity');
      nodesMap.set(id, {
        id: String(id),
        label: node.name || node.title || node.id || id,
        type: type,
        ...node.properties,
        ...node
      });
    }
  };

  const processRelationship = (rel: any) => {
    if (!rel || !rel.startNodeElementId || !rel.endNodeElementId) return;
    links.push({
      source: String(rel.startNodeElementId),
      target: String(rel.endNodeElementId),
      type: rel.type || 'RELATES_TO',
      ...rel.properties
    });
  };

  const traverse = (obj: any) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object') {
      if (obj.labels !== undefined) {
        processNode(obj);
      } else if (obj.startNodeElementId !== undefined && obj.endNodeElementId !== undefined) {
        processRelationship(obj);
      } else if (obj.nodes && obj.relationships) {
        obj.nodes.forEach(processNode);
        obj.relationships.forEach(processRelationship);
      } else {
        Object.values(obj).forEach(traverse);
      }
    }
  };

  traverse(results);

  if (nodesMap.size === 0 && results.length > 0) {
    results.forEach((row, i) => {
      const rowId = `row-${i}`;
      nodesMap.set(rowId, { id: rowId, label: `Result ${i+1}`, type: 'Result' });
      Object.entries(row).forEach(([k, v]) => {
        if (typeof v === 'string' || typeof v === 'number') {
           const valId = `val-${v}`;
           nodesMap.set(valId, { id: valId, label: String(v), type: k });
           links.push({ source: rowId, target: valId, type: 'HAS_PROPERTY' });
        }
      });
    });
  }

  return { nodes: Array.from(nodesMap.values()), links };
}

export default function ChatInterface() {
  const { messages, addMessage, isChatLoading, setIsChatLoading, setGraphData } = useAppStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const query = input.trim();
    setInput('');
    addMessage({ id: uuidv4(), role: 'user', content: query });
    setIsChatLoading(true);

    try {
      const res = await graphApi.queryGraph(query);
      const newGraphData = extractGraphData(res.results || []);
      
      if (newGraphData.nodes.length > 0) {
         setGraphData(newGraphData as any);
      }

      addMessage({ 
        id: uuidv4(), 
        role: 'assistant', 
        content: res.answer || 'Here is what I found.', 
        cypher: res.cypher 
      });
    } catch (error: any) {
      console.error(error);
      addMessage({ 
        id: uuidv4(), 
        role: 'assistant', 
        content: `Error: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Card className="w-full flex flex-col pointer-events-auto bg-surface-color/90 border-border-color shadow-2xl overflow-hidden max-h-[60vh] rounded-2xl mb-4">
      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 max-h-[400px]">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {isChatLoading && (
            <div className="flex items-center gap-3 text-textSecondary px-4">
              <Loader2 size={18} className="animate-spin text-accent" />
              <span className="text-sm">Analyzing graph...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-black/20 border-t border-border-color">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Sparkles size={18} className="absolute left-4 text-accent" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your research graph..."
            disabled={isChatLoading}
            className="pl-12 pr-12 py-6 bg-transparent border-none text-base focus-visible:ring-0 shadow-none"
          />
          <button
            type="submit"
            disabled={isChatLoading || !input.trim()}
            className="absolute right-3 p-2 bg-primary-color hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary-color rounded-xl text-white transition-colors"
          >
            <Send size={16} className={isChatLoading ? "opacity-50" : ""} />
          </button>
        </form>
      </div>
    </Card>
  );
}
