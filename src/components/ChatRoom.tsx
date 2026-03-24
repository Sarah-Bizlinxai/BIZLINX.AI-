import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, ShieldCheck, Zap, X, Terminal } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface ChatRoomProps {
  dealId: string;
  currentUserId: string;
  otherUserId: string;
  onClose: () => void;
  title: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ dealId, currentUserId, otherUserId, onClose, title }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    };
    fetchOtherUser();
  }, [otherUserId]);

  useEffect(() => {
    const q = query(
      collection(db, 'deals', dealId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [dealId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'deals', dealId, 'messages'), {
        senderId: currentUserId,
        text: newMessage,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl h-[80vh] bg-surface border-2 border-primary/30 rounded-[40px] shadow-[0_0_50px_rgba(45,212,191,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">{title}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  SECURE CHANNEL: {otherUser?.displayName || 'ENCRYPTED USER'}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm scrollbar-hide"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <ShieldCheck className="w-12 h-12" />
              <p className="uppercase tracking-[0.3em] text-xs">Waiting for transmission...</p>
            </div>
          )}
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl border ${
                msg.senderId === currentUserId 
                  ? 'bg-primary/10 border-primary/30 text-primary rounded-tr-none' 
                  : 'bg-surface border-white/10 text-gray-300 rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.text}</p>
                <p className="text-[8px] mt-2 opacity-50 text-right">
                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : 'SENDING...'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-primary/10 bg-background/50">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="ENTER TRANSMISSION..." 
              className="flex-1 bg-background border border-primary/30 rounded-2xl px-6 py-4 text-primary font-mono focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all"
            />
            <button 
              type="submit"
              className="bg-primary text-background p-4 rounded-2xl hover:opacity-80 transition-all active:scale-95 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
