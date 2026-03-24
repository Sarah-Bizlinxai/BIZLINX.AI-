import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, Heart, Info, Globe, Briefcase, Activity } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  summary: string;
  industry: string;
  revenue: number;
  ebitda: number;
  askingPrice: number;
  imageUrl: string;
  matchScore?: number;
}

interface SwipeInterfaceProps {
  listings: Listing[];
  onSwipe: (listingId: string, direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<{ listing: Listing; onSwipe: (direction: 'left' | 'right') => void }> = ({ listing, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const heartOpacity = useTransform(x, [50, 150], [0, 1]);
  const xOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, position: 'absolute' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="w-full max-w-md aspect-[3/4] bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="relative h-full">
        <img 
          src={listing.imageUrl || `https://picsum.photos/seed/${listing.id}/800/1200`} 
          alt={listing.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />

        <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 right-10 bg-primary/20 backdrop-blur-md border border-primary/50 p-4 rounded-full text-primary">
          <Heart className="w-8 h-8 fill-primary" />
        </motion.div>

        <motion.div style={{ opacity: xOpacity }} className="absolute top-10 left-10 bg-red-500/20 backdrop-blur-md border border-red-500/50 p-4 rounded-full text-red-500">
          <X className="w-8 h-8" />
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-1 rounded uppercase tracking-[0.2em] w-fit">
              {listing.industry}
            </span>
            <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">{listing.title}</h2>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2">{listing.summary}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Revenue</p>
              <p className="text-lg font-bold text-slate-800">${listing.revenue.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Asking Price</p>
              <p className="text-lg font-bold text-primary">${listing.askingPrice.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-4">
            <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-secondary" style={{ width: `${listing.matchScore || 85}%` }} />
            </div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {listing.matchScore ? `${listing.matchScore}% AI PREDICTION` : '85% Match'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const SwipeInterface: React.FC<SwipeInterfaceProps> = ({ listings, onSwipe }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    onSwipe(listings[currentIndex].id, direction);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center">
        <AnimatePresence>
          {currentIndex < listings.length ? (
            <SwipeCard 
              key={listings[currentIndex].id} 
              listing={listings[currentIndex]} 
              onSwipe={handleSwipe} 
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                <Globe className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter italic">Network Exhausted</h2>
                <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Scanning for new opportunities...</p>
              </div>
              <button 
                onClick={() => setCurrentIndex(0)}
                className="text-xs text-primary font-bold uppercase tracking-[0.3em] hover:opacity-80 transition-all"
              >
                Reset Feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-8 mt-12">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm transition-all active:scale-90"
        >
          <X className="w-8 h-8" />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-white border border-primary/10 flex items-center justify-center text-primary hover:bg-primary/5 shadow-sm transition-all active:scale-90"
        >
          <Heart className="w-8 h-8 fill-primary" />
        </button>
      </div>
    </div>
  );
};
