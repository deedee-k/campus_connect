import { useState, useRef, useEffect } from 'react';
import { askAiChat } from '../../services/ai';
import { Bot, Send, X } from 'lucide-react';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm the CampusConnect AI. I can help you estimate prices for electronics, or answer questions about the marketplace. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const reply = await askAiChat(userMsg);
    setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-violet-700 hover:scale-105 transition-transform z-50"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-violet-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Bot size={20} /> AI Assistant
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-violet-700 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => {
          const isMe = m.sender === 'user';
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-violet-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
                {/* Render basic bold text by replacing ** with <b> */}
                {m.text.split('**').map((part, index) => index % 2 === 1 ? <b key={index}>{part}</b> : part)}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-2xl rounded-bl-none text-slate-500 text-sm italic shadow-sm">
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t bg-white rounded-b-2xl flex gap-2">
        <input 
          className="flex-1 text-sm outline-none px-3 py-2 bg-slate-100 rounded-lg focus:ring-2 focus:ring-violet-400" 
          placeholder="Ask about prices, safety, etc..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button disabled={loading || !input.trim()} className="bg-violet-600 text-white p-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}