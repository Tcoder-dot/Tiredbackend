import React, { useState } from 'react';
import { Building, User, Phone, Shield, Save, Award, Activity, Loader2, Mail, MapPin, Twitter, ExternalLink } from 'lucide-react';
import { UserState } from '../types';

interface MerchantProfileTabProps {
  user: UserState;
  onUpdateProfile?: (profileData: Partial<UserState>) => void;
  userCollectionResult: {
    collection_rating_percentage: number;
    rating_tier: string;
    gamified_badge: string;
    score_color_code: string;
    business_insight: string;
  };
}

export default function MerchantProfileTab({
  user,
  onUpdateProfile,
  userCollectionResult
}: MerchantProfileTabProps) {
  const [realName, setRealName] = useState(user.realName || user.name || '');
  const [businessName, setBusinessName] = useState(user.businessName || '');
  const [businessCategory, setBusinessCategory] = useState(user.businessCategory || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [businessAddress, setBusinessAddress] = useState(user.businessAddress || 'Enugu Nigeria');
  const [bankName, setBankName] = useState(user.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '');
  const [accountName, setAccountName] = useState(user.accountName || '');
  const [resendApiKey, setResendApiKey] = useState(user.resendApiKey || '');
  const [senderEmail, setSenderEmail] = useState(user.senderEmail || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    setSaving(true);
    try {
      await onUpdateProfile({
        realName,
        name: realName,
        businessName,
        businessCategory,
        phone,
        businessAddress,
        bankName,
        accountNumber,
        accountName,
        resendApiKey,
        senderEmail
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="merchant_profile_tab_container">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200/35 font-mono px-2 py-0.5 rounded font-black tracking-widest uppercase">
          Merchant Registration Profile
        </span>
        <h2 className="text-xl font-sans font-black text-slate-950 uppercase tracking-tight flex items-center gap-2 mt-1.5">
          <Building className="w-5.5 h-5.5 text-amber-600" /> Merchant profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify corporate parameters and update your administrative contacts securely.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Merchant Configuration Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-2xs">
          <h3 className="text-xs font-mono tracking-widest font-black uppercase text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-400" /> Corporate Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Owner Legal Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="profile-field-real-name"
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    required
                    placeholder="Enter owner legal name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Registered Business Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Building className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="profile-field-business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    placeholder="Enter business brand name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Telephone Contact
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="profile-field-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Business Industry Category
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="profile-field-category"
                    type="text"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="e.g. FMCG Wholesale, Electronics, Textiles"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Corporate Physical Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start text-slate-400 pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <input
                  id="profile-field-address"
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Street Address, City, Country"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                System Registered Email
              </label>
              <div className="relative font-sans">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={user.email}
                  disabled
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs cursor-not-allowed font-mono outline-none"
                />
              </div>
            </div>

            {/* Settlement Bank Payout Details */}
            <div className="pt-5 border-t border-slate-100">
              <h4 className="text-[10px] font-mono tracking-widest font-black uppercase text-purple-600 mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-600" /> Settlement Bank Payout Configuration
              </h4>
              <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                Set up your default payout bank details. Email reminders and invoice dispatch links will direct debtors to pay directly to these details, allowing fee-free, instant bank clearance with zero commission.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Bank Name
                  </label>
                  <input
                    id="profile-field-bank-name"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. GTBank, Access Bank, Zenith Bank"
                    className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Account Number
                  </label>
                  <input
                    id="profile-field-account-number"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit NUBAN number"
                    maxLength={10}
                    className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs font-mono transition outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Account / Business Name
                  </label>
                  <input
                    id="profile-field-account-name"
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. John Doe Enterprises"
                    className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs transition outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                id="profile-submit-save-btn"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded text-[10px] uppercase tracking-widest font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Corporate details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Platform Support and Verification Hub Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-2xs mt-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-slate-900 shrink-0" />
            <div>
              <h4 className="font-sans font-black text-slate-950 text-xs uppercase tracking-wider">Floate Platform Support & Verification Details</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Official compliance routing parameters and instant support channels.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            {/* Physical Address Block */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[8.5px] font-mono tracking-widest font-black uppercase text-slate-400 block">Compliance Location</span>
                <p className="font-bold text-slate-900 mt-1">Enugu Nigeria</p>
              </div>
              <p className="text-[9.5px] text-slate-900 font-mono font-bold uppercase tracking-wide">★ Verified Address</p>
            </div>

            {/* Support Email Block */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[8.5px] font-mono tracking-widest font-black uppercase text-slate-400 block">Administrative Mail</span>
                <p className="font-bold text-slate-900 mt-1">Floateafrica@gmail.com</p>
              </div>
              <a 
                href="mailto:Floateafrica@gmail.com" 
                className="text-[9.5px] text-slate-900 hover:underline font-bold inline-flex items-center gap-1 uppercase tracking-wide"
              >
                Send email <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Official X Handle Block */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[8.5px] font-mono tracking-widest font-black uppercase text-slate-400 block">Official X (Twitter)</span>
                <p className="font-bold text-slate-900 mt-1">@usefloate</p>
              </div>
              <a 
                href="https://x.com/usefloate" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[9.5px] text-slate-900 hover:underline font-bold inline-flex items-center gap-1 uppercase tracking-wide"
              >
                Follow on X <Twitter className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
