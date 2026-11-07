import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Phone, 
  RefreshCw, 
  Layers, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  User, 
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Volume2,
  Pause,
  Loader2
} from 'lucide-react';
import { Debtor, LogEntry } from '../types';
import { calculateDebtorTrustScore, DebtorTrustInput } from '../utils/scoring';

interface LogViewModalProps {
  debtor: Debtor;
  onClose: () => void;
  onSimulateReminder: (debtorId: string, stageNum?: number, customEmail?: string, customSubject?: string, customBody?: string) => void;
  onMarkAsPaid: (debtorId: string) => void;
  onFileDispute: (debtorId: string, reason: string) => void;
  onResolveDispute: (debtorId: string) => void;
  onTriggerBlacklist: () => void;
  onConfirmHandshake?: (debtorId: string) => void;
  onAddDebtorReply?: (debtorId: string, replyMessage: string, category: string, diagnosis: string, actionText: string) => void;
  onTogglePauseCampaign?: (debtorId: string) => void;
}

export default function LogViewModal({ 
  debtor, 
  onClose, 
  onSimulateReminder, 
  onMarkAsPaid,
  onFileDispute,
  onResolveDispute,
  onTriggerBlacklist,
  onConfirmHandshake,
  onAddDebtorReply,
  onTogglePauseCampaign
}: LogViewModalProps) {
  const [activeTab, setActiveTab] = useState<'AI' | 'RECORDS' | 'TRUST_SCORE' | 'COGNITIVE'>('COGNITIVE');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(debtor.history[debtor.history.length - 1] || null);
  const [testEmail, setTestEmail] = useState<string>(debtor.email || '');
  const [selectedStageNum, setSelectedStageNum] = useState<number>(Math.min(8, Math.max(1, debtor.remindersCount + 1)));
  const [isSendingAll, setIsSendingAll] = useState<boolean>(false);
  const [showLedgerPreview, setShowLedgerPreview] = useState<boolean>(false);

  // COGNITIVE HUB ENGINE STATES
  const [cognitiveLoading, setCognitiveLoading] = useState(false);
  const [cognitiveData, setCognitiveData] = useState<{
    behaviorAnalysis: string;
    riskLevel: string;
    recommendedStrategy: string;
    nextBestActionMessage: string;
    suggestedEscalationOption: string;
  } | null>(null);
  const [cognitiveError, setCognitiveError] = useState('');
  const [customSubject, setCustomSubject] = useState('Outstanding Invoice Resolution Agreement');
  const [customBody, setCustomBody] = useState('');
  const [sendingCustom, setSendingCustom] = useState(false);

  const handleTriggerCognitiveAnalysis = async () => {
    setCognitiveLoading(true);
    setCognitiveError('');
    try {
      const response = await fetch('/api/analyze-debtor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantBusinessName: debtor.merchantBusinessName || 'Representative',
          merchantLocation: debtor.merchantLocation || 'Nigeria',
          merchantEthnicity: debtor.merchantEthnicity || 'Nigerian',
          merchantWhatTheySell: debtor.merchantWhatTheySell || 'Digital Deliverables',
          isFreelancer: debtor.isFreelancer || false,
          debtorName: debtor.name,
          debtorLocation: debtor.debtorLocation || 'Nigeria',
          amount: debtor.amount,
          currency: debtor.currency,
          paymentDueDate: debtor.paymentDueDate || new Date().toISOString().split('T')[0],
          remindersCount: debtor.remindersCount,
          remindStyle: debtor.remindStyle || 'GENTLE',
          historyLogs: debtor.history || []
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error analyzer result');
      }

      const data = await response.json();
      setCognitiveData(data);
      if (data.nextBestActionMessage) {
        setCustomBody(data.nextBestActionMessage);
      }
    } catch (err: any) {
      setCognitiveError(err.message || 'Error occurred during AI analysis');
      console.error(err);
    } finally {
      setCognitiveLoading(false);
    }
  };

  const handleDispatchCustomEmail = async () => {
    if (!customBody) return;
    setSendingCustom(true);
    try {
      await onSimulateReminder(
        debtor.id,
        selectedStageNum,
        testEmail,
        customSubject,
        customBody
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSendingCustom(false);
    }
  };

  const handleSendFullCampaign = async () => {
    setIsSendingAll(true);
    try {
      for (let s = 1; s <= 8; s++) {
        await onSimulateReminder(debtor.id, s, testEmail);
        // 800ms spacing to guarantee neat, sequential delivery order of all 8 touches in the email client
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (err) {
      console.error("Failed executing automated campaign cycle:", err);
    } finally {
      setIsSendingAll(false);
    }
  };

  // AI Response Simulator States
  const [replyInput, setReplyInput] = useState('');
  const [analyzingReply, setAnalyzingReply] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    category: string;
    languageDetected: string;
    dialectAnalysis: string;
    confidenceScore: string;
    suggestedPlatformAction: string;
    politeSmsDraftReply: string;
  } | null>(null);
  const [replyError, setReplyError] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'ai_reply'>('ai_reply');

  // Debtor Trust Score Parameters
  const [timesLogged, setTimesLogged] = useState<number>(debtor.remindersCount || 1);
  const [timeToSettlement, setTimeToSettlement] = useState<'1-3' | '4-7' | '8-14' | '14+' | 'not-paid'>('4-7');
  const [escalationDepth, setEscalationDepth] = useState<'sms-web' | 'email' | 'robocall' | 'disconnected'>('sms-web');
  const [disputeStatus, setDisputeStatus] = useState<'none' | 'disputed' | 'clicked-confirm'>('none');

  const [debtorTrustResult, setDebtorTrustResult] = useState<{
    debtor_phone: string;
    trust_score: number;
    rating_tier: string;
    score_color_code: string;
    behavioral_summary: string;
    recommended_chaser_package: string;
  } | null>(null);

  useEffect(() => {
    setTimesLogged(debtor.remindersCount || 1);
    
    // Map same input logic as backend
    let ttsVal: '1-3' | '4-7' | '8-14' | '14+' | 'not-paid' = 'not-paid';
    if (debtor.status === 'PAID') {
      if (debtor.remindersCount <= 1) ttsVal = '1-3';
      else if (debtor.remindersCount <= 2) ttsVal = '4-7';
      else ttsVal = '8-14';
    } else {
      if (debtor.remindersCount === 0) ttsVal = '1-3';
      else if (debtor.remindersCount === 1) ttsVal = '4-7';
      else if (debtor.remindersCount <= 2) ttsVal = '8-14';
      else ttsVal = '14+';
    }
    setTimeToSettlement(ttsVal);

    let escVal: 'sms-web' | 'email' | 'robocall' | 'disconnected' = 'sms-web';
    const cleanPh = debtor.phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPh.endsWith('404') || cleanPh.endsWith('300')) {
      escVal = 'disconnected';
    } else {
      const hasCall = debtor.history.some(log => log.type === 'call');
      const hasEmail = debtor.history.some(log => log.type === 'email');
      if (hasCall) escVal = 'robocall';
      else if (hasEmail) escVal = 'email';
    }
    setEscalationDepth(escVal);

    let intVal: 'none' | 'disputed' | 'clicked-confirm' = 'none';
    if (debtor.isDisputed) {
      intVal = 'disputed';
    } else if (debtor.handshakeStatus === 'CONFIRMED' || debtor.receiptName) {
      intVal = 'clicked-confirm';
    }
    setDisputeStatus(intVal);

    // Fetch live score calculation from the secure backend express service
    fetch('/api/score/debtor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: debtor.phone,
        timeToSettlement: ttsVal,
        escalationDepth: escVal,
        frequencyRecidivism: debtor.remindersCount >= 3 ? '3-or-more-merchants' : 'first-time',
        transactionIntegrity: intVal
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data && data.trust_score) {
        setDebtorTrustResult(data);
      }
    })
    .catch(err => {
      console.warn("Could not fetch backend debtor score, using local calculation fallback:", err.message);
    });
  }, [debtor]);

  // Algorithmic Trust Score calculation
  const calculateTrustScore = () => {
    if (escalationDepth === 'DISCONNECTED') {
      return 300;
    }
    let score = 600;

    // 1. Time-to-Settlement (35% of total score weight)
    if (timeToSettlement === '1-3') score += 50;
    else if (timeToSettlement === '4-7') score += 20;
    else if (timeToSettlement === '8-14') score -= 40;
    else if (timeToSettlement === '14+') score -= 100;

    // 2. Escalation Depth (30% of total score weight)
    if (escalationDepth === 'SMS') score += 40;
    else if (escalationDepth === 'EMAIL') score -= 10;
    else if (escalationDepth === 'ROBOCALL') score -= 80;

    // 3. Frequency & Volume Recidivism (20% of total score weight)
    if (timesLogged === 1) {
      // maintain baseline (600)
    } else if (timesLogged >= 3) {
      score -= 120;
    } else if (timesLogged > 1 && disputeStatus !== 'DISPUTED') {
      score += 30;
    }

    // 4. Transaction Integrity (15% of total score weight)
    if (disputeStatus === 'ACKNOWLEDGED') {
      score += 35;
    }

    return Math.min(Math.max(score, 300), 850);
  };

  const scoreVal = debtorTrustResult ? debtorTrustResult.trust_score : calculateTrustScore();

  const getScoreDetails = (score: number) => {
    if (debtorTrustResult) {
      const isEmerald = debtorTrustResult.score_color_code === 'Emerald' || debtorTrustResult.score_color_code === 'Green';
      const isAmber = debtorTrustResult.score_color_code === 'Amber';
      const isOrange = debtorTrustResult.score_color_code === 'Orange';
      return {
        tier: debtorTrustResult.rating_tier,
        color: debtorTrustResult.score_color_code,
        bg: isEmerald ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : isOrange ? 'bg-orange-500' : 'bg-rose-600',
        text: isEmerald ? 'text-emerald-400' : isAmber ? 'text-amber-500' : isOrange ? 'text-orange-500' : 'text-rose-650',
        border: isEmerald ? 'border-emerald-250' : isAmber ? 'border-amber-250' : isOrange ? 'border-orange-250' : 'border-rose-250',
        insight: debtorTrustResult.behavioral_summary
      };
    }

    if (score >= 800) {
      return { 
        tier: 'Excellent', 
        color: 'Green', 
        bg: 'bg-emerald-500', 
        text: 'text-emerald-550', 
        border: 'border-emerald-250', 
        insight: 'Client has an exceptional transaction integrity background. Consistently clears obligations proactively with robust cooperation.' 
      };
    } else if (score >= 720) {
      return { 
        tier: 'Good', 
        color: 'Light Green', 
        bg: 'bg-emerald-400', 
        text: 'text-emerald-400', 
        border: 'border-emerald-150', 
        insight: 'Good reliability profile. Low-touch client, typically resolves outstanding balances with minor reminders and has active dispute hygiene.' 
      };
    } else if (score >= 620) {
      return { 
        tier: 'Fair', 
        color: 'Amber', 
        bg: 'bg-amber-500', 
        text: 'text-amber-500', 
        border: 'border-amber-250', 
        insight: 'Debtor regularly acknowledges invoices but consistently defaults past the initial deadline, requiring SMS nudges to settle balances.' 
      };
    } else if (score >= 500) {
      return { 
        tier: 'High Risk', 
        color: 'Orange', 
        bg: 'bg-orange-500', 
        text: 'text-orange-500', 
        border: 'border-orange-250', 
        insight: 'Subprime repayment posture. High chance of default, requires active campaign escalation to trigger attention.' 
      };
    } else {
      return { 
        tier: 'Poor', 
        color: 'Red', 
        bg: 'bg-rose-600', 
        text: 'text-rose-650', 
        border: 'border-rose-250', 
        insight: 'Extremely high delinquency risk. Phone blocked, or repeated overdue histories logged from multiple merchant departments.' 
      };
    }
  };

  const details = getScoreDetails(scoreVal);
  
  const recommendedChaserPackage = () => {
    if (debtorTrustResult) {
      return debtorTrustResult.recommended_chaser_package;
    }
    if (escalationDepth === 'disconnected') return 'Legal Action Dispatch / In-Person Dispute Resolution';
    if (scoreVal < 500) return 'High Intensity Robocall & Voice Loop Sequence';
    if (scoreVal < 620) return 'Standard 14-Day Escalated Reminder Ladder';
    if (scoreVal < 720) return 'Standard 7-Day Ladder';
    return 'Self-Service Paylink Nudge Campaigns';
  };

  const jsonPayloadString = JSON.stringify({
    debtor_phone: debtor.phone,
    trust_score: scoreVal,
    rating_tier: details.tier,
    score_color_code: details.color,
    behavioral_summary: details.insight,
    recommended_chaser_package: recommendedChaserPackage()
  }, null, 2);
  
  // AI State
  const [analysis, setAnalysis] = useState<{
    behaviorAnalysis: string;
    riskLevel: string;
    recommendedStrategy: string;
    nextBestActionMessage: string;
    suggestedEscalationOption: string;
  } | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showScoringJson, setShowScoringJson] = useState(false);

  // 🤖 AI REPLY CLASSIFICATION ACTIONS
  const handleClassifyDebtorReply = async () => {
    if (!replyInput.trim()) {
      setReplyError('Please enter a response message or select an example option.');
      return;
    }
    setReplyError('');
    setAnalyzingReply(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/classify-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyInput.trim() })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Classification error:", err);
      setReplyError(err.message || 'Failed to analyze reply message using backend AI.');
    } finally {
      setAnalyzingReply(false);
    }
  };

  const handleSaveAnalysedReplyToLogs = () => {
    if (!analysisResult || !onAddDebtorReply) return;
    onAddDebtorReply(
      debtor.id,
      replyInput.trim(),
      analysisResult.category,
      analysisResult.dialectAnalysis,
      analysisResult.suggestedPlatformAction
    );
    // Reset state
    setReplyInput('');
    setAnalysisResult(null);
  };

  // Fetch AI Collections Analysis Diagnostics on fold open
  useEffect(() => {
    let active = true;
    const fetchAIAnalysis = async () => {
      setLoadingAnalysis(true);
      setAnalysisError(null);
      try {
        const response = await fetch('/api/analyze-debtor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchantBusinessName: debtor.merchantBusinessName || "My SME Store",
            merchantLocation: debtor.merchantLocation || "Lagos, Nigeria",
            merchantEthnicity: debtor.merchantEthnicity || "Standard B2B Tone",
            merchantWhatTheySell: debtor.merchantWhatTheySell || "Products on credit",
            isFreelancer: debtor.isFreelancer || false,
            debtorName: debtor.name,
            debtorLocation: debtor.debtorLocation || "Nigeria",
            debtorPhone: debtor.phone,
            amount: debtor.amount,
            currency: debtor.currency,
            paymentDueDate: debtor.paymentDueDate || "Overdue",
            remindersCount: debtor.remindersCount,
            remindStyle: debtor.remindStyle || 'GENTLE',
            historyLogs: debtor.history
          })
        });
        if (!response.ok) {
          throw new Error('Failed to run AI collections modeling diagnostic');
        }
        const data = await response.json();
        if (active) {
          setAnalysis(data);
        }
      } catch (err: any) {
        console.error("AI fetch failure:", err);
        if (active) {
          setAnalysisError("Trade analysis loading. (If offline, we will fallback to standard smart rules instead.)");
        }
      } finally {
        if (active) {
          setLoadingAnalysis(false);
        }
      }
    };

    fetchAIAnalysis();
    return () => {
      active = false;
    };
  }, [debtor]);

  // Fallback state if Gemini key is unset or offline
  const getFallbackAnalysis = () => {
    const totalSent = debtor.remindersCount;
    const planName = debtor.remindStyle || 'GENTLE';
    const hasExhausted = totalSent >= (planName === 'GENTLE' ? 2 : 3);

    return {
      behaviorAnalysis: totalSent >= 3 
        ? "Relentless delays noticed. The trade partner has received multiple standard SMS, email and robotic calls but has chosen to delay response." 
        : "Unresponsive pattern. Awaiting active reply to polite follow-ups.",
      riskLevel: totalSent >= 3 ? "CRITICAL" : "MEDIUM",
      recommendedStrategy: `Utilize respected peer trade circles or regional business alliances. Since your background is ${debtor.merchantEthnicity || 'Igbo'}, apply polite but firm traditional respect and social networks in ${debtor.merchantLocation || 'Enugu'}.`,
      nextBestActionMessage: `Hello ${debtor.name}, I hope you are well. This is a follow up regarding the outstanding ${debtor.currency}${debtor.amount.toLocaleString()} due on ${debtor.paymentDueDate || 'due date'}. Please confirm dispatch of receipt at your earliest convenience to clear this balance. Thank you, ${debtor.merchantBusinessName || 'Management'}`,
      suggestedEscalationOption: hasExhausted 
        ? "Exhausted Plan Warning: Standard automated reminders are complete with no payment. We recommend community trade dispute settlement, formal commercial arbitration, or scheduling a structured split installment payment plan."
        : "Allow the remaining automated reminders in your current schedule to process fully."
    };
  };

  const currentAnalysis = analysis || getFallbackAnalysis();

  // Dynamic mapping from actual debtor state to DebtorTrustInput
  const getDynamicDebtorTrustInput = (): DebtorTrustInput => {
    let ttsVal: DebtorTrustInput['timeToSettlement'] = 'not-paid';
    if (debtor.status === 'PAID') {
      if (debtor.remindersCount <= 1) ttsVal = '1-3';
      else if (debtor.remindersCount <= 2) ttsVal = '4-7';
      else ttsVal = '8-14';
    } else {
      if (debtor.remindersCount === 0) ttsVal = '1-3';
      else if (debtor.remindersCount === 1) ttsVal = '4-7';
      else if (debtor.remindersCount <= 2) ttsVal = '8-14';
      else ttsVal = '14+';
    }

    let escVal: DebtorTrustInput['escalationDepth'] = 'sms-web';
    const cleanPh = debtor.phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPh.endsWith('404') || cleanPh.endsWith('300')) {
      escVal = 'disconnected';
    } else {
      const hasCall = debtor.history.some(log => log.type === 'call');
      const hasEmail = debtor.history.some(log => log.type === 'email');
      if (hasCall) escVal = 'robocall';
      else if (hasEmail) escVal = 'email';
    }

    let recVal: DebtorTrustInput['frequencyRecidivism'] = 'first-time';
    if (debtor.remindersCount >= 3) {
      recVal = 'multi-clean';
    }

    let intVal: DebtorTrustInput['transactionIntegrity'] = 'none';
    if (debtor.isDisputed) {
      intVal = 'disputed';
    } else if (debtor.handshakeStatus === 'CONFIRMED' || debtor.receiptName) {
      intVal = 'clicked-confirm';
    }

    return {
      phone: debtor.phone,
      timeToSettlement: ttsVal,
      escalationDepth: escVal,
      frequencyRecidivism: recVal,
      transactionIntegrity: intVal
    };
  };

  const activeDebtorResult = debtorTrustResult || calculateDebtorTrustScore(getDynamicDebtorTrustInput());

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Layers className="w-4 h-4 text-slate-550" />;
      case 'email':
        return <Mail className="w-4 h-4 text-slate-700" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-slate-700" />;
      case 'call':
        return <Phone className="w-4 h-4 text-slate-700" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskBadgeColor = (level: string) => {
    const upper = level.toUpperCase();
    if (upper === 'LOW') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (upper === 'MEDIUM') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (upper === 'HIGH') return 'bg-orange-50 text-orange-800 border-orange-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        id="log-view-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Detail card */}
      <div className="relative bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden mx-auto animate-fade-in flex flex-col h-150 max-h-[92vh] z-10">
        
        {/* Banner with Toggle Tabs */}
        <div className="flex border-b border-slate-200 bg-[#FAFAFA] select-none text-[10px] uppercase font-extrabold tracking-wider shrink-0 overflow-x-auto">
          <button 
            type="button"
            onClick={() => setActiveTab('COGNITIVE')}
            className={`flex-1 py-4 px-2 min-w-[124px] text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'COGNITIVE' 
                ? 'border-indigo-650 text-indigo-700 bg-white font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> 🧠 AI Cognitive Engine Hub
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 py-4 px-2 min-w-[120px] text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'RECORDS' 
                ? 'border-slate-950 text-slate-950 bg-white font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" /> Classic Reminder Logs & Messages ({debtor.history.length})
          </button>
        </div>

        {/* Modal View Content */}
        {activeTab === 'COGNITIVE' && (() => {
          const messageBankTemplates = [
            {
              id: 'pidgin-warm',
              title: '🇳🇬 1. Soft Pidgin Warm Bump',
              category: 'Warm Regional',
              subject: 'My brother, quick friendly check-in abeg',
              body: `Happy weekend [Name],

Trust work and family dey fine. Abeg my brother, I dey friendly check if you fit help us look dat outstanding invoice for [Amount] of [MyBusiness]. 

We really appreciate our partnership, make we just clear dat one off the ledger. God bless!`
            },
            {
              id: 'casual-friday',
              title: '🌞 2. Summer Casual Friday Pop',
              category: 'Warm Regional',
              subject: 'Happy Friday! Friendly billing check-in',
              body: `Hey [Name],

Happy Friday! Hope your week was absolute class.

Just a super quick friendly check-in regarding the outstanding invoice for [Amount] on [MyBusiness] that was due on [Date]. 

If you have two minutes before launching into weekend mode, settling this would keep our accounts completely clean! Thank you so much.`
            },
            {
              id: 'respect-yoruba',
              title: '🤝 3. Yoruba Professional Respect',
              category: 'Warm Regional',
              subject: 'Eku ise o, [Name] - Respectful Invoice Update',
              body: `Eku ise o, [Name].

Trust you are having an excellent and productive week. 

This is a respectful follow-up from the desk of [MyBusiness] regarding the outstanding balance of [Amount] which was due on [Date]. 

Thank you for your sincere commitment to our partnership as trade partners over the years. We look forward to your kind confirmation of transfer.`
            },
            {
              id: 'igbo-hustle',
              title: '💼 4. Igbo Commerce Trust Bond',
              category: 'Warm Regional',
              subject: 'Nna, trust business is flowing - Ledger Update',
              body: `Kedu [Name],

Trust business and client traffic is moving fine. 

Let's quickly tidy up the outstanding invoice of [Amount] for [MyBusiness] so we can close this folder and open up new trade scopes for the coming cycle. 

Business trust is the ultimate currency. Let me know when transfer is completed o!`
            },
            {
              id: 'collaborative',
              title: '💬 5. Collaborative Team Sync',
              category: 'Warm Regional',
              subject: 'Quick billing handshake check [Name]',
              body: `Hi [Name],

Hope you're having an amazing week with your projects.

Just wanted to do a quick billing sync and make sure our trade ledger is aligned. Our system shows an outstanding invoice balance of [Amount] due on [Date] for our recent collaborations.

Please let us know if everything is correct on your ledger or if you need any assistance!`
            },
            {
              id: 'b2b-cycle',
              title: '⚙️ 6. B2B Lifecycle Standard',
              category: 'B2B Tech',
              subject: 'Notification: Outstanding Account Statement [MyBusiness]',
              body: `Dear [Name],

This is an automated statement confirmation from [MyBusiness]. 

According to our central commerce records, your account holds an outstanding balance of [Amount] since [Date]. 

Please find coordinate options inside to process payment or contact our support segment if you have already scheduled settlement.`
            },
            {
              id: 'eoq-audit',
              title: '📈 7. Quarter-End Accounting Audit',
              category: 'B2B Tech',
              subject: 'ACCOUNT AUDIT ALERT: Reconciliation of invoice for [Amount]',
              body: `Dear [Name],

Our financial accounting department is currently undergoing our official Quarter-End ledger reconciliation.

We kindly request that you settle or upload the proof of remittance for the outstanding invoice number referencing the principal of [Amount] due on [Date] to avoid auditing discrepancies.

Your prompt action is highly treasured.`
            },
            {
              id: 'milestone',
              title: '🏗️ 8. Milestone Deliverables Completion',
              category: 'B2B Tech',
              subject: 'Project Handover completed: Invoice [Amount] reminder',
              body: `Hi [Name],

Now that we have successfully delivered other project aspects including "${debtor.merchantWhatTheySell || 'deliverables'}", we hope you are thoroughly pleased with the outcome.

To conclude this project stage cleanly, please process the outstanding milestone payment of [Amount] due to [MyBusiness]. 

We are excited about our next partnership phase!`
            },
            {
              id: 'ar-official',
              title: '🏢 9. Accounts Receivable Notification',
              category: 'B2B Tech',
              subject: 'Formal Statement from Accounts Receivable - [MyBusiness]',
              body: `Dear Trade Partner [Name],

This notification is sent by the Accounts Receivable and Credit Control division of [MyBusiness].

Please be advised that your account is overdue in the amount of [Amount]. Despite previous reminders, we have not received confirmation of payment.

Please direct remittance information to this desk today.`
            },
            {
              id: 'chat-brief',
              title: '📲 10. Direct Chat Quick Check-in',
              category: 'B2B Tech',
              subject: 'Brief chat handshake regarding invoice [Amount]',
              body: `Hi [Name] - hope you are doing great. Quick ping regarding the outstanding invoice balance of [Amount] for [MyBusiness] due on [Date]. 

Do you need another payment link or should we recirculate the banking coordinates? Thank you o!`
            },
            {
              id: 'flag-registry',
              title: '🚨 11. B2B Credit Registry Warning',
              category: 'High Escalation',
              subject: 'WARNING: Pending Trade Default Report - [Amount] Arrear',
              body: `Official Notice: [Name],

Please react immediately. This is our final notice before your profile and trade default status of [Amount] are officially referred to our partner B2B public Trade Reliability Registries and credit reporting segments.

Unresolved trade defaults severely impact commercial rating scores. To suspend report compilation, settle within 24 hours.`
            },
            {
              id: 'workspace-alert',
              title: '🛑 12. Workspace Credentials Revocation',
              category: 'High Escalation',
              subject: 'URGENT: Schedule suspension of staging link and workspace',
              body: `Urgent Trade Notice: [Name],

This is write confirmation that unless the overdue balance of [Amount] is settled within 48 hours, [MyBusiness] will execute temporary suspension protocols on all active workspace links, API keys, and staging environments.

To avoid disruption to your current web operations, please submit remittance confirmation today.`
            },
            {
              id: 'founder-direct',
              title: '👑 13. Office of the Founder Direct',
              category: 'High Escalation',
              subject: 'Direct Message from Founder Office - [MyBusiness]',
              body: `Dear [Name],

This is the founder's office of [MyBusiness] writing to you directly.

I am personally reviewing our outstanding accounts directory and noted that your invoice for [Amount] has remained overdue since [Date] despite multiple administrative touches.

I value our professional relationship and want to help resolve this. Please reach out to me directly or authorize payment today.`
            },
            {
              id: 'certified-demand',
              title: '⚖️ 14. Pre-Arbitration Certified Demand',
              category: 'High Escalation',
              subject: 'NOTICE OF INTENT: Formal Pre-Arbitration Demand',
              body: `NOTICE TO DEBTOR: [Name],

Take notice that [MyBusiness] hereby registers our formal pre-arbitration demand for the payment of outstanding fees totaling [Amount].

If this principal is not liquidated or resolved via a structured payment handshake within 3 days, we will pursue formal collection agency routing and contract mediation coordinates under governing commerce guidelines.`
            },
            {
              id: 'debt-cession',
              title: '💼 15. Debt Transfer Notice',
              category: 'High Escalation',
              subject: 'ACCOUNT TRANSFER STATUS: Outbound Debt Referral',
              body: `Dear [Name],

We regret to inform you that your outstanding account of [Amount] is scheduled for direct transfer to our independent debt collection agency partner.

Once transferred, all communication handles will be routed strictly through the collection agency's desk, and additional processing charges may apply.

To retain settlement with us, trigger transfer now.`
            },
            {
              id: 'split-half',
              title: '⚖️ 16. Empathetic 50/50 Split Offer',
              category: 'Barter & Instalment',
              subject: 'Flexible settlement option: 50% split plan',
              body: `Hi [Name],

We completely understand that cashflow timelines fluctuate. We want to support your financial operations during this cycle.

Would it be helpful to divide your outstanding invoice of [Amount] into two equal payments of 50% each? 

Upon settling the first half today, we will gladly pause further automated campaigns reminders for 15 days.`
            },
            {
              id: 'micro-payments',
              title: '💸 17. 20% Micro-Accounting Settle',
              category: 'Barter & Instalment',
              subject: 'Flexible micro-payments schedule proposal',
              body: `Dear [Name],

We want to make resolving your account balance as stress-free as possible. Let’s collaborate to settle this outstanding invoice of [Amount] amicably.

You can show goodwill by processing an initial micro-payment of just 20% today. We will set up a flexible payment ledger for the remaining principal. Please let us know if this handshake fits your schedule!`
            },
            {
              id: 'barter-value',
              title: '🎨 18. Barter & Skills Exchange Option',
              category: 'Barter & Instalment',
              subject: 'Innovative Settlement: Skills & Services exchange option',
              body: `Hi [Name],

Since we prioritize creative solutions and trade values above all, we want to propose an alternative if current liquid cashflows are highly strained.

To offset your outstanding invoice of [Amount], would you be interested in an equivalent value barter trade of digital services, consulting assets, or licensing rights? 

Let's do a brief quick chat to evaluate options and align resources.`
            },
            {
              id: 'grace-extension',
              title: '🗓️ 19. Grace Period 7-Day Extension',
              category: 'Barter & Instalment',
              subject: 'Ledger Grace Period: 7-Day extension option',
              body: `Dear [Name],

To support your payment scheduling, we are pleased to offer a direct 7-Day Grace Period Extension option on your outstanding invoice of [Amount] due on [Date].

By clicking confirmation on the extension ledger, you secure clean status and defer campaigns reminders for 7 calendar days. Let’s keep this completely amicable!`
            },
            {
              id: 'discount-incentive',
              title: '💝 20. Immediate 15% Settlement Discount',
              category: 'Barter & Instalment',
              subject: 'Incentive Offer: Deduct 15% discount if settled in 24h',
              body: `Dear [Name],

To thank you for your commitment to clearing our outstanding balances, [MyBusiness] has authorized a special one-time incentive.

If you process payment for your outstanding invoice of [Amount] within the next 24 business hours, you are officially authorized to deduct a 15% discount. 

Please adjust the remittance and send us the updated proof of payment!`
            }
          ];

          const parseTemplateBody = (bodyText: string) => {
            return bodyText
              .replace(/\[Name\]/g, debtor.name)
              .replace(/\[Amount\]/g, `${debtor.currency}${debtor.amount.toLocaleString()}`)
              .replace(/\[Date\]/g, debtor.paymentDueDate || new Date().toISOString().split('T')[0])
              .replace(/\[MyBusiness\]/g, debtor.merchantBusinessName || 'Representative');
          };

          const handleApplyTemplate = (tpl: typeof messageBankTemplates[0]) => {
            const subjectParsed = tpl.subject
              .replace(/\[Name\]/g, debtor.name)
              .replace(/\[Amount\]/g, `${debtor.currency}${debtor.amount.toLocaleString()}`)
              .replace(/\[MyBusiness\]/g, debtor.merchantBusinessName || 'Representative');
            setCustomSubject(subjectParsed);
            setCustomBody(parseTemplateBody(tpl.body));
          };

          return (
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
              
              {/* Left Column: 20-Variation Message Bank Index */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col max-h-120 md:max-h-full">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-[#FAFAFA] text-indigo-750 border border-indigo-200/50 px-2.5 py-1 rounded">
                    🏦 TEMPLATE BANK ({messageBankTemplates.length} DIVIDED VARIATIONS)
                  </span>
                  <h3 className="font-sans font-black text-[#0F172A] text-sm mt-3 uppercase tracking-tight">Divergent Outreach Bank</h3>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Choose one of the specialized dunning variations to load directly into the editor for customized outreach triggers.
                  </p>
                </div>

                {/* Categories Grid list */}
                <div className="grid grid-cols-2 gap-2 text-[9px] uppercase font-bold text-slate-500">
                  {['Warm Regional', 'B2B Tech', 'High Escalation', 'Barter & Instalment'].map(cat => (
                    <div 
                      key={cat}
                      className="p-1 px-2 border bg-white rounded border-slate-150 text-[8.5px] truncate text-center font-mono"
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {/* Templates Scrollable viewport */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {messageBankTemplates.map((tpl) => (
                    <div 
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="p-3 bg-white border border-slate-200 rounded-sm hover:border-slate-400 cursor-pointer transition flex flex-col justify-between hover:shadow-2xs text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-extrabold text-[#0D1527] text-[10.5px] font-sans pr-1 truncate">{tpl.title}</h5>
                          <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-black shrink-0 uppercase">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[9.2px] text-slate-400 font-mono truncate">Sub: {tpl.subject.replace(/\[Amount\]/g, `${debtor.currency}${debtor.amount.toLocaleString()}`)}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 italic pr-2">"{parseTemplateBody(tpl.body).substring(0, 90)}..."</p>
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-right text-[9px] font-mono text-indigo-650 font-black hover:text-indigo-800 focus:outline-none block uppercase"
                      >
                        ⚡ Apply Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Cognitive Oracle & Tactical Editor Dispatch */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
                
                {/* Cognitive Feedback Panel */}
                <div className="space-y-3">
                  <div className="border border-indigo-150 bg-indigo-50/20 rounded p-4 text-left space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-mono tracking-widest font-extrabold text-indigo-850 uppercase">
                          Cognitive Intelligence metrics
                        </span>
                      </div>
                      <span className={`text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        debtor.remindersCount >= 4 ? 'bg-red-50 text-red-700 border border-red-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                      }`}>
                        {debtor.remindersCount >= 4 ? 'Status: Relentless Delay' : 'Status: Overdue Procrastinator'}
                      </span>
                    </div>

                    {cognitiveLoading ? (
                      <div className="space-y-4 py-3 select-none text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-[9.5px] font-mono font-black text-indigo-750 uppercase tracking-widest">Oracle consulting Gemini module...</p>
                          <p className="text-[8.5px] text-slate-400">Brewing culture-reflective pidgin tone and calculating risk indices...</p>
                        </div>
                      </div>
                    ) : cognitiveData ? (
                      <div className="space-y-2.5 text-[11px] leading-relaxed font-sans text-slate-700">
                        <div>
                          <p className="text-[8.5px] font-mono uppercase font-black text-slate-400">Behavioral Diagnostic:</p>
                          <p className="font-semibold text-slate-850">{cognitiveData.behaviorAnalysis}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <p className="text-[8.5px] font-mono uppercase font-black text-slate-400">Collection Risk:</p>
                            <span className={`text-[10px] font-extrabold uppercase ${
                              cognitiveData.riskLevel === 'CRITICAL' || cognitiveData.riskLevel === 'HIGH' ? 'text-red-650' : 'text-emerald-700'
                            }`}>{cognitiveData.riskLevel}</span>
                          </div>
                          <div>
                            <p className="text-[8.5px] font-mono uppercase font-black text-slate-400">Escalation path:</p>
                            <p className="font-bold text-[#0F172A]">{cognitiveData.suggestedEscalationOption}</p>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200/50">
                          <p className="text-[8.5px] font-mono uppercase font-black text-indigo-500">Strategy Matrix leverage:</p>
                          <p className="italic text-slate-600">"{cognitiveData.recommendedStrategy}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-1 font-sans text-left">
                        <p className="text-[10.5px] text-slate-500 leading-normal">
                          Let our cognitive dialect engine analyze the debtor logs, evaluate behavioral patterns, and draft a tailored messaging strategy.
                        </p>
                        <button
                          type="button"
                          onClick={handleTriggerCognitiveAnalysis}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ✨ Run Cognitive AI Synthesis
                        </button>
                      </div>
                    )}
                  </div>

                  {cognitiveError && (
                    <div className="p-3 bg-red-50 border border-red-150 text-red-900 rounded text-xs leading-normal">
                      ⚠️ <strong>Oracle Alert:</strong> {cognitiveError}
                    </div>
                  )}

                  {/* CUSTOM TACTICAL EMAIL EDITOR PANEL */}
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-[9px] font-mono font-black uppercase text-slate-400 block tracking-wider mb-1">Outreach Subject Line</label>
                      <input 
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Subject line..."
                        className="w-full text-xs font-semibold px-3 py-2 border rounded border-slate-205 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono font-black uppercase text-slate-400 block tracking-wider mb-1">Tactical Message Compiler Area</label>
                      <textarea
                        rows={6}
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        placeholder="Select any Template Bank card or trigger AI Cognitive Synthesis above to pre-fill compiler area and edit..."
                        className="w-full text-xs p-3 font-sans border rounded border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 leading-relaxed font-sans bg-white whitespace-pre-wrap max-h-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Dispatch Button controls wrapper */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[8px] font-mono font-black uppercase text-slate-400 tracking-wider block mb-1">Target test Email recipient</label>
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Recipient test email..."
                        className="w-full text-[11px] font-mono px-2.5 py-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <div className="shrink-0 self-end">
                      <button
                        type="button"
                        onClick={handleDispatchCustomEmail}
                        disabled={sendingCustom || !customBody}
                        className="py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 select-none h-[34px] active:scale-98"
                      >
                        {sendingCustom ? (
                          <Loader2 className="w-3 animate-spin text-white" />
                        ) : '📧 DISPATCH AI COGNITIVE OUTREACH'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {false && (
          /* SMART AI ADVISOR VIEW */
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Left Column: Transaction Dossier Details */}
            <div className="flex-1 p-6 space-y-5 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Unpaid Dossier File
                  </span>
                  <h3 className="font-sans font-black text-slate-950 text-base mt-2.5 uppercase tracking-tight">{debtor.name}</h3>
                  <p className="text-xs text-slate-500 font-mono italic">{debtor.email} • {debtor.phone}</p>
                </div>

                <div className="p-4 bg-[#FAFAFA] rounded border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-800">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    {debtor.isFreelancer ? (
                      <User className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-slate-600" />
                    )}
                    <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                      {debtor.isFreelancer ? 'Freelancer Sender Details' : 'Trade Business Sender Details'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Brand Name</span>
                      <strong className="text-slate-900">{debtor.merchantBusinessName || 'My Freelance store'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Location</span>
                      <strong className="text-slate-900">{debtor.merchantLocation || 'Lagos, Nigeria'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Culture/Ethnicity</span>
                      <strong className="text-slate-900">{debtor.merchantEthnicity || 'Yoruba'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Goods sold</span>
                      <strong className="text-slate-900 truncate block max-w-[140px]">{debtor.merchantWhatTheySell || 'Core consultancy'}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-left">
                    <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider font-mono">Invoice sum</span>
                    <span className="font-sans font-black text-sm text-slate-900">{debtor.currency}{debtor.amount.toLocaleString()}</span>
                    {debtor.receiptName && (
                      <span className="text-[9px] text-slate-500 block truncate mt-0.5">📎 {debtor.receiptName}</span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-left">
                    <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider font-mono">Original Due Date</span>
                    <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {debtor.paymentDueDate || 'Awaiting'}
                    </span>
                  </div>
                </div>

                {/* Mark as paid shortcut */}
                <div className="flex items-center justify-between text-xs font-semibold bg-slate-50 border border-slate-200 p-3 rounded">
                  <span className="text-slate-600">Reconcile cleared funds:</span>
                  {debtor.status === 'PAID' ? (
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-255 font-bold uppercase tracking-widest py-0.5 px-2 rounded">
                        ✓ Paid
                      </span>
                      <span className="text-[7px] text-emerald-600 font-sans font-black mt-1 uppercase tracking-wide">
                        Commission Deducted • Payout Sent
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid(debtor.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] uppercase tracking-wider font-extrabold transition cursor-pointer"
                    >
                      Acknowledge Payment
                    </button>
                  )}
                </div>

                {/* 🛡️ INTERACTIVE DATA INTEGRITY & OCR VERIFICATION SECTION */}
                <div className="border border-slate-200 rounded p-3.5 space-y-3 bg-[#FAFAFA] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">OCR Transaction Verification</span>
                    {debtor.receiptName ? (
                      <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-widest font-black text-emerald-800 bg-emerald-50 border border-emerald-200 py-0.5 px-1.5 rounded">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-widest font-black text-amber-800 bg-amber-50 border border-amber-250 py-0.5 px-1.5 rounded animate-pulse">
                        <ShieldAlert className="w-2.5 h-2.5" /> Pending Verify
                      </span>
                    )}
                  </div>

                  {debtor.receiptName ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-700 font-medium">
                        Our server-side OCR engine completed transaction audit. Detected legitimate commercial parameters:
                      </p>
                      <div className="text-[10px] bg-white p-2 rounded border border-slate-150 text-slate-500 font-mono tracking-tight leading-normal">
                        {debtor.verificationOcrLog || `OCR RESULT: Found authentic matches in '${debtor.receiptName}'. Creditor: '${debtor.merchantBusinessName || 'Vendor'}'. Debtor: '${debtor.name}'. Unpaid value: ${debtor.currency}${debtor.amount.toLocaleString()}. Verified authentic relationship.`}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[11px] text-slate-650">
                      <p className="font-semibold text-slate-900 leading-normal flex items-center gap-1">
                        ⚠️ Data Integrity Restriction Active
                      </p>
                      <p className="leading-snug">
                        Before a merchant can trigger an automated campaign, they must complete a basic verification step by uploading proof of transaction (e.g. Waybill, WhatsApp consignment receipt, signed gig contract).
                      </p>
                      <p className="text-[10px] text-red-700 font-bold bg-red-50/50 p-1.5 rounded border border-red-100">
                        Smart notification dispatch is deactivated for this record until proof is uploaded to prevent spam.
                      </p>
                    </div>
                  )}
                </div>

                {/* ⛔ IMMEDIATE DEBTOR DISPUTE CONTROL AND FRAUD SIMULATORS */}
                <div className="border border-slate-200 rounded p-3.5 space-y-3 bg-white text-xs">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">Debtor Dispute Options</span>
                  
                  {debtor.isDisputed ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2.5">
                      <div className="flex items-center gap-1 text-amber-900">
                        <AlertOctagon className="w-4 h-4 shrink-0 text-amber-700" />
                        <span className="font-sans font-black uppercase text-[10px] tracking-wider text-amber-900">
                          Active Dispute Filed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                        First notifications sent to debtors allow immediate dispute filing. Active dispute placed on this debt profile has paused automated reminders to prevent abuse.
                      </p>
                      <div className="bg-white/70 p-2 rounded border border-amber-150 text-[10.5px] italic text-slate-600 font-mono">
                        " {debtor.disputeReason} "
                      </div>

                      <button
                        type="button"
                        onClick={() => onResolveDispute(debtor.id)}
                        className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-extrabold uppercase tracking-wide transition cursor-pointer border border-amber-800"
                      >
                        Resolve Dispute & Resume Outreach
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 leading-normal">
                        To protect the public, debtors can file disputes instantly through their paylinks. Test the client dispute pathway here:
                      </p>

                      {showDisputeForm ? (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <label className="block text-[10px] uppercase font-bold text-slate-600 font-mono">Dispute Reason Statement</label>
                          <textarea
                            value={disputeReasonInput}
                            onChange={(e) => setDisputeReasonInput(e.target.value)}
                            placeholder="e.g., I already settled ₦25,000 via cash last Tuesday, waiting for receipt update..."
                            className="w-full text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!disputeReasonInput.trim()) return;
                                onFileDispute(debtor.id, disputeReasonInput.trim());
                                setDisputeReasonInput('');
                                setShowDisputeForm(false);
                              }}
                              className="flex-1 py-1 bg-slate-950 hover:bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider rounded transition shrink-0 cursor-pointer"
                            >
                              File Dispute
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDisputeForm(false)}
                              className="px-2.5 py-1 text-slate-500 border border-slate-200 text-[10px] uppercase font-bold rounded transition shrink-0 cursor-pointer hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDisputeForm(true)}
                          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-250 rounded text-[9px] uppercase tracking-wider font-extrabold transition cursor-pointer"
                        >
                          ⚡ Simulate Debtor Raising Dispute
                        </button>
                      )}
                    </div>
                  )}

                  {/* Account Blacklist Abuse Simulator Button */}
                  <div className="pt-2 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Simulate fraud protection action? This will block your merchant dashboard, illustrating the anti-spam safeguard.")) {
                          onTriggerBlacklist();
                          onClose();
                        }
                      }}
                      className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[9px] uppercase tracking-wider font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      🚨 Trigger Fake Input Blacklist Simulation
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 shrink-0">
                <p className="text-[10px] text-slate-400 leading-normal font-medium text-center">
                  Standard automated campaign currently active. Last communication dispatch: {debtor.lastRemindedAt ? formatTimestamp(debtor.lastRemindedAt) : 'Never'}
                </p>
                <button 
                  type="button"
                  onClick={() => setShowLedgerPreview(true)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-widest rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mb-1.5 active:scale-98"
                >
                  📝 Export Enforcement Ledger PDF
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] uppercase font-bold tracking-widest rounded-sm transition cursor-pointer"
                >
                  Close Dossier folder
                </button>
              </div>
            </div>

            {/* Right Column: SMART AI DIAGNOSTICS SCREEN */}
            <div className="flex-1 bg-slate-950 p-6 text-slate-100 flex flex-col justify-between overflow-y-auto space-y-5">
              
              {loadingAnalysis ? (
                /* Shimmer loading */
                <div className="flex-1 flex flex-col justify-center items-center space-y-3 py-12 text-center text-slate-400 text-xs font-bold font-mono">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  <p className="uppercase tracking-widest animate-pulse">Running AI Trade Partner Modeling diagnostics...</p>
                </div>
              ) : (
                /* Gemini Diagnostics Body */
                <div className="space-y-4 flex-1">
                  
                  {/* Risk & Behavior diagnostics */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="font-sans font-black text-white text-xs uppercase tracking-wider">AI DIAGNOSTIC CONSOLE</h4>
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">Powered by Gemini 3.5 Flash modeling</p>
                    </div>

                    <div className={`px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-wider ${getRiskBadgeColor(currentAnalysis.riskLevel)}`}>
                      ⚠ Collection Risk: {currentAnalysis.riskLevel}
                    </div>
                  </div>

                  {/* HIGH-FIDELITY DEBTOR TRUST SCORE HERO DISPLAY */}
                  <div className="bg-slate-900 border border-slate-800 rounded p-4.5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎯</span>
                        <div>
                          <span className="text-[9.5px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Debtor Trust Score</span>
                          <span className="text-[8px] bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded text-indigo-300 font-mono font-bold uppercase">BUREAU FRAMEWORK</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase tracking-wider font-mono font-black text-slate-400">Rating Tier</span>
                        <div className={`text-sm font-black font-mono leading-none ${
                          activeDebtorResult.score_color_code === 'Green' || activeDebtorResult.score_color_code === 'Emerald'
                            ? 'text-emerald-400'
                            : activeDebtorResult.score_color_code === 'Amber'
                            ? 'text-amber-400'
                            : activeDebtorResult.score_color_code === 'Orange'
                            ? 'text-orange-400'
                            : 'text-red-400'
                        }`}>
                          {activeDebtorResult.rating_tier}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      {/* Big Score text */}
                      <div className="shrink-0 flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-lg min-w-[76px]">
                        <span className="text-3xl font-black font-mono tracking-tight leading-none text-white">
                          {activeDebtorResult.trust_score}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold mt-1">300-850 LIMIT</span>
                      </div>

                      {/* Custom Progress bar ledger */}
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden relative border border-slate-800">
                          {/* Colored dynamic progress width mapping [300, 850] range to percentage */}
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              activeDebtorResult.score_color_code === 'Green' || activeDebtorResult.score_color_code === 'Emerald'
                                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                                : activeDebtorResult.score_color_code === 'Amber'
                                ? 'bg-amber-400'
                                : activeDebtorResult.score_color_code === 'Orange'
                                ? 'bg-orange-400'
                                : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                            }`}
                            style={{ width: `${Math.max(5, Math.min(100, ((activeDebtorResult.trust_score - 300) / 550) * 100))}%` }}
                          />
                        </div>

                        {/* Dial ranges labels */}
                        <div className="flex justify-between font-mono text-[8px] text-slate-500 font-bold uppercase">
                          <span>300 (CRITICAL)</span>
                          <span>600 (BASE)</span>
                          <span>850 (EXCELLENT)</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Point factors ledger */}
                    <div className="border-t border-slate-800 pt-3 space-y-1.5">
                      <span className="text-[8.5px] text-slate-400 uppercase tracking-widest font-mono font-bold block">algorithmic points ledger</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono select-none">
                        <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-850 rounded">
                          <span className="text-slate-400">⏳ Settlement:</span>
                          <span className={`font-bold ${activeDebtorResult.trust_score >= 600 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {getDynamicDebtorTrustInput().timeToSettlement === '1-3' ? '+50 (Rapid)' : 
                             getDynamicDebtorTrustInput().timeToSettlement === '4-7' ? '+20 (Active)' : 
                             getDynamicDebtorTrustInput().timeToSettlement === '8-14' ? '-40 (Delayed)' : 
                             getDynamicDebtorTrustInput().timeToSettlement === '14+' ? '-100 (Unresponsive)' : '-50 (Unpaid)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-850 rounded">
                          <span className="text-slate-400">🛡️ Escalation depth:</span>
                          <span className="text-slate-300 font-bold">
                            {getDynamicDebtorTrustInput().escalationDepth === 'sms-web' ? '+40 (SMS)' : 
                             getDynamicDebtorTrustInput().escalationDepth === 'email' ? '-10 (Email)' : 
                             getDynamicDebtorTrustInput().escalationDepth === 'robocall' ? '-80 (Voice Loop)' : 'Drop 300 (Invalid)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-850 rounded">
                          <span className="text-slate-400">🔄 Recidivism logs:</span>
                          <span className="text-slate-305 text-slate-300 font-bold">
                            {getDynamicDebtorTrustInput().frequencyRecidivism === 'first-time' ? '0 (New Account)' : 
                             getDynamicDebtorTrustInput().frequencyRecidivism === 'multi-clean' ? '+30 (Multi-Clean)' : '-120 (Abuser)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-850 rounded">
                          <span className="text-slate-400">🤝 Integrity Link:</span>
                          <span className="text-slate-300 font-bold">
                            {getDynamicDebtorTrustInput().transactionIntegrity === 'clicked-confirm' ? '+35 (Acknowledged)' : 
                             getDynamicDebtorTrustInput().transactionIntegrity === 'disputed' ? '0 (Dispute Hold)' : '0 (No Feedback)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Togglable Code/JSON payload view */}
                    <div className="space-y-1.5 pt-1">
                      <button 
                        type="button"
                        onClick={() => setShowScoringJson(!showScoringJson)}
                        className="text-[9px] text-[#38bdf8] font-bold font-mono tracking-widest uppercase hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
                      >
                        {showScoringJson ? '[-]' : '[+]'} VIEW DEBTOR BUREAU TRUST JSON DATA PAYLOAD
                      </button>

                      {showScoringJson && (
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 whitespace-pre overflow-x-auto leading-relaxed select-all">
{JSON.stringify({
  debtor_phone: activeDebtorResult.debtor_phone,
  trust_score: activeDebtorResult.trust_score,
  rating_tier: activeDebtorResult.rating_tier,
  score_color_code: activeDebtorResult.score_color_code,
  behavioral_summary: activeDebtorResult.behavioral_summary,
  recommended_chaser_package: activeDebtorResult.recommended_chaser_package
}, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Behavior Diagnosis block */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono block">Behavior Diagnosis</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                      {currentAnalysis.behaviorAnalysis}
                    </p>
                  </div>

                  {/* Culturally optimized Strategy */}
                  <div className="space-y-1 border-t border-slate-900 pt-3.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono block">Relational Cultural Strategy</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {currentAnalysis.recommendedStrategy}
                    </p>
                  </div>

                  {/* Escalation suggest warning if reminders exhausted */}
                  <div className="bg-white/5 border border-white/10 rounded p-3 text-xs leading-relaxed text-slate-400 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-yellow-400 flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Real-Time Smart Escalation Option
                    </span>
                    <p className="text-[11px]">
                      {currentAnalysis.suggestedEscalationOption}
                    </p>
                  </div>

                  {/* Tailored template output */}
                  <div className="space-y-2 border-t border-slate-900 pt-3.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono block">Customized Copy-Paste Outreach Draft</span>
                    <div className="bg-slate-900 border border-slate-850 rounded p-3 text-slate-200 italic text-[11.5px] leading-relaxed relative">
                      {currentAnalysis.nextBestActionMessage}
                      
                      <div className="absolute right-2.5 bottom-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentAnalysis.nextBestActionMessage)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 rounded transition flex items-center gap-1 text-[8px] uppercase tracking-widest font-black cursor-pointer"
                          title="Copy text directly"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" /> Copy Draft
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              <p className="text-[8px] text-slate-500 text-center uppercase tracking-widest font-mono">
                Respect-based relationship protection • Floate AI Middleman Services
              </p>
            </div>

          </div>
        )}

        {/* TRUST_SCORE VIEW: DEBTOR TRUST MODEL CALCULATOR */}
        {false && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50">
            {/* Left Column: Verified Ledger Parameters */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded">
                  BUREAU REPORT SECURE PROFILE
                </span>
                <h3 className="font-sans font-black text-slate-900 text-base mt-2.5 uppercase tracking-tight">Verified Risk Attributes</h3>
                <p className="text-xs text-slate-550 leading-relaxed mt-1">
                  These verified attributes are read-only and fetched securely from FLOATE Bureau ledgers based on debtor communication history.
                </p>
              </div>

              <div className="space-y-5 font-sans">
                {/* 1. Time-to-Settlement */}
                <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Time-to-Settlement (Payment Speed)</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase">
                      {timeToSettlement === '1-3' && '⚡ 1-3 Days (Outstanding performance)'}
                      {timeToSettlement === '4-7' && '✓ 4-7 Days (Good settlement speed)'}
                      {timeToSettlement === '8-14' && '⏰ 8-14 Days (Delayed settlement pattern)'}
                      {timeToSettlement === '14+' && '🚨 14+ Days (Chronically overdue)'}
                      {timeToSettlement === 'not-paid' && '❌ Unpaid / Active default'}
                    </span>
                    <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      timeToSettlement === '1-3' || timeToSettlement === '4-7' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {timeToSettlement === '1-3' && '+50 pts'}
                      {timeToSettlement === '4-7' && '+20 pts'}
                      {timeToSettlement === '8-14' && '-40 pts'}
                      {timeToSettlement === '14+' && '-100 pts'}
                      {timeToSettlement === 'not-paid' && '-50 pts'}
                    </span>
                  </div>
                </div>

                {/* 2. Escalation depth */}
                <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Highest Escalation Channel Required</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase">
                      {escalationDepth === 'sms-web' && '💬 Web Link / SMS Outreach'}
                      {escalationDepth === 'email' && '✉ Formal Email Notice'}
                      {escalationDepth === 'robocall' && '🎙 Pidgin Robocall Loop'}
                      {escalationDepth === 'disconnected' && '🛑 Number Blocked / Invalid'}
                    </span>
                    <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      escalationDepth === 'sms-web' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {escalationDepth === 'sms-web' && '+40 pts'}
                      {escalationDepth === 'email' && '-10 pts'}
                      {escalationDepth === 'robocall' && '-80 pts'}
                      {escalationDepth === 'disconnected' && 'Critical Flag'}
                    </span>
                  </div>
                </div>

                {/* 3. Frequency & Volume Recidivism */}
                <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Offense Recidivism Frequency</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase">
                      {timesLogged === 1 ? 'First-Time Offense Logged' : 'Multiple Defaults Registered'}
                    </span>
                    <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      timesLogged === 1 ? 'bg-slate-50 text-slate-600' : 'bg-red-50 text-red-650'
                    }`}>
                      {timesLogged === 1 ? 'Baseline' : '-120 pts'}
                    </span>
                  </div>
                </div>

                {/* 4. Transaction Integrity */}
                <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Handshake Integrity Status</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase">
                      {disputeStatus === 'clicked-confirm' && 'Verified Handshake Completed'}
                      {disputeStatus === 'disputed' && 'Active Dispute Claim Filed'}
                      {disputeStatus === 'none' && 'No Confirmed Acknowledgment'}
                    </span>
                    <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      disputeStatus === 'clicked-confirm' ? 'bg-emerald-50 text-emerald-600' : disputeStatus === 'disputed' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {disputeStatus === 'clicked-confirm' && '+35 pts'}
                      {disputeStatus === 'disputed' && '0 pts'}
                      {disputeStatus === 'none' && '0 pts'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100/85 border border-slate-200 rounded p-4 text-[11px] leading-relaxed text-slate-550 select-none text-left">
                <p className="font-bold text-slate-700">FLOATE Bureau scoring security protocol:</p>
                To prevent manual tampering or client-side manipulation, scoring parameters are calculated completely on safe backend engines and cached live.
              </div>
            </div>

            {/* Right Column: High contrast dashboard and raw JSON */}
            <div className="flex-1 bg-slate-950 p-6 text-slate-100 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-white/10 select-none">
                  <div>
                    <h4 className="font-sans font-black text-white text-xs uppercase tracking-wider">Scoring Scenario Console</h4>
                    <span className="text-[8.5px] text-indigo-400 font-mono uppercase tracking-widest leading-none">Bureau Standard Engine</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                    scoreVal >= 750 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                    scoreVal >= 680 ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/20' :
                    scoreVal >= 600 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {details.tier} Tier
                  </span>
                </div>

                {/* Score Gauge Circular visualization */}
                <div className="flex justify-center items-center py-2 flex-col">
                  <div className="relative flex items-center justify-center w-36 h-36 select-none">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className={`transition-all duration-700 ease-out`}
                        style={{
                          stroke: details.text === 'bg-emerald-550' || details.text === 'text-emerald-500' ? '#10b981' : details.text === 'text-emerald-400' ? '#34d399' : details.text === 'text-amber-500' ? '#f59e0b' : details.text === 'text-orange-500' ? '#f97316' : '#ef4444',
                          strokeWidth: '10px'
                        }}
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - (scoreVal - 300) / (850 - 300))}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black font-mono tracking-tight text-white leading-none">{scoreVal}</span>
                      <span className="text-[8px] uppercase tracking-widest font-mono font-black text-slate-500 mt-1.5 leading-none">Bureau Rating</span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-3 space-y-1">
                    <span className="text-xs font-bold leading-none text-slate-205 text-slate-200">Phone Identifier Checked: {debtor.phone}</span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">FICO Framework 300-850 Scale</p>
                  </div>
                </div>

                {/* Behavioral Summary box */}
                <div className="bg-white/5 border border-white/10 rounded p-4 text-xs space-y-2 leading-relaxed text-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Behavioral Summary Insight</span>
                  <p className="font-semibold text-slate-100">{details.insight}</p>
                </div>

                {/* Recommended escalation ladder */}
                <div className="border border-indigo-500/30 bg-indigo-500/5 p-3 rounded text-[11px] leading-relaxed text-indigo-200">
                  <span className="text-[8px] font-mono font-bold text-indigo-305 uppercase tracking-widest block mb-0.5">Recommended Chaser Solution</span>
                  <p className="font-extrabold">{recommendedChaserPackage()}</p>
                </div>

                {/* Copyable JSON Payload section */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[8.5px] uppercase tracking-widest font-mono font-bold text-slate-450 text-slate-400">Strict JSON Output representation</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(jsonPayloadString);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded text-[8px] font-bold uppercase font-mono tracking-widest transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      {copied ? 'Copied' : 'Copy Score JSON'}
                    </button>
                  </div>
                  <pre className="text-[9px] font-mono leading-relaxed bg-slate-900/80 p-3.5 rounded border border-white/10 text-emerald-400 overflow-x-auto max-h-[160px] cursor-text">
                    {jsonPayloadString}
                  </pre>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold uppercase tracking-widest rounded-sm text-[10px] transition mt-4"
              >
                Close Scorer Tab
              </button>
            </div>
          </div>
        )}

        {/* CLASSIC DELIVERY LOG TIMELINE VIEW */}
        {activeTab === 'RECORDS' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Left Side Timeline listing */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-slate-100 text-slate-650 px-2.5 py-1 rounded">
                    History File Logs
                  </span>
                  <h3 className="font-sans font-black text-slate-950 text-base mt-2.5 uppercase tracking-tight">{debtor.name}</h3>
                </div>

                {/* Timeline display */}
                <div className="space-y-4 pt-2">
                  <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono">Dispatched followups</p>
                  
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4 max-h-64 overflow-y-auto">
                    {debtor.history.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className={`relative cursor-pointer group rounded p-2.5 border transition text-left ${
                          selectedLog?.id === log.id 
                            ? 'bg-[#FAFAFA] border-slate-400' 
                            : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                        }`}
                      >
                        {/* Circle timeline dot */}
                        <div className="absolute -left-[23px] top-4.5 bg-white border-2 border-slate-300 rounded-full w-3.5 h-3.5 flex items-center justify-center group-hover:border-slate-950 transition" />
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs uppercase tracking-wide">
                            {getLogIcon(log.type)}
                            <span>{log.type.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(log.timestamp)}</span>
                        </div>

                        <p className="text-slate-650 text-xs mt-1 truncate max-w-[280px]">
                          {log.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 💬 DEBTOR INBOUND REPLY INTELLIGENCE & AI BACKEND CLASSIFIER */}
                <div className="border border-indigo-100 bg-indigo-50/20 rounded p-4 space-y-3 border-indigo-200 mt-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-805 text-indigo-700">
                      💬 Inbound Reply AI Classifier (Backend)
                    </span>
                    <span className="text-[7.5px] font-mono font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                      Model Powered
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                    Type a custom incoming message from the debtor or click one of the quick dialect presets below to observe prompt classification.
                  </p>

                  {/* Dialect preset answer quick select list */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Quick-Seed Preset Dialect Answers:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-0.5">
                      {[
                        { 
                          label: "🤝 Promise (Pidgin)", 
                          text: "I go clear this outstanding next week Thursday pure as gold, please hold tight."
                        },
                        { 
                          label: "🤷 Dispute (Slang/Linger)", 
                          text: "No be me buy this thing o. I don pay cash since Tuesday, check records."
                        },
                        { 
                          label: "⏰ Extension (Pidgin English)", 
                          text: "Oga, abeg wait small for me. Money never land, business down well well."
                        },
                        { 
                          label: "📈 Installment Proposal", 
                          text: "Can I pay 10,000 Naira every Friday for 4 weeks instead of all now?"
                        },
                        { 
                          label: "📦 Goods barter (Settle)", 
                          text: "Cash no dey but I get brand new Infinix Hot phone make we exchange for the balance?"
                        },
                        { 
                          label: "📉 Downturn (African Dialect)", 
                          text: "Sales slow too much, they lock my store today. Once dry season ends, I pay."
                        }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyInput(preset.text)}
                          className="p-1 px-1.5 text-[8.5px] text-left bg-white border border-slate-255 border-slate-200 rounded text-slate-700 hover:bg-slate-150 transition whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer block w-full text-left font-sans text-slate-700"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Inbound Response Reply</label>
                      <button
                        type="button"
                        onClick={() => setReplyInput('')}
                        className="text-[8px] text-indigo-650 hover:text-indigo-805 hover:text-indigo-800 uppercase tracking-wider font-bold cursor-pointer"
                      >
                        Clear Field
                      </button>
                    </div>
                    <textarea
                      value={replyInput}
                      onChange={(e) => {
                        setReplyInput(e.target.value);
                        if (replyError) setReplyError('');
                      }}
                      placeholder="e.g., I go pay next week wallahi, abeg wait for me..."
                      className="w-full text-xs p-2 border border-slate-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white leading-relaxed font-sans placeholder-slate-400 text-slate-800"
                      rows={2}
                    />
                    {replyError && (
                      <p className="text-[9px] text-red-600 font-mono font-semibold">{replyError}</p>
                    )}
                  </div>

                  {/* Process Action Trigger */}
                  <div>
                    <button
                      type="button"
                      disabled={analyzingReply || !replyInput.trim()}
                      onClick={handleClassifyDebtorReply}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-[9px] uppercase tracking-wider font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {analyzingReply ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white mr-1.5" />
                          Classifying Debtor Response on Backend...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          Simulate & Classify (Secure Backend AI)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Classification Result Card Layout */}
                  {analysisResult && (
                    <div className="bg-white p-3 rounded border border-indigo-200 space-y-2.5 shadow-xs animate-fade-in text-left">
                      
                      {/* Classification Badge row */}
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <div>
                          <span className="text-[7.5px] text-slate-450 uppercase tracking-widest font-mono block font-bold">Classified Category Category</span>
                          <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-black py-0.5 px-2 rounded border mt-0.5 ${
                            analysisResult.category.toLowerCase().includes('promise') ? 'bg-emerald-50 text-emerald-850 border-emerald-250' :
                            analysisResult.category.toLowerCase().includes('dispute') ? 'bg-red-50 text-red-850 border-red-250' :
                            analysisResult.category.toLowerCase().includes('time') ? 'bg-indigo-50 text-indigo-850 border-indigo-250' :
                            analysisResult.category.toLowerCase().includes('installment') ? 'bg-cyan-50 text-cyan-850 border-cyan-200' :
                            analysisResult.category.toLowerCase().includes('exchange') ? 'bg-purple-50 text-purple-850 border-purple-250' :
                            'bg-amber-50 text-amber-850 border-amber-250'
                          }`}>
                            🎯 {analysisResult.category}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[7.5px] text-slate-450 uppercase tracking-widest font-mono block font-bold font-sans text-xs">Accuracy Assurance</span>
                          <span className="text-[9px] font-mono font-black text-indigo-700 uppercase block">
                            {analysisResult.confidenceScore} Verify
                          </span>
                        </div>
                      </div>

                      {/* Linguistic translation & info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] font-sans">
                        <div className="bg-indigo-50/10 p-2 rounded border border-indigo-100/40">
                          <span className="text-[7.5px] uppercase tracking-wider font-mono text-slate-400 block font-semibold">Language Detected</span>
                          <span className="text-slate-800 mt-0.5 block font-bold">{analysisResult.languageDetected}</span>
                        </div>
                        <div className="bg-indigo-50/10 p-2 rounded border border-indigo-100/40">
                          <span className="text-[7.5px] uppercase tracking-wider font-mono text-slate-400 block font-semibold">Dialect Nuance Analysis</span>
                          <span className="text-slate-700 mt-0.5 block italic leading-snug text-[9px]">{analysisResult.dialectAnalysis}</span>
                        </div>
                      </div>

                      {/* Decided Automated action */}
                      <div className="p-2 bg-[#FAFAFA] border border-slate-200 rounded text-[9px] font-sans">
                        <span className="text-[7px] uppercase tracking-wider font-mono text-slate-400 block font-semibold">Smart Automated System Route</span>
                        <p className="text-indigo-700 font-extrabold mt-0.5">{analysisResult.suggestedPlatformAction}</p>
                      </div>

                      {/* Tailored system reply draft copy */}
                      <div className="p-2 bg-indigo-50/30 border border-indigo-150 rounded text-[9.5px] font-sans relative">
                        <span className="text-[7px] uppercase tracking-wider font-mono text-indigo-600 block font-semibold">Relationship-Preserving Outbound Draft</span>
                        <p className="text-slate-755 italic mt-0.5 leading-snug">"{analysisResult.politeSmsDraftReply}"</p>
                      </div>

                      {/* Commit to ledger button */}
                      <button
                        type="button"
                        onClick={handleSaveAnalysedReplyToLogs}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8.5px] uppercase tracking-widest font-black transition cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm font-sans"
                      >
                        ✍ Record response into Timeline Ledger logs
                      </button>

                    </div>
                  )}
                </div>
              </div>

              {/* 8-Touchpoint Outreach Campaign Control Center */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3.5 shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <Mail className="w-3.5 h-3.5 text-slate-800" />
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-900 font-sans">
                    📬 Outreach Campaign Control — 8-Touchpoint Cadence
                  </h4>
                </div>

                {/* Email input field so the user can testing overriding or inputting their own test email */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">
                    Recipient Email Address (Direct testing sync override)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter recipient email address..."
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-mono text-slate-900"
                  />
                  <p className="text-[8px] text-slate-400 leading-normal">
                    Insert your own email address here during beta testing to verify prompt delivery to your personal inbox instantly!
                  </p>
                </div>

                {/* 8 touchpoint selector buttons grid */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">
                      Choose Campaign Touchpoint
                    </label>
                    <span className="text-[8.5px] font-mono text-slate-400 font-bold">WEEKS 1-4 CADENCE</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                      const isActive = selectedStageNum === num;
                      let label = "";
                      if (num === 1) label = "Nudge";
                      else if (num === 2) label = "Bump 1";
                      else if (num === 3) label = "Formal";
                      else if (num === 4) label = "Bump 2";
                      else if (num === 5) label = "Warn";
                      else if (num === 6) label = "Bump 3";
                      else if (num === 7) label = "Default";
                      else label = "Wrap-Up";

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedStageNum(num)}
                          className={`py-1.5 px-0.5 text-center rounded border transition text-[9px] font-bold flex flex-col items-center justify-center cursor-pointer ${
                            isActive
                              ? "bg-slate-950 text-white border-slate-950 font-black"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-xs font-mono font-bold">{num}</span>
                          <span className="text-[7.5px] uppercase tracking-tighter opacity-80 mt-0.5">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stage description preview helper */}
                <div className="p-2.5 bg-white border border-slate-150 rounded text-[9px] text-slate-650 leading-relaxed font-sans space-y-1">
                  {selectedStageNum === 1 && (
                    <>
                      <strong className="text-emerald-700 uppercase block tracking-wider font-bold text-[8px]">🎯 Touch 1 — Soft Nudge (Primary, Day 1)</strong>
                      <p>Polite statement of accounts with secure clearance link. Assumes simple omission.</p>
                    </>
                  )}
                  {selectedStageNum === 2 && (
                    <>
                      <strong className="text-emerald-600 uppercase block tracking-wider font-bold text-[8px]">💬 Touch 2 — Soft Nudge (Micro-Bump, Day 4)</strong>
                      <p>Short, sweet reminder assuming good intent. Bubbles invoice/statement to the top of inbox.</p>
                    </>
                  )}
                  {selectedStageNum === 3 && (
                    <>
                      <strong className="text-amber-700 uppercase block tracking-wider font-bold text-[8px]">🚨 Touch 3 — Formal Escalation (Primary, Day 8)</strong>
                      <p>Formal overdue billing alert indicating active tracking protocol on the platform.</p>
                    </>
                  )}
                  {selectedStageNum === 4 && (
                    <>
                      <strong className="text-amber-600 uppercase block tracking-wider font-bold text-[8px]">📈 Touch 4 — Formal Escalation (Micro-Bump, Day 11)</strong>
                      <p>Authoritative follow-up on ledger updates. Requests prompt feedback from accounting teams.</p>
                    </>
                  )}
                  {selectedStageNum === 5 && (
                    <>
                      <strong className="text-rose-700 uppercase block tracking-wider font-bold text-[8px]">🔥 Touch 5 — Urgent Warning (Primary, Day 15)</strong>
                      <p>Strict notification of potential dunning rating markdowns and platform credit score impacts.</p>
                    </>
                  )}
                  {selectedStageNum === 6 && (
                    <>
                      <strong className="text-rose-600 uppercase block tracking-wider font-bold text-[8px]">⏰ Touch 6 — Urgent Warning (Micro-Bump, Day 18)</strong>
                      <p>Grace expiration alert with 48-hour closure warning. Demands accounting escalations.</p>
                    </>
                  )}
                  {selectedStageNum === 7 && (
                    <>
                      <strong className="text-red-700 uppercase block tracking-wider font-bold text-[8px]">⚖️ Touch 7 — Final Demand (Primary, Day 22)</strong>
                      <p>Prerecorded ultimate notice warning of imminent default status, blacklisting, and collection dispatch.</p>
                    </>
                  )}
                  {selectedStageNum === 8 && (
                    <>
                      <strong className="text-red-950 uppercase block tracking-wider font-bold text-[8px]">🔒 Touch 8 — Default & Audit Trail Wrap-Up (Day 28)</strong>
                      <p>Notice of Default. Automation closed. Dispatches the full admissible audit ledger to records.</p>
                    </>
                  )}
                </div>

                {/* Primary Trigger dispatcher */}
                {debtor.status !== 'PAID' ? (
                  <div className="space-y-2">
                    <button
                      id="simulate-quick-remind"
                      type="button"
                      onClick={() => onSimulateReminder(debtor.id, selectedStageNum, testEmail)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin-slow" /> Send Touch {selectedStageNum} Dunning Email
                    </button>

                    <button
                      id="simulate-full-campaign"
                      type="button"
                      disabled={isSendingAll}
                      onClick={handleSendFullCampaign}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-indigo-400 border border-slate-800 rounded text-[9.5px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isSendingAll ? (
                        <>
                          <span className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Executing Full 8-Touchpoint Cadence Campaign Run...
                        </>
                      ) : (
                        <>
                          ⚡ Execute Full 8-Touchpoint Cadence
                        </>
                      )}
                    </button>

                    {/* Interactive Midpoint sequence Pause Action button */}
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      {debtor.status === 'PAUSED' ? (
                        <button
                          type="button"
                          onClick={() => onTogglePauseCampaign && onTogglePauseCampaign(debtor.id)}
                          className="w-full py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 rounded text-[9.5px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ▶ Settle Promise: Resume Campaign Sequence
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTogglePauseCampaign && onTogglePauseCampaign(debtor.id)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9.5px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ⏸ Pause Dunning Sequence Midway
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center font-mono text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded">
                    ✓ Debt fully paid & closed
                  </p>
                )}
              </div>

              {/* Action Simulation buttons */}
              <div className="pt-1.5 shrink-0 space-y-2">
                <button 
                  type="button"
                  onClick={() => setShowLedgerPreview(true)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-widest rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  📝 Export Enforcement Ledger PDF
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 border border-slate-200 text-slate-500 hover:text-slate-900 text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Close Records
                </button>
              </div>

            </div>

            {/* Right Side Message Rendering Preview panels */}
            <div className="flex-1 bg-slate-950 p-6 text-slate-200 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h4 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-widest font-mono">Classic Message Preview</h4>
                <span className="font-mono text-[8px] uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400">
                  {selectedLog ? selectedLog.status : 'None'}
                </span>
              </div>

              {selectedLog ? (
                <div className="flex-1 flex flex-col justify-between py-2 space-y-3">
                  
                  {/* Type specific previews */}
                  {selectedLog.type === 'email' && (
                    <div className="bg-white text-slate-900 rounded border border-slate-200 shadow-sm flex flex-col max-h-[300px]">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-[9px] font-mono text-slate-650 font-semibold space-y-0.5">
                        <div><span className="text-slate-400 uppercase">From:</span> auto-billing@floate.co</div>
                        <div><span className="text-slate-400 uppercase">To:</span> {debtor.email}</div>
                        <div><span className="text-slate-400 uppercase">Subject:</span> Quick statement from Floate ({debtor.currency}{debtor.amount.toLocaleString()})</div>
                      </div>
                      <div className="p-4 text-xs space-y-3 leading-relaxed overflow-y-auto">
                        <p>Hello <strong>{debtor.name}</strong>,</p>
                        <p>
                          This is a brief commercial note regarding trade balance <strong>{debtor.currency}{debtor.amount.toLocaleString()}</strong>.
                        </p>
                        {debtor.receiptName && (
                          <div className="p-2 bg-[#FAFAFA] border border-slate-150 rounded flex items-center space-x-2 text-[10px] text-slate-500">
                            <span>📎 {debtor.receiptName}</span>
                          </div>
                        )}
                        <p>Please clear outstanding sum securely to reconcile receipt files.</p>
                      </div>
                    </div>
                  )}

                  {selectedLog.type === 'sms' && (
                    <div className="flex justify-end py-2">
                      <div className="max-w-[260px] bg-slate-900 text-white border border-slate-800 rounded px-4 py-3 text-xs leading-relaxed relative">
                        <p className="font-extrabold text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-mono">
                          Text Message Alert
                        </p>
                        {selectedLog.text}
                        <div className="mt-2 text-right">
                          <span className="text-[8px] text-emerald-400 font-mono uppercase">Delivered ✓✓</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLog.type === 'call' && (
                    <div className="bg-slate-900 p-5 rounded border border-slate-800 text-center space-y-3 flex-1 flex flex-col justify-center relative overflow-hidden">
                      <div className="w-10 h-10 bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/10">
                        <Phone className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      
                      <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[8px] uppercase tracking-widest font-mono font-bold border border-slate-850 mb-1.5">
                          📞 Archived Phone Outbound Logs
                        </div>
                        <h5 className="font-sans font-black text-white text-xs uppercase tracking-wider">Automated Call Sequence</h5>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Contact: {debtor.phone}</p>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-3.5 rounded text-[11px] text-slate-350 leading-normal italic text-left select-none">
                        "{selectedLog.text}"
                      </div>
                    </div>
                  )}

                  {selectedLog.type === 'status_change' && (
                    <div className="bg-slate-900 p-5 rounded border border-slate-800 text-center space-y-1 flex-1 flex flex-col justify-center font-mono">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">Status Change event</p>
                      <p className="text-slate-200 text-xs">
                        "{selectedLog.text}"
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-[8px] font-mono text-slate-550 uppercase tracking-widest text-center mt-auto">
                    Secure transmission logged • ISO time: {selectedLog ? selectedLog.timestamp : 'NA'}
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs tracking-wider uppercase font-bold">
                  Select timeline card to preview message template
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {showLedgerPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-slate-300">
            
            {/* Preview Header controls (No print) */}
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center shrink-0 no-print">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <div className="text-left">
                  <h4 className="font-extrabold text-[12px] uppercase tracking-wider font-sans">Floate Certified Enforcement Ledger</h4>
                  <p className="text-[10px] text-slate-400 font-sans">Official admissible statement of dunning escalation activities</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  🖨️ PDF / Print Statement
                </button>
                <button
                  type="button"
                  onClick={() => setShowLedgerPreview(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable sheet area */}
            <div 
              id="printable-ledger-area" 
              className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 font-sans print:p-0 text-left"
            >
              {/* Formal header */}
              <div className="border-b-4 border-slate-900 pb-5 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[20px] font-black text-slate-950 tracking-tighter uppercase font-serif">
                      FLOATE DEBT RECOVERY BUREAU
                    </span>
                    <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 block mt-0.5 font-bold">
                      B2B CREDIT RECOVERY AGENT & ENFORCEMENT SERVICES
                    </span>
                    <span className="text-[9px] font-sans font-semibold text-slate-600 block mt-1">
                      REGISTRY ID: FLO-D-{debtor.id.split('-')[1]?.toUpperCase() || 'X38FB'}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="border border-red-650 text-red-700 bg-red-50/50 p-2 text-[10px] uppercase font-bold select-none text-center rounded ring-1 ring-red-500 font-serif shrink-0">
                      <span className="block font-black text-[12px] leading-none mb-1">
                        {debtor.status === 'DEFAULTED' ? '⚠️ DEFAULT UNRESOLVED' : debtor.status}
                      </span>
                      ENFORCEMENT RECORDED
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">GENERATED UTC: {new Date().toUTCString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 leading-relaxed mb-6">
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">1. CANCELLATION CREDITOR</h5>
                  <p className="font-extrabold text-sm text-slate-900">{debtor.merchantBusinessName || 'SME Freelancer'}</p>
                  <p className="text-xs text-slate-600">Location: {debtor.merchantLocation || 'Lagos, Nigeria'}</p>
                  <p className="text-xs text-slate-600">Culture Profile: {debtor.merchantEthnicity || 'Standard Accent/B2B'}</p>
                  <p className="text-xs text-slate-600">Deliverables SOW: {debtor.merchantWhatTheySell || 'Digital solutions'}</p>
                </div>
                
                <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">2. DEBTOR ACCOUNT</h5>
                  <p className="font-extrabold text-sm text-slate-900">{debtor.name}</p>
                  <p className="text-xs text-slate-600">Email: {debtor.email}</p>
                  <p className="text-xs text-slate-600">Phone: {debtor.phone}</p>
                  <p className="text-xs text-slate-600">Debtor Region: {debtor.debtorLocation || 'Not customized'}</p>
                </div>
              </div>

              {/* Financial overview */}
              <div className="bg-slate-900 text-white rounded p-4 mb-6 grid grid-cols-3 text-center sm:text-left">
                <div>
                  <span className="text-[8.5px] uppercase tracking-widest text-slate-400 font-mono font-bold block">OUTSTANDING BALANCE</span>
                  <strong className="text-xl font-mono text-white mt-1 block">
                    {debtor.currency}{debtor.amount.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase tracking-widest text-slate-400 font-mono font-bold block">DUNNING SEQUENCE MODE</span>
                  <strong className="text-xs uppercase text-indigo-300 tracking-wider mt-1 block font-black">
                    {debtor.sequenceMode || 'ENFORCEMENT'} TONE
                  </strong>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase tracking-widest text-slate-400 font-mono font-bold block font-bold">DUNNING RECOVERY COMMUNS</span>
                  <strong className="text-xs uppercase text-slate-200 tracking-wider mt-1 block font-black">
                    {debtor.history.filter(log => ['email', 'sms', 'call'].includes(log.type)).length} ATTEMPTS
                  </strong>
                </div>
              </div>

              {/* Dispute & OCR Validation Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 border border-slate-200 rounded text-xs bg-[#FAFAFA]">
                  <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest font-mono block mb-1">DOCUMENTARY TRANSACTION PROOF</span>
                  <p className="text-slate-900 font-semibold truncate leading-snug">
                    📎 {debtor.receiptName ? debtor.receiptName : 'No physical invoice attachment provided'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal italic">
                    {debtor.receiptName ? '✓ Legitimate commercial basis established. OCR signature match completed successfully.' : '⚠ Verified offline agreement or handshake transaction.'}
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded text-xs bg-[#FAFAFA]">
                  <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest font-mono block mb-1">REGISTRY TRUST RATING INDEX</span>
                  <p className="text-slate-900 font-bold leading-none mt-1">
                    TRUST SCORE: {scoreVal} / 850 ({details.tier})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                    {details.insight}
                  </p>
                </div>
              </div>

              {/* Official action trail timeline */}
              <div className="space-y-3 mb-6">
                <h4 className="font-serif font-black text-slate-950 uppercase text-xs tracking-wider border-b border-slate-200 pb-1">
                  CERTIFIED ACTION RECORDS TIMELINE LOGS
                </h4>
                
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700 bg-white border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-bold tracking-widest text-slate-500 border-b border-slate-200">
                        <th className="py-2.5 px-3">Date/Time (UTC)</th>
                        <th className="py-2.5 px-3">Contact Type</th>
                        <th className="py-2.5 px-3">Enforcement Activity Text</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {debtor.history.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 uppercase">{log.type}</td>
                          <td className="py-2.5 px-3 text-slate-600 leading-normal font-sans text-xs">{log.text}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className="inline-block py-0.5 px-1.5 text-[8.5px] font-extrabold uppercase bg-emerald-100 text-emerald-9900 rounded-sm">
                              {log.status || 'delivered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Professional warning statement & seal */}
              <div className="border-t border-slate-200 pt-5 mt-6 grid grid-cols-3 gap-6 items-end">
                <div className="col-span-2 text-[9px] text-slate-400 uppercase tracking-wide font-mono leading-relaxed font-bold">
                  <span className="text-slate-800 block mb-1 font-extrabold text-[10px]">WARNING COMMERCIAL STATEMENT:</span>
                  This documentation is processed via Floate's automated trade enforcement system. All dunning attempts, subjects, delivery confirmations, and recipient read/received metadata have been logged on-chain. This statement serves as admissible documentary proof of debt-clearance reluctance for commercial litigation and credit registry blacklisting.
                </div>
                
                <div className="text-center p-3 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center bg-slate-50/50 select-none">
                  <div className="w-11 h-11 border-2 border-indigo-700 rounded-full flex items-center justify-center font-black font-serif text-[18px] text-indigo-700 relative rotate-12">
                    SEAL
                  </div>
                  <span className="text-[7.5px] uppercase font-bold tracking-widest font-mono text-slate-500 block mt-2 text-center text-ellipsis overflow-hidden max-w-full">
                    FLOATE REGISTRY CERTIFIED
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
