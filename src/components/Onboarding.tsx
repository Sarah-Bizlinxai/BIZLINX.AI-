import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle2, Zap } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
}

const BUYER_QUESTIONS: Question[] = [
  { id: 'b1', text: 'What is your primary motivation for buying a business?', options: ['Financial Independence', 'Strategic Expansion', 'Lifestyle Change', 'Legacy Building'] },
  { id: 'b2', text: 'What is your liquid capital available for down payment?', options: ['Under $50k', '$50k - $250k', '$250k - $1M', 'Over $1M'] },
  { id: 'b3', text: 'What is your preferred industry?', options: ['SaaS/Tech', 'Brick & Mortar', 'Service-based', 'Franchise'] },
  { id: 'b4', text: 'How much time can you commit to the business?', options: ['Full-time (40+ hrs)', 'Part-time (10-20 hrs)', 'Passive (Investor only)', 'Flexible'] },
  { id: 'b5', text: 'What is your experience level in management?', options: ['Expert (10+ years)', 'Intermediate (3-5 years)', 'Beginner', 'None'] },
  { id: 'b6', text: 'What is your target annual EBITDA range?', options: ['Under $100k', '$100k - $500k', '$500k - $2M', 'Over $2M'] },
  { id: 'b8', text: 'What is your preferred geographic scope?', options: ['Local (50 miles)', 'Regional (State)', 'National', 'Global/Remote'] },
  { id: 'b9', text: 'Do you have SBA pre-approval or existing financing?', options: ['Yes, fully approved', 'In progress', 'No, but qualified', 'No'] },
  { id: 'b10', text: 'What is your target timeline to close a deal?', options: ['ASAP (< 3 months)', '3-6 months', '6-12 months', '1 year+'] },
  { id: 'b15', text: 'What is your risk tolerance level?', options: ['Low (Stable cash flow)', 'Medium (Growth potential)', 'High (Turnaround)', 'Extreme (Distressed)'] },
];

const SELLER_QUESTIONS: Question[] = [
  { id: 's1', text: 'Why are you selling your business?', options: ['Retirement', 'New Venture', 'Health/Personal', 'Burnout'] },
  { id: 's2', text: 'What is your annual revenue?', options: ['Under $100k', '$100k - $500k', '$500k - $2M', 'Over $2M'] },
  { id: 's3', text: 'How many employees do you have?', options: ['Solo', '1-5', '6-20', '20+'] },
  { id: 's5', text: 'How long are you willing to stay for transition?', options: ['None', '1-3 months', '3-6 months', '1 year+'] },
  { id: 's6', text: 'What is your annual EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)?', options: ['Under $50k', '$50k - $200k', '$200k - $1M', 'Over $1M'] },
  { id: 's7', text: 'How long has the business been operating?', options: ['< 2 years', '2-5 years', '5-10 years', '10+ years'] },
  { id: 's9', text: 'What percentage of your revenue is recurring?', options: ['0-25%', '25-50%', '50-75%', '75-100%'] },
  { id: 's13', text: 'How many hours does the owner work weekly?', options: ['< 10 hrs (Passive)', '10-30 hrs', '40+ hrs', 'Seasonal'] },
  { id: 's17', text: 'What is your target exit timeline?', options: ['ASAP', '3-6 months', '6-12 months', '1 year+'] },
  { id: 's18', text: 'Are you open to seller financing?', options: ['Yes (up to 50%)', 'Yes (up to 20%)', 'No', 'Maybe'] },
];

interface OnboardingProps {
  role: 'buyer' | 'seller';
  onComplete: (answers: Record<string, string>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ role, onComplete }) => {
  const questions = role === 'buyer' ? BUYER_QUESTIONS : SELLER_QUESTIONS;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: option }));
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    onComplete(answers);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl mb-8">
        <button
          onClick={() => onComplete({})}
          className="w-full bg-secondary/10 text-secondary border-2 border-secondary/20 py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5 flex items-center justify-center gap-3 group"
        >
          <Zap className="w-5 h-5 group-hover:animate-pulse" />
          <span>Bypass Protocol & Enter Dashboard</span>
        </button>
      </div>

      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-mono text-primary uppercase tracking-widest">BizLinx AI: Onboarding Protocol</h2>
            <span className="text-xs text-slate-400 font-mono">{currentStep + 1} / {questions.length}</span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              {questions[currentStep].text}
            </h1>

            <div className="grid grid-cols-1 gap-4">
              {questions[currentStep].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    answers[questions[currentStep].id] === option
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-primary/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option}</span>
                    {answers[questions[currentStep].id] === option && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest">Previous</span>
          </button>

          {currentStep === questions.length - 1 && answers[questions[currentStep].id] ? (
            <button
              onClick={handleFinish}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Initialize Profile
            </button>
          ) : (
            <button
              onClick={() => onComplete({})}
              className="bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-300 transition-all text-[10px]"
            >
              Skip Protocol (Demo Mode)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
