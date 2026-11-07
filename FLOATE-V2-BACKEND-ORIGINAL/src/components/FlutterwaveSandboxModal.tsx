import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, Phone, Smartphone, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface FlutterwaveSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  email: string;
  name: string;
  txRef: string;
  description?: string;
  onSuccess: (reference: string) => void;
}

export default function FlutterwaveSandboxModal({
  isOpen,
  onClose,
  amount,
  currency,
  email,
  name,
  txRef,
  description = "Floate Network Payment",
  onSuccess
}: FlutterwaveSandboxModalProps) {
  const [activeMethod, setActiveMethod] = useState<'CARD' | 'TRANSFER' | 'USSD'>('CARD');
  
  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [cardOtp, setCardOtp] = useState('');
  
  // Payment States
  const [step, setStep] = useState<'INPUT' | 'PIN' | 'OTP' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('INPUT');
  const [loadingText, setLoadingText] = useState('Initializing secure connection...');
  const [errorMessage, setErrorMessage] = useState('');

  // Transfer state
  const [countdown, setCountdown] = useState(600); // 10 mins

  useEffect(() => {
    if (activeMethod === 'TRANSFER' && step === 'INPUT') {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 600));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeMethod, step]);

  if (!isOpen) return null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) setCvv(value);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMethod === 'CARD') {
      if (cardNumber.length < 15) {
        setErrorMessage('Please enter a valid card number');
        return;
      }
      if (expiry.length < 5) {
        setErrorMessage('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVV');
        return;
      }
      
      setErrorMessage('');
      setStep('PROCESSING');
      setLoadingText('Securing card transaction details...');
      
      setTimeout(() => {
        setStep('PIN');
      }, 1500);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardPin.length < 4) return;
    setStep('PROCESSING');
    setLoadingText('Authorizing with your bank security gateway...');
    
    setTimeout(() => {
      setStep('OTP');
    }, 2000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardOtp.length < 5) return;
    setStep('PROCESSING');
    setLoadingText('Finalizing balance clearance ledger...');
    
    setTimeout(() => {
      setStep('SUCCESS');
      const mockRef = 'FLW-SANDBOX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTimeout(() => {
        onSuccess(mockRef);
      }, 2000);
    }, 2200);
  };

  const handleTransferPaid = () => {
    setStep('PROCESSING');
    setLoadingText('Confirming inbound transfer signature...');
    
    setTimeout(() => {
      setStep('SUCCESS');
      const mockRef = 'FLW-SANDBOX-TRF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTimeout(() => {
        onSuccess(mockRef);
      }, 2000);
    }, 2500);
  };

  const handleUssdPaid = (bankCode: string) => {
    setStep('PROCESSING');
    setLoadingText(`Awaiting authorization code from your device...`);
    
    setTimeout(() => {
      setStep('SUCCESS');
      const mockRef = 'FLW-SANDBOX-USD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTimeout(() => {
        onSuccess(mockRef);
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" />
      
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden mx-auto animate-fade-in z-10 font-sans flex flex-col md:flex-row h-[550px] md:h-[480px]">
        
        {/* LEFT BAR: Flutterwave branding/amount sidebar (Orange aesthetic) */}
        <div className="bg-[#EF4444] text-white p-6 md:w-5/12 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-white text-[#EF4444] flex items-center justify-center font-black font-mono shadow-md">
                fw
              </span>
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-widest text-white leading-none">flutterwave</h4>
                <span className="text-[8px] text-white/75 uppercase tracking-widest font-mono">payment gateway</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-white/60 font-mono block">paying merchant</span>
              <span className="font-semibold text-xs leading-tight block text-white line-clamp-1">Floate Network SME</span>
              <span className="text-[10px] text-white/80 block line-clamp-2 italic font-serif mt-1">"{description}"</span>
            </div>
          </div>

          <div className="bg-black/10 border border-white/5 rounded-xl p-3.5 space-y-1 mt-4 md:mt-0 relative z-10">
            <span className="text-[9px] uppercase tracking-wider font-bold text-white/60 font-mono block">amount due</span>
            <span className="font-mono text-2xl font-black text-white leading-none tracking-tight block">
              {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-white/70 block font-mono line-clamp-1">{email}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[8.5px] text-white/50 font-mono uppercase tracking-widest mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-white/70" /> SECURE SANDBOX LINK
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Payment Options Form */}
        <div className="flex-1 bg-slate-50 flex flex-col justify-between p-6">
          
          {step === 'INPUT' && (
            <>
              {/* Method Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 shrink-0">
                <button
                  onClick={() => { setActiveMethod('CARD'); setErrorMessage(''); }}
                  className={`flex-1 pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
                    activeMethod === 'CARD' ? 'border-[#EF4444] text-[#EF4444] font-black' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[8.5px]">Card</span>
                </button>
                <button
                  onClick={() => { setActiveMethod('TRANSFER'); setErrorMessage(''); }}
                  className={`flex-1 pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
                    activeMethod === 'TRANSFER' ? 'border-[#EF4444] text-[#EF4444] font-black' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span className="text-[8.5px]">Transfer</span>
                </button>
                <button
                  onClick={() => { setActiveMethod('USSD'); setErrorMessage(''); }}
                  className={`flex-1 pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
                    activeMethod === 'USSD' ? 'border-[#EF4444] text-[#EF4444] font-black' : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[8.5px]">USSD Code</span>
                </button>
              </div>

              {/* CARD FORM */}
              {activeMethod === 'CARD' && (
                <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="bg-[#FAFAFA] border border-orange-100 rounded-lg p-2.5 flex items-center justify-between text-[10px] text-orange-800">
                      <span className="font-mono">💡 Test Card Info:</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCardNumber('4000 1234 5678 9010');
                          setExpiry('12/29');
                          setCvv('201');
                        }}
                        className="bg-[#EF4444] text-white font-extrabold px-2 py-0.5 rounded cursor-pointer hover:bg-red-500 uppercase text-[8px]"
                      >
                        Auto Fill
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#EF4444] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#EF4444] transition-all text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          value={cvv}
                          onChange={handleCvvChange}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#EF4444] transition-all text-center"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="text-[10px] text-red-600 flex items-center gap-1 bg-red-55 px-2.5 py-1.5 rounded border border-red-100 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-[#EF4444] hover:bg-red-500 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-950/10"
                  >
                    Pay {currency} {amount.toLocaleString()} securely <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* BANK TRANSFER SIMULATOR */}
              {activeMethod === 'TRANSFER' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-center py-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Transfer Verification sandbox</span>
                    
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-left shadow-xs">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] text-slate-500">Bank Name</span>
                        <span className="font-extrabold text-xs text-slate-800">Flutterwave Merchant Bank</span>
                      </div>
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] text-slate-500">Account Number</span>
                        <span className="font-mono font-bold text-xs text-slate-800 tracking-wider">9920194812</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Beneficiary</span>
                        <span className="font-sans font-bold text-xs text-[#EF4444]">Floate Settlement Sandbox</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-slate-500 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 text-[#EF4444] animate-spin" />
                      Awaiting payment. Code expires in <span className="font-bold text-slate-800">{formatCountdown(countdown)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTransferPaid}
                    className="w-full py-3 bg-[#EF4444] hover:bg-red-500 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-950/10"
                  >
                    I have completed this simulated transfer
                  </button>
                </div>
              )}

              {/* USSD SIMULATOR */}
              {activeMethod === 'USSD' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold text-center">Select Your Bank</span>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {[
                        { name: "GTBank", code: "*737*1*2#" },
                        { name: "Access Bank", code: "*901*2*1#" },
                        { name: "Zenith Bank", code: "*966*3*2#" },
                        { name: "United Bank (UBA)", code: "*919*4*2#" },
                        { name: "Fidelity Bank", code: "*770*5*2#" },
                        { name: "Sterling Bank", code: "*822*2*2#" }
                      ].map((bk) => (
                        <button
                          key={bk.name}
                          onClick={() => handleUssdPaid(bk.name)}
                          className="p-2.5 bg-white border border-slate-250 hover:border-[#EF4444] hover:bg-red-50/10 text-left rounded-lg transition-all text-[11px] font-bold text-slate-700 flex flex-col justify-between h-14 cursor-pointer"
                        >
                          <span className="font-sans font-black">{bk.name}</span>
                          <span className="font-mono text-[9px] text-[#EF4444]">{bk.code}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-[9.5px] text-slate-400 text-center leading-normal">Click any bank button above to execute the mock USSD string transaction sequence on your emulator sandbox.</p>
                  </div>

                  <button
                    onClick={() => onClose()}
                    className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel Payment
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'PIN' && (
            <form onSubmit={handlePinSubmit} className="flex-1 flex flex-col justify-between items-center py-6">
              <div className="w-full text-center space-y-4">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Enter Card PIN</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Please enter your secret 4-digit automated PIN code to authorize this transaction.</p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                    className="w-24 text-center font-mono text-xl tracking-widest bg-white border-2 border-slate-200 focus:border-[#EF4444] rounded-lg p-2 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cardPin.length < 4}
                className="w-full py-3 bg-[#EF4444] hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Submit PIN Authorization
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleOtpSubmit} className="flex-1 flex flex-col justify-between items-center py-6">
              <div className="w-full text-center space-y-4">
                <span className="text-xl font-bold text-[#EF4444]">📱</span>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Two-Factor Authentication</h4>
                  <p className="text-[10px] text-slate-400 mt-1">We've simulated a security OTP token sent to your device. Please input the code below (e.g. 12345).</p>
                </div>

                <div className="flex justify-center flex-col items-center gap-1.5">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="12345"
                    value={cardOtp}
                    onChange={(e) => setCardOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-28 text-center font-mono text-lg tracking-wider bg-white border-2 border-slate-200 focus:border-[#EF4444] rounded-lg p-2 outline-none transition"
                  />
                  <button 
                    type="button" 
                    onClick={() => setCardOtp('12345')} 
                    className="text-[9px] text-[#EF4444] hover:underline font-bold"
                  >
                    Quick Autofill (12345)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cardOtp.length < 5}
                className="w-full py-3 bg-[#EF4444] hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Verify & Submit Payment
              </button>
            </form>
          )}

          {step === 'PROCESSING' && (
            <div className="flex-1 flex flex-col justify-center items-center py-12 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-100 border-t-[#EF4444] rounded-full animate-spin"></div>
                <span className="absolute text-[10px] font-mono font-black text-[#EF4444]">fw</span>
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">Processing Sandbox ledger</h4>
                <p className="text-[10px] text-slate-400 mt-1 animate-pulse">{loadingText}</p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex-1 flex flex-col justify-center items-center py-6 text-center space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-black text-sm uppercase tracking-wider text-emerald-700">Payment Certified!</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                  Thank you! Your simulated payment has been successfully recorded in the Floate Settlement engine. Updating ledger status...
                </p>
              </div>

              <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                🔒 Secured by Flutterwave Core Engine
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
