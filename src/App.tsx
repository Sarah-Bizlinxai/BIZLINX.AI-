import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  FirebaseUser,
  OperationType,
  handleFirestoreError
} from './firebase';
import { 
  Search, 
  LayoutDashboard, 
  Briefcase, 
  Handshake, 
  User, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  BarChart3,
  Megaphone,
  Calculator,
  ClipboardList,
  ClipboardCheck,
  MapPin, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  FileUp,
  X,
  Sparkles,
  Menu,
  Zap,
  Target,
  Trophy,
  Activity,
  Cpu,
  Terminal,
  Lock,
  Eye,
  Globe,
  Users,
  Settings,
  Heart,
  CreditCard,
  Fingerprint,
  Rocket,
  GraduationCap,
  FileQuestion,
  PieChart,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  FileSearch,
  Mail,
  BookOpen,
  PlayCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getMatches, 
  getDueDiligenceChecklist, 
  Listing, 
  UserPreferences,
  getAiBrokerConsultation,
  calculateMatchScore,
  crawlBizBuySell
} from './services/geminiService';
import { Onboarding } from './components/Onboarding';
import { SwipeInterface } from './components/SwipeInterface';
import { ListingDetail } from './components/ListingDetail';

// --- Types ---
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'buyer' | 'seller' | 'admin';
  level: number;
  xp: number;
  verified: boolean;
  onboardingCompleted: boolean;
  backgroundCheckStatus: 'none' | 'pending' | 'cleared' | 'failed';
  creditScore?: number;
  ssnLastFour?: string;
  dlUrl?: string;
  preferences?: UserPreferences;
  exitReadyScore?: number;
  idealBuyerProfile?: any;
  creditApprovalLetterUrl?: string;
  currentQuest?: string;
  completedQuests: string[];
  onboardingAnswers?: Record<string, string>;
  targetProfile?: {
    industries: string[];
    minRevenue: number;
    maxRevenue: number;
    minEbitda: number;
    maxEbitda: number;
    budget: number;
    locationPreference?: string;
  };
  scorecardAnswers?: Record<string, number>;
  scorecardResults?: {
    total: number;
    categories: {
      systems: number;
      concentration: number;
      owner: number;
      revenue: number;
      timing: number;
    };
    multiple: string;
    redFlags: string[];
    recommendations: string[];
  };
  // P4: Authority Profile
  podcasts?: string[];
  associations?: string[];
  mediaMentions?: string[];
}

interface ContactRequest {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  status: 'pending' | 'accepted' | 'denied';
  message: string;
  createdAt: any;
  matchScore?: number;
  matchReasoning?: string;
  buyerProfileSummary?: string;
  sellerProfileSummary?: string;
}

interface Message {
  id: string;
  senderId: string;
  dealId: string;
  text: string;
  timestamp: any;
}

interface Deal {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  status: 'LOI' | 'DueDiligence' | 'Closing' | 'Closed';
  createdAt: any;
  checklist?: { id: string; task: string; completed: boolean; category: string }[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: 'locked' | 'available' | 'active' | 'completed';
  icon: any;
}

// --- Components ---

const Scanlines = () => <div className="scanlines" />;

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="level-bar w-full">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      className="level-progress"
    />
  </div>
);

