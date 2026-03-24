import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Sparkles,
  PieChart,
  Users,
  MapPin,
  Calendar,
  Lock,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Listing } from '../services/geminiService';

interface ListingDetailProps {
  listing: Listing;
  onClose: () => void;
  onRequestContact: (listing: Listing) => void;
  matchScore?: number;
  userRole: 'buyer' | 'seller' | 'admin';
}

export const ListingDetail: React.FC<ListingDetailProps> = ({ 
  listing, 
  onClose, 
  onRequestContact, 
  matchScore,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'ai-analysis'>('overview');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col relative shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-primary border border-primary/30 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                {listing.industry}
              </span>
              {matchScore && (
                <div className="flex items-center gap-1 text-[10px] font-black text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>{matchScore}% MATCH</span>
                </div>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">{listing.title}</h2>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> LISTED 2 DAYS AGO</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SECURE ASSET</span>
              {listing.sourceUrl && (
                <a 
                  href={listing.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="w-3 h-3" /> SOURCE: BIZBUYSELL
                </a>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-8 bg-white">
          {(['overview', 'financials', 'ai-analysis'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asking Price</p>
                    <p className="text-2xl font-black text-primary">${listing.askingPrice.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Revenue</p>
                    <p className="text-2xl font-black text-slate-900">${listing.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">EBITDA</p>
                    <p className="text-2xl font-black text-slate-900">${listing.ebitda.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Executive Summary</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {listing.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Key Highlights</h3>
                    <ul className="space-y-3">
                      {[
                        "High recurring revenue (85%+)",
                        "Low customer concentration",
                        "Scalable infrastructure",
                        "Experienced management team in place"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Asset Profile</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Employees</span>
                        <span className="text-xs font-bold text-slate-700">12 Full-time</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Year Founded</span>
                        <span className="text-xs font-bold text-slate-700">2018</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Inventory Included</span>
                        <span className="text-xs font-bold text-slate-700">Yes ($45k value)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'financials' && (
              <motion.div 
                key="financials"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="game-card p-8 rounded-[40px] border-slate-100 bg-slate-50/30">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Financial Performance
                  </h3>
                  <div className="space-y-6">
                    <div className="h-48 flex items-end gap-4 px-4">
                      {[45, 60, 55, 80, 75, 90].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-t-xl relative group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-xl group-hover:bg-primary/80 transition-all"
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all">
                            ${(h * 10).toLocaleString()}k
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>2019</span>
                      <span>2020</span>
                      <span>2021</span>
                      <span>2022</span>
                      <span>2023</span>
                      <span>2024 (PROJ)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Revenue Mix</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Subscription</span>
                          <span>75%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[75%]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Professional Services</span>
                          <span>15%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary w-[15%]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Other</span>
                          <span>10%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-300 w-[10%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Margin Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gross Margin</p>
                        <p className="text-xl font-black text-slate-900">82%</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">EBITDA Margin</p>
                        <p className="text-xl font-black text-slate-900">34%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai-analysis' && (
              <motion.div 
                key="ai-analysis"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="p-8 bg-primary/5 border border-primary/20 rounded-[40px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="w-32 h-32 text-primary" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">AI Broker Analysis</h3>
                    </div>
                    
                    <div className="space-y-6 text-slate-700 leading-relaxed">
                      <div className="space-y-2">
                        <p className="text-xs font-black text-primary uppercase tracking-widest">The Opportunity</p>
                        <p>This {listing.industry} asset shows exceptional operational efficiency with EBITDA margins significantly above industry average (34% vs 22%). The high recurring revenue provides a stable floor for valuation.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-xs font-black text-green-600 uppercase tracking-widest">Strengths</p>
                          <ul className="text-sm space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Proprietary tech stack</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Low churn rate (2.4%)</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Clean financial records</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Risk Factors</p>
                          <ul className="text-sm space-y-2">
                            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> Competitive market entry</li>
                            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> Key-man dependency (Founder)</li>
                            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> Tech debt in legacy modules</li>
                          </ul>
                        </div>
                      </div>

                      <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Valuation Verdict</p>
                        <p className="font-bold text-slate-900">The asking price of ${listing.askingPrice.toLocaleString()} represents a 4.2x EBITDA multiple, which is slightly aggressive but justified by the growth trajectory and recurring revenue quality.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3 other buyers viewing this asset</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Close
            </button>
            {userRole === 'buyer' && (
              <button 
                onClick={() => onRequestContact(listing)}
                className="neon-button px-10 py-4 rounded-2xl text-xs flex items-center gap-3"
              >
                <span>Request Contact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
