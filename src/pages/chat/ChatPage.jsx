import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../../hooks/useListings';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { askAiChat } from '../../services/ai';

export default function ChatPage() {
  const { id: listingId } = useParams();
  const nav = useNavigate();
  const { data: listing } = useListing(listingId);
  
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm the CampusConnect AI assistant. Ask me about pricing, blockchain verification, or safety tips!" }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isTyping) return;

    const userMsg = newMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setNewMessage('');
    setIsTyping(true);

    const aiReply = await askAiChat(userMsg);
    
    setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    setIsTyping(false);
  };

  if (!listing) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto card h-[80vh] flex flex-col shadow-lg border-violet-100">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-white rounded-t-2xl">
        <button onClick={() => nav(-1)} className="btn-ghost p-1"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <Bot size={18} className="text-violet-600"/> AI Assistant
          </h2>
          <p className="text-xs text-slate-500">Asking about: {listing.title}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => {
          const isMe = m.sender === 'user';
          return (
            <div key={i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0"><Bot size={16} className="text-violet-600"/></div>}
              
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-violet-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
                {m.text}
              </div>
              
              {isMe && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><User size={16} className="text-slate-500"/></div>}
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0"><Bot size={16} className="text-violet-600"/></div>
            <div className="bg-white border p-3 rounded-2xl rounded-bl-none text-slate-500 text-sm italic">
              AI is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2 rounded-b-2xl">
        <input 
          className="input flex-1" 
          placeholder="Ask the AI assistant..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isTyping}
        />
        <button disabled={isTyping || !newMessage.trim()} className="btn-primary px-4">
          <Send size={18}/>
        </button>
      </form>
    </div>
  );
}