const OracleBot = ({ user, listings, contactRequests, onClose }: { user: UserProfile, listings: any[], contactRequests: any[], onClose: () => void }) => {
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: `Greetings, ${user.displayName}. I am The Oracle. I've analyzed the marketplace and your profile. We're operating at the intersection of Zillow and Match.com—finding you the perfect business asset and the right connection. What's our next move?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const context = `User Role: ${user.role}. Level: ${user.level}. Current Quest: ${user.currentQuest}. 
      Marketplace Context: There are ${listings.length} active listings. 
      Connection Context: User has ${contactRequests.filter(r => r.status === 'pending').length} pending requests.`;
      
      const response = await getAiBrokerConsultation(user.role, context, userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Signal interference detected. Please retry." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-96 bg-white border-2 border-primary rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,194,224,0.15)] flex flex-col h-[500px]">
      <div className="p-4 bg-primary text-white flex justify-between items-center font-bold">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          <span>THE ORACLE v2.5</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70"><X className="w-5 h-5" /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-sm scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-primary animate-pulse">Processing...</div>}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 bg-white border border-primary/20 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-primary font-mono"
          />
          <button type="submit" className="bg-primary text-white p-2 rounded-xl hover:opacity-80">
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

const QuestCard = ({ quest, onStart }: { quest: Quest, onStart: (q: Quest) => void }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`game-card p-6 rounded-3xl relative overflow-hidden ${quest.status === 'locked' ? 'opacity-50 grayscale' : ''}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${quest.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
        <quest.icon className="w-6 h-6" />
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">{quest.xpReward} XP</span>
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2 text-slate-900">{quest.title}</h3>
    <p className="text-slate-500 text-sm mb-6 leading-relaxed">{quest.description}</p>
    
    {quest.status === 'locked' ? (
      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
        <Lock className="w-4 h-4" />
        <span>Locked</span>
      </div>
    ) : quest.status === 'completed' ? (
      <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase">
        <CheckCircle2 className="w-4 h-4" />
        <span>Completed</span>
      </div>
    ) : (
      <button 
        onClick={() => onStart(quest)}
        className="neon-button w-full py-3 rounded-xl text-sm"
      >
        {quest.status === 'active' ? 'Continue Quest' : 'Start Quest'}
      </button>
    )}
  </motion.div>
);

const SCORECARD_QUESTIONS = [
  { id: 1, category: 'systems', text: "Do you have a written manual for the 7 core functions of your business?", weight: 1 },
  { id: 2, category: 'owner', text: "Does your team ask for permission on spending <$500?", weight: 2, invert: true },
  { id: 3, category: 'concentration', text: "Does any single client represent more than 25% of your total sales?", weight: 1, invert: true },
  { id: 4, category: 'revenue', text: "Is at least 50% of your revenue governed by contracts longer than 12 months?", weight: 1 },
  { id: 5, category: 'revenue', text: "Have your profit margins been consistent (within 5%) for the last 3 years?", weight: 1 },
  { id: 6, category: 'concentration', text: "If your lead salesperson left today, would your revenue drop by more than 20%?", weight: 1, invert: true },
  { id: 7, category: 'revenue', text: "Are your personal expenses (car, travel) clearly separated from business operations?", weight: 1 },
  { id: 8, category: 'systems', text: "Could you produce a complete list of employee contracts and leases in under 24 hours?", weight: 1 },
  { id: 9, category: 'owner', text: "Can a buyer double the business without you being the one to sell the deals?", weight: 2 },
  { id: 10, category: 'systems', text: "Are all your industry permits and IP filings currently active and documented?", weight: 1 },
  { id: 11, category: 'revenue', text: "Are your last 3 years of tax returns fully reconciled with your internal books?", weight: 1 },
  { id: 12, category: 'timing', text: "Do you know exactly how much cash you'll take home after a 20% rollover?", weight: 1 },
  { id: 13, category: 'timing', text: "Do you have any 'change of control' clauses that require landlord or vendor permission?", weight: 1, invert: true },
  { id: 14, category: 'timing', text: "Are you emotionally ready to walk away within 12 months of closing?", weight: 1 },
  { id: 15, category: 'owner', text: "Can your business run for 30 days without you?", weight: 2 },
];

const ACADEMY_MODULES = [
  {
    id: 1,
    title: "The AI Audit",
    outcome: "Establish your baseline SCORE (Systems, Concentration, Owner-Independence, Revenue, Exit Timing).",
    lessons: [
      "Why 70-90% of deals fail due to 'Surprise Friction' in the first 14 days of DD.",
      "The 'Silver Tsunami' macro-trend: Why 2026 is the year of the selective buyer.",
      "Understanding the 'Owner-Reliance Discount': Why you lose 2x-3x on your multiple if you are the 'hub'.",
      "Client Concentration Risk: The math behind the -0.75x multiple hit if one client is >20%."
    ],
    aiTrigger: "Execute Agentic Scorecard Agent",
    aiAction: "Scans financial answers to calculate Normalized EBITDA and potential multiple lift."
  },
  {
    id: 2,
    title: "The Normalization Engine",
    outcome: "Extract every dollar of 'Personal Expense' and 'One-Time Cost' to maximize your EBITDA.",
    lessons: [
      "SDE vs. EBITDA & The Add-Back Goldmine.",
      "Defining legitimate Add-Backs: The 'Would this expense exist if I didn't own it?' test.",
      "Owner Compensation: Normalizing your salary to market CEO rates.",
      "Capturing 'Phantom Expenses': Personal travel, club memberships, and home office perks."
    ],
    aiTrigger: "Run Anomaly Detection Agent",
    aiAction: "Flag every transaction labeled 'Travel,' 'Consulting,' or 'Misc' in your General Ledger."
  },
  {
    id: 3,
    title: "The Smart VDR Fortress",
    outcome: "A self-organizing Virtual Data Room that answers buyer questions autonomously.",
    lessons: [
      "The VDR Hierarchy: Organizing by Financials, Tax, Legal, HR, Ops, and IP.",
      "Semantic Auto-Indexing: Why manual filing takes 90% longer than AI categorization.",
      "Clause Extraction: Identifying 'Change of Control' and 'Termination for Convenience'.",
      "One-Click Redaction: Automatically masking PII to comply with CCPA/GDPR."
    ],
    aiTrigger: "Initialize VDR Indexer",
    aiAction: "Generates a custom M&A folder structure based on your weakest scorecard category."
  },
  {
    id: 4,
    title: "Operational Independence",
    outcome: "Transition from 'Hub' to 'Shareholder' by documenting the 7 core business functions.",
    lessons: [
      "The R/A/G (Red/Amber/Green) Functional Audit.",
      "Delegation Quality: Measuring your 'Shadow Approval Rate'.",
      "The 30-Day Ghost Challenge: Can the business run for 30 days without you?",
      "SOP Automation: Using AI to turn screen recordings into step-by-step documentation."
    ],
    aiTrigger: "Build Agentic SOPs",
    aiAction: "Transcribe and extract 'Decision Logic' from your recorded daily tasks."
  },
  {
    id: 5,
    title: "The Velocity Match",
    outcome: "Execute a controlled auction using the Bizlynx AI Matchmaking Engine.",
    lessons: [
      "The 'Controlled Auction' vs. 'The Blind Financial Auction'.",
      "AI Matchmaking: Ranking buyers by 'Proof of Funds' and 'Strategic Fit'.",
      "The Anonymized Marketplace: How to list without alerting your employees or competitors.",
      "The LOI (Letter of Intent): Decoding 'Cash-Free, Debt-Free' implications."
    ],
    aiTrigger: "Auto-Generate CIM",
    aiAction: "Pulls data from the scorecard and uploaded docs to draft a Confidential Information Memorandum."
  }
];

const Scorecard = ({ user, onComplete }: { user: UserProfile, onComplete: (results: any) => void }) => {
  const [step, setStep] = useState<'intro' | 'quiz' | 'results'>(user.scorecardResults ? 'results' : 'intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const handleAnswer = (val: boolean) => {
    const newAnswers = { ...answers, [SCORECARD_QUESTIONS[currentQuestion].id]: val };
    setAnswers(newAnswers);
    if (currentQuestion < SCORECARD_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: Record<number, boolean>) => {
    const categoryScores = {
      systems: 0,
      concentration: 0,
      owner: 0,
      revenue: 0,
      timing: 0
    };
    const categoryTotals = {
      systems: 0,
      concentration: 0,
      owner: 0,
      revenue: 0,
      timing: 0
    };

    SCORECARD_QUESTIONS.forEach(q => {
      const isCorrect = q.invert ? !finalAnswers[q.id] : finalAnswers[q.id];
      categoryTotals[q.category as keyof typeof categoryTotals] += q.weight;
      if (isCorrect) {
        categoryScores[q.category as keyof typeof categoryScores] += q.weight;
      }
    });

    const categories = {
      systems: Math.round((categoryScores.systems / categoryTotals.systems) * 20),
      concentration: Math.round((categoryScores.concentration / categoryTotals.concentration) * 20),
      owner: Math.round((categoryScores.owner / categoryTotals.owner) * 20),
      revenue: Math.round((categoryScores.revenue / categoryTotals.revenue) * 20),
      timing: Math.round((categoryScores.timing / categoryTotals.timing) * 20)
    };

    const total = categories.systems + categories.concentration + categories.owner + categories.revenue + categories.timing;
    
    let multiple = "3x - 4x";
    if (total >= 80) multiple = "7x - 9x";
    else if (total >= 60) multiple = "5x - 6x";

    const redFlags = [];
    if (categories.owner < 12) redFlags.push("High Owner Reliance: Business cannot run without you.");
    if (categories.concentration < 12) redFlags.push("Concentration Risk: Too much revenue from single sources.");
    if (categories.revenue < 12) redFlags.push("Revenue Quality: Low recurring revenue or inconsistent margins.");

    const results = {
      total,
      categories,
      multiple,
      redFlags,
      recommendations: [
        "Automate your SOPs using the BizLinx AI SOP Generator.",
        "Diversify your client base to reduce concentration risk.",
        "Implement a 30-day 'Invisible Founder' test."
      ]
    };

    onComplete(results);
    setStep('results');
  };

  if (step === 'intro') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-12 px-6">
        <div className="game-card p-12 rounded-[60px] border-primary/20 bg-slate-900 text-white text-center space-y-8">
          <div className="inline-block p-4 bg-primary/10 rounded-3xl mb-4">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
            Claim the Check You Deserve: <br />
            <span className="text-primary">Get Your AI Deal-Ready Score</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Most founders lose 30% of their exit value because of one simple mistake. Stop guessing your worth and get a data-backed roadmap to a million-dollar exit.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => setStep('quiz')}
              className="neon-button px-12 py-6 rounded-2xl text-lg font-black italic uppercase tracking-widest"
            >
              Start Diagnostic (3 Mins)
            </button>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Powered by BizLinx Agentic Intelligence
          </p>
        </div>
      </motion.div>
    );
  }

  if (step === 'quiz') {
    const q = SCORECARD_QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / SCORECARD_QUESTIONS.length) * 100;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-20 px-6">
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Question {currentQuestion + 1}/15</span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <div className="space-y-12 text-center">
          <h2 className="text-3xl font-black italic text-slate-900 leading-tight">
            "{q.text}"
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => handleAnswer(true)}
              className="p-8 rounded-[32px] border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-200 group-hover:text-primary transition-colors" />
              <span className="text-xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-slate-900">Yes</span>
            </button>
            <button 
              onClick={() => handleAnswer(false)}
              className="p-8 rounded-[32px] border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <X className="w-12 h-12 mx-auto mb-4 text-slate-200 group-hover:text-red-500 transition-colors" />
              <span className="text-xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-slate-900">No</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const results = user.scorecardResults!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
            Deal-Ready <span className="text-primary/30">Scorecard</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Your Exit Roadmap</p>
        </div>
        <button 
          onClick={() => setStep('quiz')}
          className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
        >
          Retake Diagnostic
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="game-card p-12 rounded-[60px] border-primary/20 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <PieChart className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-8">
                <div className="text-8xl font-black italic tracking-tighter text-primary">{results.total}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Overall Score</p>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    {results.total >= 80 ? 'Exit Ready' : results.total >= 60 ? 'Gaps to Fix' : 'Structural Risk'}
                  </h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estimated Multiple</p>
                  <p className="text-4xl font-black italic tracking-tighter text-secondary">{results.multiple}</p>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">Based on 2026 M&A Index</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Market Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${results.total}%` }} />
                    </div>
                    <span className="text-sm font-black italic">{results.total}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(results.categories).map(([cat, score]) => (
              <div key={cat} className="game-card p-6 rounded-3xl border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{cat}</p>
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - score/20)} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-black italic">{score}/20</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="game-card p-8 rounded-[40px] border-red-500/20 bg-red-50/30">
            <div className="flex items-center gap-3 mb-6 text-red-500">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Red Flags</h3>
            </div>
            <div className="space-y-4">
              {results.redFlags.map((flag, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl border border-red-100 text-xs font-bold text-slate-600">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  {flag}
                </div>
              ))}
            </div>
          </div>

          <div className="game-card p-8 rounded-[40px] border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-6 text-primary">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">AI Quick Wins</h3>
            </div>
            <div className="space-y-4">
              {results.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl border border-primary/10 text-xs font-bold text-slate-600">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
            <button className="neon-button w-full py-4 rounded-2xl text-xs mt-6">Fix Gaps with AI Agents</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Academy = ({ user, onExecuteAgent }: { user: UserProfile, onExecuteAgent: (title: string) => void }) => {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
            Exit & Acquisition <span className="text-primary/30">Mastery</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">The "Deal-Ready" OS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Progress</p>
            <p className="text-sm font-black italic text-primary">20% Complete</p>
          </div>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '20%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {ACADEMY_MODULES.map((mod) => (
            <div 
              key={mod.id}
              onClick={() => setSelectedModule(mod.id)}
              className={`game-card p-8 rounded-[40px] border transition-all cursor-pointer group ${
                selectedModule === mod.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-black italic text-slate-200 group-hover:text-primary transition-colors">0{mod.id}</div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">{mod.title}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{mod.outcome}</p>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${selectedModule === mod.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <PlayCircle className="w-6 h-6" />
                </div>
              </div>
              
              {selectedModule === mod.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-6 border-t border-primary/10 space-y-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Core Teaching Points</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mod.lessons.map((lesson, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl border border-primary/5 text-xs font-medium text-slate-600">
                          <BookOpen className="w-4 h-4 text-primary shrink-0" />
                          {lesson}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Cpu className="w-12 h-12" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Interactive AI Trigger</p>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter mb-2">{mod.aiTrigger}</h4>
                      <p className="text-xs text-slate-400 mb-6">{mod.aiAction}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onExecuteAgent(mod.title);
                        }}
                        className="neon-button w-full py-4 rounded-2xl text-xs"
                      >
                        Execute Agent
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="game-card p-8 rounded-[40px] border-secondary/20 bg-secondary/5">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-secondary">
              <Trophy className="w-6 h-6" />
              Course Bonuses
            </h3>
            <div className="space-y-4">
              {[
                { title: "CPA-Connect Vault", desc: "Pre-built legal/accounting templates." },
                { title: "SOP Library", desc: "50+ AI-generated SOPs for your industry." },
                { title: "Red-Flag Scanner", desc: "One-click AI scan of tax returns." }
              ].map((bonus, i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-secondary/10">
                  <p className="text-sm font-black italic text-slate-800">{bonus.title}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{bonus.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="game-card p-8 rounded-[40px] border-slate-200 bg-slate-50">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
              Zero-Risk Guarantee
            </h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              If your business does not achieve a "Bizlynx Deal-Ready Certification" (Score 80+) within 60 days, we provide a 1-on-1 M&A Advisor audit and free VDR hosting until you close.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AboutBizLinx = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-12 pb-20"
  >
    <div className="relative h-[400px] rounded-[60px] overflow-hidden group">
      <img 
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" 
        alt="BizLinx AI Vision" 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4">The Future of M&A</p>
          <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
            BizLinx AI: <br />
            <span className="text-primary/80">The Business Matchmaker</span>
          </h1>
        </motion.div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="game-card p-8 rounded-[40px] border-primary/20 bg-white/50 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Our Mission</h3>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          To democratize business acquisitions by combining AI-driven matching with gamified engagement, making the complex world of M&A accessible, transparent, and efficient for everyone.
        </p>
      </div>

      <div className="game-card p-8 rounded-[40px] border-secondary/20 bg-white/50 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">The Vision</h3>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          Creating a global marketplace where businesses find their perfect successors through intelligent data analysis and intuitive user experiences, powered by the BizLinx AI engine.
        </p>
      </div>

      <div className="game-card p-8 rounded-[40px] border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 mb-6">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Global Reach</h3>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          Connecting buyers and sellers across borders, industries, and scales. From local main-street shops to high-growth tech startups, BizLinx AI is the bridge to your next chapter.
        </p>
      </div>
    </div>

    <div className="game-card p-12 rounded-[60px] border-primary/10 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5">
        <Zap className="w-64 h-64 rotate-12" />
      </div>
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Why BizLinx AI?</h2>
        <div className="space-y-6">
          {[
            { title: "AI-Driven Matching", desc: "Our proprietary algorithms analyze thousands of data points to find the perfect synergy between buyer and seller." },
            { title: "Gamified Experience", desc: "We've turned the dry process of M&A into an engaging journey with levels, quests, and rewards." },
            { title: "Secure Deal Rooms", desc: "Enterprise-grade security for your most sensitive documents and communications." }
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="text-primary font-black italic text-2xl">0{i+1}</div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs text-primary mb-2">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">The Leadership Team</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: "Sarah", role: "Founder & CEO", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400" },
          { name: "Alex Chen", role: "Head of AI", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
          { name: "Elena Rodriguez", role: "M&A Strategy", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" }
        ].map((member, i) => (
          <div key={i} className="group relative">
            <div className="aspect-[3/4] rounded-[40px] overflow-hidden mb-4">
              <img 
                src={member.img} 
                alt={member.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="text-xl font-black italic uppercase tracking-tighter">{member.name}</h4>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{member.role}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-secondary" />
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Success Stories</h2>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
        {[
          { title: "Project Phoenix", type: "Tech Exit", value: "$15.2M", desc: "SaaS platform matched with strategic buyer in 45 days.", color: "bg-primary/10 border-primary/20 text-primary" },
          { title: "Blue Horizon", type: "Manufacturing", value: "$4.8M", desc: "Local factory acquisition by private equity group.", color: "bg-secondary/10 border-secondary/20 text-secondary" },
          { title: "Nova Retail", type: "E-commerce", value: "$8.5M", desc: "Direct-to-consumer brand merger with retail giant.", color: "bg-slate-100 border-slate-200 text-slate-900" }
        ].map((story, i) => (
          <div key={i} className={`min-w-[350px] p-8 rounded-[40px] border snap-start ${story.color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{story.type}</p>
            <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-1">{story.title}</h4>
            <p className="text-4xl font-black italic tracking-tighter mb-6">{story.value}</p>
            <p className="text-sm font-medium leading-relaxed opacity-80">{story.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const Profile = ({ user, onUpdate }: { user: UserProfile, onUpdate: (updates: Partial<UserProfile>) => void }) => {
  const [podcasts, setPodcasts] = useState(user.podcasts?.join(', ') || '');
  const [associations, setAssociations] = useState(user.associations?.join(', ') || '');
  const [media, setMedia] = useState(user.mediaMentions?.join(', ') || '');

  const handleSave = () => {
    onUpdate({
      podcasts: podcasts.split(',').map(s => s.trim()).filter(Boolean),
      associations: associations.split(',').map(s => s.trim()).filter(Boolean),
      mediaMentions: media.split(',').map(s => s.trim()).filter(Boolean),
    });
    alert("Authority Profile Updated.");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
            Character <span className="text-primary/30">Profile</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Your Digital Authority</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest ${user.verified ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-400'}`}>
            {user.verified ? 'Verified Identity' : 'Unverified'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="game-card p-8 rounded-[40px] border-slate-100">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-primary" />
              Authority Profile (P4)
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Podcasts & Interviews (Comma separated)</label>
                <textarea 
                  value={podcasts}
                  onChange={(e) => setPodcasts(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-primary min-h-[100px]"
                  placeholder="The Exit Club, M&A Masters..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Professional Associations</label>
                <textarea 
                  value={associations}
                  onChange={(e) => setAssociations(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-primary min-h-[100px]"
                  placeholder="IBBA, M&A Source..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Media Mentions</label>
                <textarea 
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-primary min-h-[100px]"
                  placeholder="Forbes, Wall Street Journal..."
                />
              </div>
              <button 
                onClick={handleSave}
                className="neon-button w-full py-4 rounded-2xl text-xs"
              >
                Update Authority Profile
              </button>
            </div>
          </div>

          <div className="game-card p-8 rounded-[40px] border-slate-100">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Verification Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Background Check</p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{user.backgroundCheckStatus}</p>
                </div>
                {user.backgroundCheckStatus === 'cleared' ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <AlertTriangle className="w-6 h-6 text-slate-300" />}
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Identity Verified</p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{user.verified ? 'YES' : 'NO'}</p>
                </div>
                {user.verified ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <AlertTriangle className="w-6 h-6 text-slate-300" />}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="game-card p-8 rounded-[40px] border-primary/20 bg-primary/5 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-lg shadow-primary/10">
              <User className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{user.displayName}</h3>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-6">{user.role} • Level {user.level}</p>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>XP Progress</span>
                <span>{user.xp}/{(user.level + 1) * 1000}</span>
              </div>
              <ProgressBar progress={(user.xp % 1000) / 10} />
            </div>
          </div>

          <div className="game-card p-8 rounded-[40px] border-slate-100">
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Joined</span>
                <span className="text-xs font-mono text-slate-600">MAR 2026</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Quests Done</span>
                <span className="text-xs font-mono text-slate-600">{user.completedQuests.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Deals Active</span>
                <span className="text-xs font-mono text-slate-600">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }: { user: UserProfile, activeTab: string, setActiveTab: (t: string) => void, onLogout: () => void }) => {
  const menuItems = [
    { id: 'journey', label: 'My Journey', icon: Target },
    { id: 'scorecard', label: 'Scorecard', icon: FileQuestion },
    { id: 'academy', label: 'Academy', icon: GraduationCap },
    { id: 'swipe', label: 'Matchmaker', icon: Heart },
    { id: 'marketplace', label: 'Network', icon: Globe },
    { id: 'deals', label: 'Deal Rooms', icon: Handshake },
    { id: 'firm', label: 'BizLinx AI', icon: Briefcase },
    { id: 'about', label: 'Mission', icon: Sparkles },
    { id: 'adminChat', label: 'Support', icon: MessageSquare },
    { id: 'profile', label: 'Character', icon: User },
  ];

  if (user.role === 'admin' || user.email === 'demo@bizlinxai.com' || user.email === 'Sarah@bizlinxai.com') {
    menuItems.push({ id: 'admin', label: 'God Mode', icon: ShieldCheck });
  }

  return (
    <div className="w-64 bg-white border-r border-slate-100 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-slate-50">
        <div className="flex items-center gap-3 text-primary font-black text-2xl tracking-tighter italic glitch">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-lg opacity-20 blur-sm"></div>
            <Zap className="w-8 h-8 relative text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">BIZLINX</span>
        </div>
      </div>

      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary uppercase">Level {user.level}</span>
          <span className="text-xs font-bold text-slate-400">{user.xp} XP</span>
        </div>
        <ProgressBar progress={(user.xp % 1000) / 10} />
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-primary text-white font-bold shadow-[0_4px_15px_rgba(0,194,224,0.3)]' 
                : 'text-slate-400 hover:text-primary hover:bg-primary/5'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'group-hover:text-primary'}`} />
            <span className="uppercase tracking-widest text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-secondary transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};

interface MissionLog {
  id: string;
  userId: string;
  text: string;
  timestamp: any;
  type: 'system' | 'oracle' | 'user';
}

const FirmDashboard = ({ 
  user, 
  onSeedListings, 
  onSeedMissionLogs, 
  onSeedDealRoom 
}: { 
  user: UserProfile, 
  onSeedListings: () => void,
  onSeedMissionLogs: () => void,
  onSeedDealRoom: () => void
}) => {
  const [subTab, setSubTab] = useState<'sales' | 'marketing' | 'accounting'>('sales');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(25);
  const [profitAmount, setProfitAmount] = useState(10000);
  const [selectedDealIdForDD, setSelectedDealIdForDD] = useState<string | null>(null);

  const generateCopy = async (campaignName: string) => {
    setIsGeneratingCopy(true);
    setSelectedCampaign(campaignName);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a high-impact marketing copy for an M&A firm's campaign titled: "${campaignName}". 
        Target audience: High-net-worth business owners and strategic buyers. 
        Tone: Professional, authoritative, and results-driven. 
        Include a headline, body text, and a call to action.`,
      });
      setGeneratedCopy(response.text || "Failed to generate copy.");
    } catch (error) {
      console.error("AI Generation Error:", error);
      setGeneratedCopy("The Oracle is currently silent. Please try again later.");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const ddChecklist = [
    { id: '1', task: 'Financial Audit (3 Years)', status: 'completed' },
    { id: '2', task: 'Legal Contract Review', status: 'pending' },
    { id: '3', task: 'Customer Concentration Analysis', status: 'pending' },
    { id: '4', task: 'Tech Stack & IP Verification', status: 'active' },
    { id: '5', task: 'Employee Agreement Review', status: 'pending' },
  ];

  const salesPipeline = [
    { id: '1', name: 'TechCorp Acquisition', stage: 'Negotiation', value: '$4.2M', probability: '75%' },
    { id: '2', name: 'Retail Chain Exit', stage: 'Qualified', value: '$1.8M', probability: '40%' },
    { id: '3', name: 'SaaS Platform Buyout', stage: 'Closing', value: '$12.5M', probability: '95%' },
  ];

  const marketingCampaigns = [
    { id: '1', name: 'Authority Builder: Podcast Series', status: 'Active', reach: '12.4K', leads: 42 },
    { id: '2', name: 'LinkedIn M&A Thought Leadership', status: 'Pending', reach: '0', leads: 0 },
    { id: '3', name: 'Direct Outreach: Strategic Buyers', status: 'Completed', reach: '450', leads: 18 },
  ];

  const accountingLedger = [
    { id: '1', date: '2026-03-20', description: 'Profile Unlock: Buyer_8291', amount: '+$33.00', type: 'revenue' },
    { id: '2', date: '2026-03-18', description: 'Success Fee: Project Phoenix', amount: '+$10,000.00', type: 'revenue' },
    { id: '3', date: '2026-03-15', description: 'Data Room Hosting Fee', amount: '-$150.00', type: 'expense' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
            BizLinx AI <span className="text-primary/30">Operations</span>
          </h1>
          <a 
            href="https://bizlinxai.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-1"
          >
            Visit bizlinxai.com
          </a>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {(['sales', 'marketing', 'accounting'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                subTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="game-card p-6 rounded-3xl border-primary/10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pipeline Value</p>
          <p className="text-3xl font-black text-slate-900 italic tracking-tighter">$18.5M</p>
        </div>
        <div className="game-card p-6 rounded-3xl border-secondary/10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Reach</p>
          <p className="text-3xl font-black text-secondary italic tracking-tighter">12.8K</p>
        </div>
        <div className="game-card p-6 rounded-3xl border-green-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Revenue (MTD)</p>
          <p className="text-3xl font-black text-green-600 italic tracking-tighter">$10,033</p>
        </div>
      </div>

      <div className="game-card p-8 rounded-[40px] border-primary/20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Rocket className="w-32 h-32 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mission Control: Growth 1K</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Sellers/Clients</p>
                  <p className="text-5xl font-black italic tracking-tighter">142 <span className="text-xl text-slate-500">/ 1,000</span></p>
                </div>
                <p className="text-primary font-black italic">14.2% COMPLETE</p>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '14.2%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary shadow-[0_0_20px_rgba(255,100,0,0.5)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Growth</p>
                <p className="text-xl font-black text-green-400">+12%</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Completion</p>
                <p className="text-xl font-black text-primary">OCT 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {subTab === 'sales' && (
        <div className="space-y-6">
          <div className="game-card p-8 rounded-[40px] border-primary/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sales Pipeline</h2>
              </div>
            </div>
            <div className="space-y-4">
              {salesPipeline.map(deal => (
                <div key={deal.id} className="p-6 bg-white rounded-2xl border border-slate-100 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800 italic tracking-tight">{deal.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deal.stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-black text-primary italic tracking-tighter">{deal.value}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deal.probability} Probability</p>
                    </div>
                    <button 
                      onClick={() => setSelectedDealIdForDD(selectedDealIdForDD === deal.id ? null : deal.id)}
                      className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <ClipboardList className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedDealIdForDD && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="game-card p-8 rounded-[40px] border-primary/10 bg-primary/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <ClipboardCheck className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Due Diligence Checklist: {salesPipeline.find(d => d.id === selectedDealIdForDD)?.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ddChecklist.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{item.task}</span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      item.status === 'completed' ? 'bg-green-100 text-green-600' : 
                      item.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {subTab === 'marketing' && (
        <div className="space-y-6">
          <div className="game-card p-8 rounded-[40px] border-secondary/20">
            <div className="flex items-center gap-3 mb-8">
              <Megaphone className="w-6 h-6 text-secondary" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-secondary">Marketing Engine</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketingCampaigns.map(campaign => (
                <div key={campaign.id} className="p-6 bg-white rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight leading-tight w-2/3">{campaign.name}</h3>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      campaign.status === 'Active' ? 'bg-green-100 text-green-600' : 
                      campaign.status === 'Pending' ? 'bg-slate-100 text-slate-400' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex gap-8 pt-4 border-t border-slate-50 items-center justify-between">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reach</p>
                        <p className="text-xl font-black text-slate-800 italic tracking-tighter">{campaign.reach}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads</p>
                        <p className="text-xl font-black text-slate-800 italic tracking-tighter">{campaign.leads}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => generateCopy(campaign.name)}
                      disabled={isGeneratingCopy}
                      className="p-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {generatedCopy && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="game-card p-8 rounded-[40px] border-secondary/20 bg-secondary/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setGeneratedCopy(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-secondary" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-secondary">Oracle Generated Copy: {selectedCampaign}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{generatedCopy}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {subTab === 'accounting' && (
        <div className="space-y-6">
          <div className="game-card p-8 rounded-[40px] border-green-200">
            <div className="flex items-center gap-3 mb-8">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-green-600">Firm Ledger</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {accountingLedger.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{entry.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{entry.description}</td>
                      <td className={`px-6 py-4 text-sm font-black text-right italic tracking-tight ${
                        entry.type === 'revenue' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {entry.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="game-card p-8 rounded-[40px] border-green-100 bg-green-50/30">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-green-600">Tax Estimator</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Estimated Profit</label>
                  <input 
                    type="number" 
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-green-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tax Rate ({taxRate}%)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full accent-green-600"
                  />
                </div>
                <div className="pt-4 border-t border-green-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Estimated Liability:</span>
                  <span className="text-2xl font-black text-red-500 italic tracking-tighter">${(profitAmount * (taxRate / 100)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="game-card p-8 rounded-[40px] border-green-100 bg-green-50/30">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-green-600">Profit Distribution</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">Retained Earnings (40%)</span>
                  <span className="text-lg font-black text-green-600 italic tracking-tighter">${(profitAmount * 0.4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">Partner Dividends (50%)</span>
                  <span className="text-lg font-black text-green-600 italic tracking-tighter">${(profitAmount * 0.5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">Employee Bonus Pool (10%)</span>
                  <span className="text-lg font-black text-green-600 italic tracking-tighter">${(profitAmount * 0.1).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('journey');
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // New Player Initialization
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'NewPlayer',
            role: 'buyer', // Default to buyer for now
            level: 1,
            xp: 0,
            verified: false,
            onboardingCompleted: false,
            backgroundCheckStatus: 'none',
            completedQuests: [],
            currentQuest: 'search'
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setUser(newProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      });
      return () => unsub();
    }
  }, [user?.role]);

  const [missionLogs, setMissionLogs] = useState<MissionLog[]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealSubTab, setDealSubTab] = useState<'chat' | 'checklist' | 'vault'>('chat');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'deals'),
        where('buyerId', '==', user.uid)
      );
      const unsubBuyer = onSnapshot(q, (snap) => {
        const buyerDeals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Deal));
        setDeals(prev => {
          const otherDeals = prev.filter(d => d.buyerId !== user.uid);
          return [...otherDeals, ...buyerDeals];
        });
      });

      const q2 = query(
        collection(db, 'deals'),
        where('sellerId', '==', user.uid)
      );
      const unsubSeller = onSnapshot(q2, (snap) => {
        const sellerDeals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Deal));
        setDeals(prev => {
          const otherDeals = prev.filter(d => d.sellerId !== user.uid);
          return [...otherDeals, ...sellerDeals];
        });
      });

      return () => {
        unsubBuyer();
        unsubSeller();
      };
    }
  }, [user?.uid]);

  useEffect(() => {
    if (selectedDealId) {
      const q = query(
        collection(db, 'deals', selectedDealId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      const unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `deals/${selectedDealId}/messages`);
      });
      return () => unsub();
    }
  }, [selectedDealId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDealId || !user) return;

    try {
      await addDoc(collection(db, 'deals', selectedDealId, 'messages'), {
        senderId: user.uid,
        dealId: selectedDealId,
        text: newMessage,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `deals/${selectedDealId}/messages`);
    }
  };

  useEffect(() => {
    const calculateScores = async () => {
      if (user?.role === 'buyer' && user.onboardingAnswers && listings.length > 0) {
        // Calculate for the first 3 listings to save API calls
        const uncalculated = listings.slice(0, 3).filter(l => !matchScores[l.id]);
        
        for (const listing of uncalculated) {
          try {
            const sellerDoc = await getDoc(doc(db, 'users', listing.sellerId));
            const sellerData = sellerDoc.data() as UserProfile;
            
            if (sellerData?.onboardingAnswers) {
              const match = await calculateMatchScore(user.onboardingAnswers, sellerData.onboardingAnswers);
              setMatchScores(prev => ({ ...prev, [listing.id]: match.score }));
            }
          } catch (e) {
            console.error("Error calculating match score for listing", listing.id, e);
          }
        }
      }
    };
    calculateScores();
  }, [user?.uid, listings.length]); // Use listings.length to trigger when listings load

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'contactRequests'), 
        where(user.role === 'seller' ? 'sellerId' : 'buyerId', '==', user.uid)
      );
      const unsub = onSnapshot(q, (snap) => {
        setContactRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactRequest)));
      });
      return () => unsub();
    }
  }, [user?.uid, user?.role]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'missionLogs'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const unsub = onSnapshot(q, (snap) => {
        setMissionLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionLog)));
      });
      return () => unsub();
    }
  }, [user?.uid]);

  const handleStartQuest = async (quest: Quest) => {
    if (!user) return;
    await handleUpdateUser(user.uid, { currentQuest: quest.id });
    await addDoc(collection(db, 'missionLogs'), {
      userId: user.uid,
      text: `QUEST INITIALIZED: ${quest.title}. Objective: ${quest.description}`,
      timestamp: serverTimestamp(),
      type: 'system'
    });
  };

  const handleScorecardComplete = async (results: any) => {
    if (!user) return;
    const newCompleted = [...user.completedQuests, 'scorecard'];
    await handleUpdateUser(user.uid, { 
      exitReadyScore: results.total,
      scorecardResults: results,
      currentQuest: null,
      completedQuests: newCompleted,
      xp: user.xp + 1000
    });
    await addDoc(collection(db, 'missionLogs'), {
      userId: user.uid,
      text: `QUEST COMPLETE: P3 Deal-Ready Scorecard. Score: ${results.total}%. 1000 XP awarded.`,
      timestamp: serverTimestamp(),
      type: 'system'
    });
    if (user.xp + 1000 >= 1000 * user.level) {
      await handleLevelUp(user.uid, user.level + 1);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLevelUp = async (uid: string, newLevel: number) => {
    if (!user) return;
    await handleUpdateUser(uid, { level: newLevel });
    await addDoc(collection(db, 'missionLogs'), {
      userId: uid,
      text: `LEVEL UP! You have reached Level ${newLevel}. New capabilities unlocked.`,
      timestamp: serverTimestamp(),
      type: 'system'
    });
  };

  const handleRequestContact = async (listing: Listing) => {
    if (!user) return;
    try {
      // Fetch seller profile for matching
      const sellerDoc = await getDoc(doc(db, 'users', listing.sellerId));
      const sellerData = sellerDoc.data() as UserProfile;
      
      let matchData = { score: 75, reasoning: "Standard match.", buyerProfileSummary: "", sellerProfileSummary: "" };
      
      if (user.onboardingAnswers && sellerData?.onboardingAnswers) {
        const result = await calculateMatchScore(user.onboardingAnswers, sellerData.onboardingAnswers);
        matchData = result;
      }

      await addDoc(collection(db, 'contactRequests'), {
        buyerId: user.uid,
        sellerId: listing.sellerId,
        listingId: listing.id,
        status: 'pending',
        message: `I am interested in ${listing.title}.`,
        createdAt: serverTimestamp(),
        matchScore: matchData.score,
        matchReasoning: matchData.reasoning,
        buyerProfileSummary: matchData.buyerProfileSummary,
        sellerProfileSummary: matchData.sellerProfileSummary
      });
      alert(`Transmission sent. Match Score: ${matchData.score}%. Awaiting seller authorization.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contactRequests');
    }
  };

  const handleUpdateContactRequest = async (requestId: string, status: 'accepted' | 'denied') => {
    try {
      const request = contactRequests.find(r => r.id === requestId);
      if (!request) return;

      await setDoc(doc(db, 'contactRequests', requestId), { status }, { merge: true });
      
      if (status === 'accepted') {
        // Award XP to seller for making a choice
        if (user) {
          await handleUpdateUser(user.uid, { xp: user.xp + 200 });
        }

        // Fetch listing for checklist generation
        const listing = listings.find(l => l.id === request.listingId);
        let checklist: any[] = [];
        if (listing) {
          checklist = await getDueDiligenceChecklist(listing);
        }

        // Create a Deal Room
        await addDoc(collection(db, 'deals'), {
          buyerId: request.buyerId,
          sellerId: request.sellerId,
          listingId: request.listingId,
          status: 'LOI',
          createdAt: serverTimestamp(),
          checklist: checklist
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'contactRequests');
    }
  };

  const handleOnboardingComplete = async (answers: Record<string, string>) => {
    if (!user) return;
    try {
      // Save answers to subcollection for history
      for (const [qId, ans] of Object.entries(answers)) {
        await addDoc(collection(db, 'users', user.uid, 'onboardingAnswers'), {
          questionId: qId,
          answer: ans,
          timestamp: serverTimestamp()
        });
      }

      const updates: any = {
        onboardingCompleted: true,
        xp: user.xp + 500,
        onboardingAnswers: answers
      };

      if (user.role === 'buyer') {
        const budgetMap: Record<string, number> = {
          'Under $50k': 50000,
          '$50k - $250k': 250000,
          '$250k - $1M': 1000000,
          'Over $1M': 5000000
        };
        const ebitdaMap: Record<string, [number, number]> = {
          'Under $100k': [0, 100000],
          '$100k - $500k': [100000, 500000],
          '$500k - $2M': [500000, 2000000],
          'Over $2M': [2000000, 10000000]
        };

        updates.targetProfile = {
          industries: [answers['b3'] || 'SaaS/Tech'],
          budget: budgetMap[answers['b2']] || 100000,
          minEbitda: ebitdaMap[answers['b6']]?.[0] || 0,
          maxEbitda: ebitdaMap[answers['b6']]?.[1] || 1000000,
          minRevenue: 0,
          maxRevenue: 10000000,
          locationPreference: answers['b8']
        };
      }

      // Update user profile with answers for matching
      await handleUpdateUser(user.uid, updates);
      
      await addDoc(collection(db, 'missionLogs'), {
        userId: user.uid,
        text: `Onboarding Protocol Complete. 500 XP awarded. Matchmaker module initialized.`,
        timestamp: serverTimestamp(),
        type: 'system'
      });
      if (user.xp + 500 >= 1000) {
        await handleLevelUp(user.uid, user.level + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwipe = async (listingId: string, direction: 'left' | 'right') => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'swipes'), {
        buyerId: user.uid,
        listingId,
        direction,
        timestamp: serverTimestamp()
      });

      if (direction === 'right') {
        const listing = listings.find(l => l.id === listingId);
        if (listing) {
          handleRequestContact(listing);
          await addDoc(collection(db, 'missionLogs'), {
            userId: user.uid,
            text: `Target locked: ${listing.title}. Authorization request dispatched.`,
            timestamp: serverTimestamp(),
            type: 'user'
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePurchaseProfile = async (buyerId: string) => {
    // Mock Stripe Checkout
    alert("Redirecting to Secure Payment Gateway ($33.00)...");
    setTimeout(async () => {
      if (!user) return;
      await addDoc(collection(db, 'purchases'), {
        sellerId: user.uid,
        buyerId,
        amount: 33,
        timestamp: serverTimestamp()
      });
      await addDoc(collection(db, 'missionLogs'), {
        userId: user.uid,
        text: `Profile unlocked for Buyer ${buyerId.slice(0, 8)}. Data decryption complete.`,
        timestamp: serverTimestamp(),
        type: 'system'
      });
      alert("Access Granted. Buyer profile unlocked.");
    }, 2000);
  };

  const sellerQuests: Quest[] = [
    { id: 'scorecard', title: 'P3: Deal-Ready Scorecard', description: 'The top of your product ecosystem. Find out if your business is actually ready to sell.', xpReward: 1000, status: 'available', icon: Target },
    { id: 'pitch', title: 'P1: The Perfect Pitch', description: 'Lead with the scorecard. "I help business owners find out if they are ready to sell."', xpReward: 500, status: 'locked', icon: Zap },
    { id: 'publish', title: 'P2: Content Strategy', description: 'Build your content around gaps identified in scorecard data.', xpReward: 750, status: 'locked', icon: FileText },
    { id: 'profile', title: 'P4: Authority Profile', description: 'Reflect your authority: podcasts, associations, media mentions.', xpReward: 600, status: 'locked', icon: ShieldCheck },
    { id: 'partnerships', title: 'P5: Strategic Partnerships', description: 'Connect with M&A attorneys, brokers, and advisors.', xpReward: 1200, status: 'locked', icon: Handshake },
  ];

  const buyerQuests: Quest[] = [
    { id: 'search', title: 'P1: The Acquisition Hunt', description: 'Scan the marketplace for high-yield business opportunities.', xpReward: 400, status: 'available', icon: Search },
    { id: 'vetting', title: 'P2: Deep Scan Analysis', description: 'Perform AI-assisted due diligence on your top targets.', xpReward: 800, status: 'locked', icon: Eye },
    { id: 'scorecard_review', title: 'P3: Scorecard Review', description: 'Analyze seller deal-ready scores to identify low-risk assets.', xpReward: 1000, status: 'locked', icon: Target },
    { id: 'offer', title: 'P4: The Strike', description: 'Deploy a strategic offer and negotiate the terms of victory.', xpReward: 1200, status: 'locked', icon: Zap },
    { id: 'partnerships', title: 'P5: Network Expansion', description: 'Build your own team of advisors and brokers.', xpReward: 1500, status: 'locked', icon: Globe },
  ];

  const handleSeedListings = async () => {
    const mockListings: Partial<Listing>[] = [
      {
        title: "CloudScale SaaS Solutions",
        description: "A high-growth B2B SaaS platform specializing in cloud infrastructure optimization.",
        industry: "SaaS",
        revenue: 1200000,
        ebitda: 450000,
        askingPrice: 3500000,
        sellerId: user?.uid || 'system',
        status: 'active',
        location: "Remote",
        createdAt: serverTimestamp()
      },
      {
        title: "Precision Manufacturing Hub",
        description: "Established precision tool and die manufacturing facility with long-term aerospace contracts.",
        industry: "Manufacturing",
        revenue: 2500000,
        ebitda: 600000,
        askingPrice: 2800000,
        sellerId: user?.uid || 'system',
        status: 'active',
        location: "Ohio, USA",
        createdAt: serverTimestamp()
      },
      {
        title: "Eco-Friendly Logistics Co.",
        description: "Last-mile delivery service using an all-electric fleet. High recurring revenue from e-commerce partners.",
        industry: "Logistics",
        revenue: 1800000,
        ebitda: 350000,
        askingPrice: 1500000,
        sellerId: user?.uid || 'system',
        status: 'active',
        location: "California, USA",
        createdAt: serverTimestamp()
      },
      {
        title: "Global Fintech Gateway",
        description: "Payment processing gateway with a focus on emerging markets and cross-border transactions.",
        industry: "Fintech",
        revenue: 5000000,
        ebitda: 1200000,
        askingPrice: 12000000,
        sellerId: user?.uid || 'system',
        status: 'active',
        location: "London, UK",
        createdAt: serverTimestamp()
      }
    ];

    try {
      for (const listing of mockListings) {
        await addDoc(collection(db, 'listings'), listing);
      }
      alert("Marketplace seeded with 4 high-value assets.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'listings');
    }
  };

  const handleCrawlBizBuySell = async () => {
    setIsCrawling(true);
    try {
      const results = await crawlBizBuySell();
      for (const item of results) {
        const listing: Partial<Listing> = {
          title: item.title,
          industry: item.industry,
          location: item.location,
          askingPrice: item.askingPrice,
          revenue: item.revenue,
          ebitda: item.sde,
          sde: item.sde,
          description: item.description,
          summary: item.description.slice(0, 100) + '...',
          sourceUrl: item.url,
          sellerId: 'bizbuysell-crawler',
          status: 'active',
          verified: true,
          isFranchise: item.title.toLowerCase().includes('franchise'),
          imageUrl: `https://picsum.photos/seed/${item.industry.toLowerCase()}/800/600`,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'listings'), listing);
      }
      alert(`Successfully crawled and added ${results.length} listings from BizBuySell.`);
    } catch (e) {
      console.error("Crawl failed:", e);
      alert("Crawl failed. Check console for details.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSeedMissionLogs = async () => {
    if (!user) return;
    const mockLogs = [
      { text: "SYSTEM: Neural network synchronized. Marketplace scan complete.", type: 'system' },
      { text: "ORACLE: High-value SaaS asset detected in the Northeast region.", type: 'oracle' },
      { text: "USER: Initialized due diligence on Project Phoenix.", type: 'user' },
      { text: "SYSTEM: New connection request from BUYER_8291 authorized.", type: 'system' },
      { text: "ORACLE: Market sentiment shift detected. Strategic exits favored for Q2.", type: 'oracle' }
    ];

    try {
      for (const log of mockLogs) {
        await addDoc(collection(db, 'missionLogs'), {
          userId: user.uid,
          text: log.text,
          timestamp: serverTimestamp(),
          type: log.type
        });
      }
      alert("Mission logs seeded with 5 entries.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'missionLogs');
    }
  };

  const handleExecuteAgent = async (moduleTitle: string) => {
    alert(`Executing AI Agent for: ${moduleTitle}...`);
    if (!user) return;
    try {
      await addDoc(collection(db, 'missionLogs'), {
        userId: user.uid,
        text: `AI AGENT EXECUTED: ${moduleTitle}. Analyzing data nodes...`,
        timestamp: serverTimestamp(),
        type: 'system'
      });
      setTimeout(() => {
        alert(`${moduleTitle} Agent has completed its initial analysis. Check Mission Log for details.`);
      }, 2000);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'missionLogs');
    }
  };

  const handleSeedDealRoom = async () => {
    if (!user) return;
    try {
      const mockListing = listings[0] || { id: 'mock_listing_id', title: 'Mock Asset' };
      const mockBuyerId = 'mock_buyer_id';
      
      await addDoc(collection(db, 'contactRequests'), {
        buyerId: mockBuyerId,
        sellerId: user.uid,
        listingId: mockListing.id,
        status: 'accepted',
        message: "I'm ready to move forward with this acquisition.",
        createdAt: serverTimestamp(),
        matchScore: 92,
        matchReasoning: "Strong financial alignment and industry experience.",
        buyerProfileSummary: "Experienced tech entrepreneur with $2M liquid capital.",
        sellerProfileSummary: "Stable SaaS business with 85% recurring revenue."
      });

      await addDoc(collection(db, 'missionLogs'), {
        userId: user.uid,
        text: `SYSTEM: New Deal Room initialized for ${mockListing.title}.`,
        timestamp: serverTimestamp(),
        type: 'system'
      });

      alert("Deal Room seeded. Check 'Deal Rooms' tab.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contactRequests');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background font-mono">
        <Cpu className="w-16 h-16 text-primary animate-spin mb-6" />
        <div className="text-primary tracking-[0.5em] animate-pulse">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-6 overflow-hidden relative">
        <Scanlines />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,194,224,0.05),transparent_70%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-[40px] border border-slate-100 p-12 text-center relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)]"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 neon-border">
            <Zap className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic glitch">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">BIZLINX AI</span>
          </h1>
          <p className="text-primary font-mono text-xs uppercase tracking-[0.3em] mb-8">The First AI Business Exit Firm</p>
          <p className="text-slate-500 mb-12 leading-relaxed font-medium">
            Enter the marketplace. Level up your exit. <br />
            AI-powered brokerage at the speed of light.
          </p>
          
          <button 
            onClick={handleLogin}
            className="neon-button w-full py-5 rounded-2xl text-lg flex items-center justify-center gap-4 group"
          >
            <span>INITIALIZE CONNECTION</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>

          <button 
            onClick={async () => {
              try {
                const cred = await signInAnonymously(auth);
                const demoProfile: UserProfile = {
                  uid: cred.user.uid,
                  email: 'demo@bizlinxai.com',
                  displayName: 'Demo Founder',
                  role: 'seller',
                  level: 5,
                  xp: 4500,
                  verified: true,
                  onboardingCompleted: true,
                  backgroundCheckStatus: 'cleared',
                  completedQuests: ['scorecard'],
                  currentQuest: 'exit'
                };
                await setDoc(doc(db, 'users', cred.user.uid), demoProfile);
                setUser(demoProfile);
              } catch (e) {
                console.error("Demo Login Error:", e);
              }
            }}
            className="mt-4 w-full py-5 rounded-2xl text-lg font-black italic uppercase tracking-widest bg-secondary/10 text-secondary border-2 border-secondary/20 hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5 flex items-center justify-center gap-3 group"
          >
            <Zap className="w-6 h-6 group-hover:animate-pulse" />
            <span>SKIP PROTOCOL (DEMO MODE)</span>
          </button>
          
          <div className="mt-12 flex justify-center gap-8 opacity-30">
            <Globe className="w-6 h-6 text-slate-400" />
            <ShieldCheck className="w-6 h-6 text-slate-400" />
            <Cpu className="w-6 h-6 text-slate-400" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user.onboardingCompleted && (user.role === 'buyer' || user.role === 'seller')) {
    return <Onboarding role={user.role} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Scanlines />
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 ml-64 p-12 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'journey' && (
            <motion.div 
              key="journey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2 italic uppercase tracking-tighter">
                    {user.role === 'seller' ? 'The Exit Quest' : 'The Acquisition Hunt'}
                  </h1>
                  <p className="text-primary font-mono text-sm">CURRENT OBJECTIVE: {user.currentQuest?.toUpperCase() || 'NONE'}</p>
                </div>
                {user.role === 'seller' && user.exitReadyScore === undefined && (
                  <button 
                    onClick={() => setActiveTab('scorecard')}
                    className="bg-secondary text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest animate-bounce shadow-lg shadow-secondary/20"
                  >
                    Take Deal-Ready Scorecard
                  </button>
                )}
                <div className="flex gap-4">
                  <div className="game-card px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm text-slate-700">HEALTH: 100%</span>
                  </div>
                  <div className="game-card px-6 py-3 rounded-2xl flex items-center gap-3 border-secondary/10">
                    <Zap className="w-5 h-5 text-secondary" />
                    <span className="font-bold text-sm text-secondary">ENERGY: 85%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(user.role === 'seller' ? sellerQuests : buyerQuests).map((q) => (
                  <QuestCard 
                    key={q.id} 
                    quest={{
                      ...q,
                      status: user.completedQuests.includes(q.id) ? 'completed' : (user.currentQuest === q.id ? 'active' : 'locked')
                    }} 
                    onStart={handleStartQuest} 
                  />
                ))}
              </div>

              {user.role === 'seller' && (
                <div className="game-card p-8 rounded-[40px] border-slate-100 bg-white shadow-sm">
                  <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-900 italic uppercase tracking-tighter">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    Verification Quest
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.verified ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Fingerprint className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Identity Check</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">{user.verified ? 'COMPLETED' : 'PENDING'}</p>
                      </div>
                      {!user.verified && (
                        <button 
                          onClick={() => handleUpdateUser(user.uid, { verified: true })}
                          className="neon-button px-4 py-2 rounded-xl text-[10px] w-full"
                        >
                          START SCAN
                        </button>
                      )}
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.backgroundCheckStatus === 'cleared' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Background Clear</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">{user.backgroundCheckStatus?.toUpperCase() || 'PENDING'}</p>
                      </div>
                      {user.backgroundCheckStatus !== 'cleared' && (
                        <button 
                          onClick={() => handleUpdateUser(user.uid, { backgroundCheckStatus: 'cleared' })}
                          className="neon-button px-4 py-2 rounded-xl text-[10px] w-full"
                        >
                          RUN CHECK
                        </button>
                      )}
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.exitReadyScore !== undefined ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Deal Readiness</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">{user.exitReadyScore !== undefined ? `${user.exitReadyScore}% SCORE` : 'NOT TESTED'}</p>
                      </div>
                      {user.exitReadyScore === undefined && (
                        <button 
                          onClick={() => setActiveTab('scorecard')}
                          className="neon-button px-4 py-2 rounded-xl text-[10px] w-full"
                        >
                          TAKE TEST
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {user.role === 'seller' && (
                <div className="game-card p-8 rounded-[40px] border-primary/10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                      <Briefcase className="w-6 h-6 text-primary" />
                      MY ASSETS
                    </h2>
                    <button 
                      onClick={() => {
                        const title = prompt("Enter Asset Title:");
                        if (title) {
                          handleSeedListings();
                        }
                      }}
                      className="neon-button px-6 py-2 rounded-xl text-[10px] flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      LIST NEW ASSET
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.filter(l => l.sellerId === user.uid).map(l => (
                      <div key={l.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{l.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{l.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">${l.askingPrice.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Asking Price</p>
                        </div>
                      </div>
                    ))}
                    {listings.filter(l => l.sellerId === user.uid).length === 0 && (
                      <div className="col-span-full py-12 text-center opacity-30">
                        <p className="font-mono uppercase tracking-widest text-slate-400">No assets listed under this profile.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {user.role === 'seller' && contactRequests.some(r => r.status === 'pending') && (
                <div className="game-card p-8 rounded-[40px] border-secondary/20 bg-secondary/5">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-secondary">
                    <Handshake className="w-6 h-6" />
                    INCOMING CONNECTION REQUESTS
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactRequests.filter(r => r.status === 'pending').map(request => {
                      const listing = listings.find(l => l.id === request.listingId);
                      return (
                        <div key={request.id} className="p-6 bg-white rounded-2xl border border-slate-100 flex flex-col gap-4 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-tighter">BUYER_ID: {request.buyerId.slice(0, 8)}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-800">RE: {listing?.title || 'Unknown Asset'}</p>
                                  <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">{request.matchScore || 0}% MATCH</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 italic leading-relaxed">"{request.message}"</p>
                            {request.buyerProfileSummary && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-[10px] font-bold text-primary uppercase mb-1">AI Buyer Profile Summary:</p>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{request.buyerProfileSummary}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handlePurchaseProfile(request.buyerId)}
                              className="flex-1 bg-secondary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Unlock Profile ($33)</span>
                            </button>
                            <button 
                              onClick={() => handleUpdateContactRequest(request.id, 'accepted')}
                              className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all active:scale-95"
                            >
                              Authorize
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 game-card p-8 rounded-[40px] border-primary/10">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
                    <Terminal className="w-6 h-6 text-primary" />
                    MISSION LOG
                  </h2>
                  <div className="space-y-4 font-mono text-sm max-h-[300px] overflow-y-auto pr-2">
                    {missionLogs.length > 0 ? missionLogs.map(log => (
                      <div key={log.id} className="flex gap-4 text-slate-400">
                        <span>[{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'RECENT'}]</span>
                        <span className={log.type === 'oracle' ? 'text-secondary' : 'text-primary'}>
                          {log.type.toUpperCase()}:
                        </span>
                        <span className="text-slate-600">{log.text}</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex gap-4 text-slate-400">
                          <span>[21:44:02]</span>
                          <span className="text-primary">SYSTEM:</span>
                          <span className="text-slate-600">Connection established. Welcome back, {user.displayName}.</span>
                        </div>
                        <div className="flex gap-4 text-slate-400">
                          <span>[21:45:10]</span>
                          <span className="text-secondary">ORACLE:</span>
                          <span className="text-slate-600">Market volatility detected in SaaS sector. Opportunity high.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="game-card p-8 rounded-[40px] border-secondary/30 bg-secondary/5">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-secondary">
                    <TrendingUp className="w-6 h-6" />
                    MARKET STATS
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                        <span>Global Volume</span>
                        <span className="text-secondary">+12.4%</span>
                      </div>
                      <ProgressBar progress={75} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                        <span>AI Confidence</span>
                        <span className="text-primary">98.2%</span>
                      </div>
                      <ProgressBar progress={98} />
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        "The marketplace is currently in a state of high liquidity. Strategic exits are favored."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'scorecard' && (
            <Scorecard user={user} onComplete={handleScorecardComplete} />
          )}

          {activeTab === 'academy' && (
            <Academy user={user} onExecuteAgent={handleExecuteAgent} />
          )}

          {activeTab === 'firm' && (
            <FirmDashboard 
              user={user} 
              onSeedListings={handleSeedListings}
              onSeedMissionLogs={handleSeedMissionLogs}
              onSeedDealRoom={handleSeedDealRoom}
            />
          )}

          {activeTab === 'swipe' && (
            <motion.div 
              key="swipe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <SwipeInterface 
                listings={listings.map(l => ({ ...l, matchScore: matchScores[l.id] }))} 
                onSwipe={handleSwipe} 
              />
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">The Global Network</h1>
                <div className="flex gap-4">
                  <div className="flex bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white">All Assets</button>
                    <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Franchises</button>
                    <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">SaaS</button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input 
                      type="text" 
                      placeholder="SCAN NETWORK..." 
                      className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3 text-slate-900 font-mono focus:outline-none focus:border-primary w-80 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.length > 0 ? listings.map(l => (
                  <motion.div 
                    key={l.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedListing(l)}
                    className="game-card p-6 rounded-3xl border-slate-100 hover:border-primary group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-1 rounded uppercase tracking-[0.2em] w-fit">
                          {l.industry}
                        </span>
                        {user.role === 'buyer' && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                            <Sparkles className="w-3 h-3" />
                            <span>{matchScores[l.id] ? `${matchScores[l.id]}% MATCH` : `${Math.floor(85 + Math.random() * 14)}% MATCH`}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">ID: {l.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 group-hover:text-primary transition-all">{l.title}</h3>
                    <div className="space-y-2 mb-6 font-mono text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>REVENUE:</span>
                        <span className="text-slate-900 font-bold">${l.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EBITDA:</span>
                        <span className="text-slate-900 font-bold">${l.ebitda.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="text-xl font-black text-primary">${l.askingPrice.toLocaleString()}</span>
                      {user.role === 'buyer' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRequestContact(l); }}
                          className="neon-button px-4 py-2 rounded-xl text-[10px]"
                        >
                          Request Contact
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Globe className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-800">No Assets Detected</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto">The global network is currently silent. Initialize a scan to discover new opportunities.</p>
                    </div>
                    <button 
                      onClick={handleSeedListings}
                      className="neon-button px-8 py-3 rounded-xl text-xs"
                    >
                      Initialize System Scan (Seed Mock Data)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'deals' && (
            <motion.div 
              key="deals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
                  {selectedDealId ? 'Secure Terminal' : 'Secure Deal Rooms'}
                </h1>
                {!selectedDealId && (
                  <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full border border-secondary/20">
                    <Trophy className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">$10K Success Fee per Closed Deal</span>
                  </div>
                )}
                {selectedDealId && (
                  <button 
                    onClick={() => setSelectedDealId(null)}
                    className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2 hover:opacity-80"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Network
                  </button>
                )}
              </div>

              {selectedDealId && (
                <button 
                  onClick={() => setSelectedDealId(null)}
                  className="mb-6 flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-mono text-xs uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Active Deals
                </button>
              )}

              {!selectedDealId ? (
                <div className="grid grid-cols-1 gap-6">
                  {deals.map(deal => {
                    const listing = listings.find(l => l.id === deal.listingId);
                    return (
                      <div 
                        key={deal.id} 
                        onClick={() => setSelectedDealId(deal.id)}
                        className="game-card p-8 rounded-[40px] border-slate-100 flex items-center justify-between cursor-pointer hover:border-primary transition-all group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Handshake className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{listing?.title || 'Asset Transaction'}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">STATUS: {deal.status}</p>
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">SECURE CHANNEL</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button className="neon-button px-8 py-3 rounded-2xl flex items-center gap-3">
                            <MessageSquare className="w-5 h-5" />
                            <span>Open Terminal</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {deals.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                      <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-mono uppercase tracking-widest text-slate-400">No active deal rooms detected.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="game-card p-0 rounded-[40px] border-slate-100 h-[700px] flex flex-col bg-white shadow-sm overflow-hidden">
                  {/* Deal Room Header/Tabs */}
                  <div className="flex border-b border-slate-50">
                    <button 
                      onClick={() => setDealSubTab('chat')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${dealSubTab === 'chat' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Secure Chat
                    </button>
                    <button 
                      onClick={() => setDealSubTab('checklist')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${dealSubTab === 'checklist' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Due Diligence
                    </button>
                    <button 
                      onClick={() => setDealSubTab('vault')}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${dealSubTab === 'vault' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Document Vault
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    {dealSubTab === 'chat' && (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-4 p-8 font-mono text-sm">
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`p-4 rounded-2xl max-w-[80%] ${
                                msg.senderId === user?.uid 
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                  : 'bg-slate-50 border border-slate-100 text-slate-600'
                              }`}>
                                <p className="text-xs font-bold opacity-50 mb-1">
                                  {msg.senderId === user?.uid ? 'YOU' : 'COUNTERPARTY'}
                                </p>
                                {msg.text}
                                <p className="text-[8px] opacity-30 mt-2 text-right">
                                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : 'SENDING...'}
                                </p>
                              </div>
                            </div>
                          ))}
                          {messages.length === 0 && (
                            <div className="text-center py-20 opacity-30">
                              <Terminal className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                              <p className="font-mono uppercase tracking-widest text-slate-400">Secure connection initialized. Awaiting transmission...</p>
                            </div>
                          )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-50 flex gap-4 bg-slate-50/50">
                          <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="ENTER SECURE TRANSMISSION..." 
                            className="flex-1 bg-white border border-slate-100 rounded-xl px-6 py-4 text-slate-900 font-mono focus:outline-none focus:border-primary shadow-inner"
                          />
                          <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-primary text-white px-8 rounded-xl hover:opacity-80 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </form>
                      </>
                    )}

                    {dealSubTab === 'checklist' && (
                      <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Due Diligence Protocol</h3>
                            <p className="text-xs text-slate-400 font-mono uppercase">AI-Generated Compliance Checklist</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary">
                              {Math.round((deals.find(d => d.id === selectedDealId)?.checklist?.filter(c => c.completed).length || 0) / (deals.find(d => d.id === selectedDealId)?.checklist?.length || 1) * 100)}%
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Completion</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {deals.find(d => d.id === selectedDealId)?.checklist?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                              <button 
                                onClick={async () => {
                                  const deal = deals.find(d => d.id === selectedDealId);
                                  if (!deal || !deal.checklist) return;
                                  const newChecklist = [...deal.checklist];
                                  newChecklist[idx] = { ...newChecklist[idx], completed: !newChecklist[idx].completed };
                                  await setDoc(doc(db, 'deals', deal.id), { checklist: newChecklist }, { merge: true });
                                }}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'}`}
                              >
                                {item.completed && <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <div className="flex-1">
                                <p className={`text-sm font-bold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.task}</p>
                                <p className="text-[10px] text-primary font-mono uppercase mt-0.5">{item.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dealSubTab === 'vault' && (
                      <div className="flex-1 overflow-y-auto p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Document Vault</h3>
                            <p className="text-xs text-slate-400 font-mono uppercase">Secure AES-256 Encrypted Storage</p>
                          </div>
                          <button className="neon-button px-6 py-2 rounded-xl text-[10px] flex items-center gap-2">
                            <FileUp className="w-4 h-4" />
                            UPLOAD DOC
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { name: 'LOI_Signed.pdf', size: '1.2 MB', date: '2 hours ago', type: 'Legal' },
                            { name: 'Tax_Returns_2023.zip', size: '15.4 MB', date: 'Yesterday', type: 'Financial' },
                            { name: 'Employee_Contracts.pdf', size: '4.8 MB', date: '3 days ago', type: 'HR' },
                            { name: 'Asset_List.xlsx', size: '842 KB', date: '1 week ago', type: 'Operations' }
                          ].map((doc, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group">
                              <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">{doc.size}</span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="text-[10px] text-primary font-bold uppercase">{doc.type}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'adminChat' && (
            <motion.div 
              key="adminChat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Admin Support</h1>
              <div className="game-card p-8 rounded-[40px] border-slate-100 h-[600px] flex flex-col bg-white shadow-sm">
                <div className="flex-1 overflow-y-auto space-y-4 p-4 font-mono text-sm">
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-[80%] text-slate-600">
                      Welcome to the Command Center. How can we assist your exit strategy today?
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-50 flex gap-4">
                  <input 
                    type="text" 
                    placeholder="ENTER MESSAGE..." 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-slate-900 font-mono focus:outline-none focus:border-primary"
                  />
                  <button className="bg-primary text-white p-4 rounded-xl hover:opacity-80 shadow-lg shadow-primary/20">
                    <Zap className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <Profile user={user} onUpdate={(updates) => handleUpdateUser(user.uid, updates)} />
          )}

          {activeTab === 'profile' && (
            <Profile user={user} onUpdate={(updates) => handleUpdateUser(user.uid, updates)} />
          )}

          {activeTab === 'about' && <AboutBizLinx />}

          {activeTab === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter neon-text">GOD MODE</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="game-card p-8 rounded-[40px] border-secondary/50">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-secondary">
                    <User className="w-6 h-6" />
                    PLAYER DATABASE
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {users.map(u => (
                      <div key={u.uid} className="p-4 bg-background/50 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{u.displayName}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">LVL: {u.level} | {u.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateUser(u.uid, { verified: !u.verified })}
                            className={`p-2 rounded-lg transition-all ${u.verified ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-white/5'}`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button className="text-red-500 hover:text-red-700 p-2 hover:bg-red-500/10 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="game-card p-8 rounded-[40px] border-primary/50">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-primary">
                    <Globe className="w-6 h-6" />
                    ASSET CONTROL
                  </h3>
                  <div className="space-y-4">
                    <button 
                      onClick={handleSeedListings}
                      className="neon-button w-full py-4 rounded-2xl text-xs"
                    >
                      CRAWL NEW ASSETS (SEED)
                    </button>
                    <button 
                      onClick={handleCrawlBizBuySell}
                      disabled={isCrawling}
                      className={`neon-button w-full py-4 rounded-2xl text-xs ${isCrawling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isCrawling ? 'CRAWLING BIZBUYSELL...' : 'SCRAPE BIZBUYSELL (AI)'}
                    </button>
                    <button 
                      onClick={handleSeedMissionLogs}
                      className="neon-button w-full py-4 rounded-2xl text-xs border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      SEED MISSION LOGS
                    </button>
                    <button 
                      onClick={handleSeedDealRoom}
                      className="neon-button w-full py-4 rounded-2xl text-xs border-secondary text-secondary hover:bg-secondary hover:text-background"
                    >
                      SEED DEAL ROOM
                    </button>
                    <button className="neon-button w-full py-4 rounded-2xl text-xs border-secondary text-secondary hover:bg-secondary hover:text-background">PURGE INACTIVE NODES</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <button 
        onClick={() => setIsOracleOpen(!isOracleOpen)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-background flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.4)] z-[110] transition-all hover:scale-110 ${isOracleOpen ? 'rotate-45' : ''}`}
      >
        {isOracleOpen ? <X className="w-8 h-8" /> : <Cpu className="w-8 h-8" />}
      </button>

      <AnimatePresence>
        {isOracleOpen && <OracleBot user={user} listings={listings} contactRequests={contactRequests} onClose={() => setIsOracleOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail 
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onRequestContact={(l) => {
              setSelectedListing(null);
              handleRequestContact(l);
            }}
            matchScore={matchScores[selectedListing.id]}
            userRole={user?.role || 'buyer'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
