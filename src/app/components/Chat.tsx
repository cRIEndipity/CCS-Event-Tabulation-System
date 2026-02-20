import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Send, User, ShieldCheck, MessageCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const Chat: React.FC = () => {
  const { messages, addMessage, currentUser, refreshData } = useApp();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 3 seconds while on this screen
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      refreshData().finally(() => setIsRefreshing(false));
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const isAdmin = currentUser.email === 'ccstabulationadmin@soft.ui';
    
    setIsSending(true);
    try {
      await addMessage({
        senderEmail: currentUser.email || 'anonymous',
        senderName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        content: newMessage.trim(),
        role: isAdmin ? 'Admin' : 'Representative'
      });
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      return format(new Date(isoString), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  const isAdmin = (email: string) => email === 'ccstabulationadmin@soft.ui';

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-inner">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Internal Communication</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">CCS Tabulation Team Channel</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
          <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'animate-pulse' : 'animate-pulse'}`} style={{ backgroundColor: isRefreshing ? '#fbbf24' : '#22c55e' }}></div>
          <span className="text-xs font-semibold text-slate-300">{isRefreshing ? 'Refreshing...' : 'Live Connection'}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <MessageCircle size={48} className="text-slate-200" />
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation with the tabulation team.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderEmail === currentUser?.email;
            const showDateHeader = index === 0 || 
              new Date(messages[index-1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex justify-center my-6">
                    <span className="px-4 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {format(new Date(msg.timestamp), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isMe && (
                        <span className="text-xs font-bold text-slate-700">
                          {msg.senderName}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                        msg.role === 'Admin' 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {msg.role}
                      </span>
                      {isMe && (
                        <span className="text-xs font-bold text-slate-500">
                          You
                        </span>
                      )}
                    </div>

                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm border ${
                      isMe 
                        ? 'bg-blue-900 text-white border-blue-800 rounded-tr-none' 
                        : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`text-[9px] mt-1.5 font-medium flex items-center gap-1 ${isMe ? 'text-blue-300' : 'text-slate-400'}`}>
                        <Clock size={10} />
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && !isSending) {
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none resize-none disabled:bg-slate-100 disabled:opacity-50"
              rows={3}
              disabled={isSending}
              maxLength={1000}
            />
            <div className="text-xs text-slate-400 mt-1">{newMessage.length}/1000</div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Send message (or Ctrl+Enter)"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {!isSending && <span className="hidden sm:inline">Send</span>}
          </button>
        </form>
      </div>
    </div>
  );
};