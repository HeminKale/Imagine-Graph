import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Loader2, RefreshCw, PlusCircle, Sparkles, CheckSquare, Square, Check, XCircle } from 'lucide-react';
import { EvidenceFile, ChatMessage, GraphNode } from '../types';
import { createEvidenceChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { GRAPH_COLORS } from '../constants';

interface Props {
  files: EvidenceFile[];
  isOpen: boolean;
  onClose: () => void;
  onNodeCreate: (node: GraphNode) => void;
}

interface NodeSuggestion {
  label: string;
  type: 'ENTITY' | 'EVENT' | 'CONFLICT';
  reason: string;
}

export const ChatInterface: React.FC<Props> = ({ files, isOpen, onClose, onNodeCreate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  // Smart Create State
  const [isReviewingSuggestions, setIsReviewingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevFileCountRef = useRef(0);

  // Initialize chat when opened or files change
  useEffect(() => {
    const initChat = async () => {
      if (files.length === 0) return;
      if (files.length === prevFileCountRef.current && chatSession) return;

      setIsInitializing(true);
      try {
        const rawFiles = files.map(f => f.file);
        const chat = await createEvidenceChat(rawFiles);
        setChatSession(chat);
        setMessages([
          {
            id: 'init',
            role: 'model',
            text: "Forensic Assistant Online. I have analyzed the evidence files. Ask me about contradictions, timelines, or entities.",
            timestamp: new Date()
          }
        ]);
        prevFileCountRef.current = files.length;
      } catch (e) {
        console.error(e);
      } finally {
        setIsInitializing(false);
      }
    };

    if (isOpen) {
      initChat();
    }
  }, [isOpen, files, chatSession]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReviewingSuggestions]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !textOverride) || !chatSession || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await chatSession.sendMessage({ message: textToSend });
      
      if (response.text) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-bot',
          role: 'model',
          text: response.text,
          timestamp: new Date()
        }]);
      }

      // Intercept Tool Calls - Require Approval
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
         for (const call of functionCalls) {
             if (call.name === 'create_node') {
                 // Do not create node immediately. Create a PENDING message.
                 setMessages(prev => [...prev, {
                     id: `tool-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                     role: 'model',
                     text: 'I suggest adding this to the graph:',
                     timestamp: new Date(),
                     toolCall: {
                         id: call.id,
                         name: call.name,
                         args: call.args
                     },
                     toolStatus: 'pending'
                 }]);
             }
         }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Error communicating with AI service.",
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToolAction = async (messageId: string, action: 'confirm' | 'reject') => {
      const msgIndex = messages.findIndex(m => m.id === messageId);
      if (msgIndex === -1 || !chatSession) return;
      
      const msg = messages[msgIndex];
      if (!msg.toolCall) return;

      // Update UI state immediately
      const newStatus = action === 'confirm' ? 'success' : 'rejected';
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, toolStatus: newStatus } : m));

      if (action === 'confirm') {
          // 1. Create the node
          const args = msg.toolCall.args as any;
          const newNode: GraphNode = {
              id: `ai-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
              label: args.label,
              type: args.type,
              properties: {
                  description: args.description,
                  timestamp: args.timestamp,
                  source: 'AI_CHAT_APPROVED',
                  custom_color: GRAPH_COLORS.selected
              }
          };
          onNodeCreate(newNode);

          // 2. Send Success to Model
          setIsSending(true);
          try {
              const toolResponse = await chatSession.sendMessage({
                  message: {
                      functionResponses: [{
                          id: msg.toolCall.id,
                          name: msg.toolCall.name,
                          response: { result: "User approved. Node created successfully." }
                      }]
                  }
              });
              if (toolResponse.text) {
                  setMessages(prev => [...prev, {
                      id: Date.now().toString() + '-followup',
                      role: 'model',
                      text: toolResponse.text,
                      timestamp: new Date()
                  }]);
              }
          } catch(e) {
              console.error(e);
          } finally {
              setIsSending(false);
          }
      } else {
          // Reject
          setIsSending(true);
          try {
              const toolResponse = await chatSession.sendMessage({
                  message: {
                      functionResponses: [{
                          id: msg.toolCall.id,
                          name: msg.toolCall.name,
                          response: { result: "User rejected the proposal." }
                      }]
                  }
              });
              if (toolResponse.text) {
                  setMessages(prev => [...prev, {
                      id: Date.now().toString() + '-followup',
                      role: 'model',
                      text: toolResponse.text,
                      timestamp: new Date()
                  }]);
              }
          } catch(e) {
              console.error(e);
          } finally {
              setIsSending(false);
          }
      }
  };

  const handleSmartCreate = async () => {
      if (!chatSession) return;
      setIsSending(true);
      setIsReviewingSuggestions(false);
      
      try {
         const prompt = `
           Based on the evidence and our conversation, identify 3-5 potential entities or events that are missing from the current graph but are important.
           Return a strict JSON array of objects.
           Schema: [{"label": "string", "type": "ENTITY|EVENT|CONFLICT", "reason": "Short reason why this is needed"}]
           Do NOT call the create_node tool. Return ONLY raw JSON.
         `;
         
         const result = await chatSession.sendMessage({ message: prompt });
         let text = result.text || "[]";
         // Clean JSON
         text = text.replace(/```json/g, '').replace(/```/g, '').trim();
         
         let json: NodeSuggestion[] = [];
         try {
             json = JSON.parse(text);
         } catch(e) {
             console.error("Failed to parse JSON suggestions", text);
             setMessages(prev => [...prev, { id: 'err', role: 'model', text: "I couldn't generate a structured list. Please try again.", timestamp: new Date() }]);
             setIsSending(false);
             return;
         }

         setSuggestions(json);
         setSelectedIndices(new Set(json.map((_, i) => i))); // Select all by default
         setIsReviewingSuggestions(true);

      } catch (e) {
          console.error(e);
      } finally {
          setIsSending(false);
      }
  };

  const toggleSuggestion = (idx: number) => {
      const newSet = new Set(selectedIndices);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      setSelectedIndices(newSet);
  };

  const confirmSuggestions = () => {
      let count = 0;
      suggestions.forEach((s, i) => {
          if (selectedIndices.has(i)) {
              count++;
              const newNode: GraphNode = {
                 id: `smart-${Date.now()}-${i}`,
                 label: s.label,
                 type: s.type as any,
                 properties: {
                     description: s.reason,
                     source: 'SMART_CREATE',
                     custom_color: GRAPH_COLORS.suggestion, // Yellow
                     created_at: new Date().toISOString()
                 }
              };
              onNodeCreate(newNode);
          }
      });
      
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `Added ${count} new nodes to the graph (Yellow). You can now manually connect them.`,
          timestamp: new Date()
      }]);
      
      setIsReviewingSuggestions(false);
      setSuggestions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-0 bottom-0 w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <Bot className="text-cyan-400" size={20} />
          <h2 className="font-semibold text-slate-200">Forensic Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={20} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
        {isInitializing && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Loader2 className="animate-spin text-cyan-500" size={24} />
            <p className="text-sm">Initializing context...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
             <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${msg.role === 'user' ? 'bg-slate-700' : 'bg-cyan-900/30'}
                `}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-cyan-400" />}
                </div>
                
                <div className={`
                  max-w-[85%] rounded-lg p-3 text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }
                `}>
                  {msg.text && <div className="markdown-prose" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />}
                  
                  {/* Tool Call Approval Card */}
                  {msg.toolCall && (
                      <div className="mt-3 bg-slate-950 rounded border border-slate-800 p-3">
                         <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs uppercase font-bold tracking-wider">
                             <PlusCircle size={12} /> Proposed Node
                         </div>
                         <div className="mb-2">
                             <div className="text-white font-bold">{msg.toolCall.args.label}</div>
                             <div className="text-xs text-slate-500 font-mono">{msg.toolCall.args.type}</div>
                             {msg.toolCall.args.description && <div className="text-xs text-slate-400 mt-1">{msg.toolCall.args.description}</div>}
                         </div>
                         
                         {msg.toolStatus === 'pending' && (
                             <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={() => handleToolAction(msg.id, 'reject')}
                                   className="flex-1 py-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 rounded text-xs font-medium border border-transparent hover:border-rose-900 transition-all flex items-center justify-center gap-1"
                                 >
                                     <XCircle size={12} /> Reject
                                 </button>
                                 <button 
                                   onClick={() => handleToolAction(msg.id, 'confirm')}
                                   className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
                                 >
                                     <Check size={12} /> Create
                                 </button>
                             </div>
                         )}

                         {msg.toolStatus === 'success' && (
                             <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/50">
                                 <Check size={12} /> Approved & Created
                             </div>
                         )}
                         {msg.toolStatus === 'rejected' && (
                             <div className="mt-2 text-xs text-rose-400 flex items-center gap-1 bg-rose-950/30 p-1.5 rounded border border-rose-900/50">
                                 <XCircle size={12} /> Rejected
                             </div>
                         )}
                      </div>
                  )}

                  <span className="text-[10px] text-slate-500 mt-1 block opacity-60">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
            </div>
          </div>
        ))}
        
        {/* Suggestion Review UI */}
        {isReviewingSuggestions && (
            <div className="bg-slate-900 border border-yellow-500/30 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-3 text-yellow-400">
                    <Sparkles size={16} />
                    <span className="font-bold text-sm">Potential Nodes Detected</span>
                </div>
                <div className="space-y-2 mb-4">
                    {suggestions.map((s, idx) => (
                        <div 
                           key={idx} 
                           onClick={() => toggleSuggestion(idx)}
                           className="flex items-start gap-3 p-2 rounded bg-slate-950/50 border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors"
                        >
                            <div className={`mt-0.5 ${selectedIndices.has(idx) ? 'text-cyan-400' : 'text-slate-600'}`}>
                                {selectedIndices.has(idx) ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-200">{s.label}</span>
                                    <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400 uppercase">{s.type}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-tight mt-1">{s.reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setIsReviewingSuggestions(false); setSuggestions([]); }}
                        className="flex-1 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmSuggestions}
                        className="flex-1 py-2 text-xs font-bold bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors shadow-lg shadow-yellow-900/20"
                    >
                        Create Selected ({selectedIndices.size})
                    </button>
                </div>
            </div>
        )}

        {isSending && (
           <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-cyan-400" />
              </div>
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-2">
          
          <div className="flex gap-2">
            <button 
                onClick={handleSmartCreate}
                disabled={isSending || isInitializing || isReviewingSuggestions}
                className="p-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all flex-shrink-0"
                title="Smart Create Nodes"
            >
                <Sparkles size={18} />
            </button>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about evidence..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                disabled={isSending || isInitializing}
            />
            <button
                onClick={() => handleSendMessage()}
                disabled={isSending || isInitializing || !input.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
                <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
