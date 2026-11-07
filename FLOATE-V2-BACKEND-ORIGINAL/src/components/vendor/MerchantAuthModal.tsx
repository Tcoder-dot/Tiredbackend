import React, { useState } from "react";
import { X, Store, Phone, MapPin, ShieldCheck, Sparkles, Camera, ArrowRight, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { api } from "../../services/api";
import { NIGERIAN_STATES, INFORMAL_CATEGORIES } from "../../data/nigeriaConstants";

interface MerchantAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (vendorSlug: string) => void;
}

const CITIES = NIGERIAN_STATES;
const CATEGORIES = INFORMAL_CATEGORIES;


export const MerchantAuthModal: React.FC<MerchantAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [authMode, setAuthMode] = useState<"SELECT" | "REGISTER" | "LOGIN" | "OTP" | "SUCCESS">("SELECT");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  // Registration form fields
  const [businessName, setBusinessName] = useState("");
  const [addressType, setAddressType] = useState<"Shop Address" | "Home Address">("Shop Address");
  const [addressDetail, setAddressDetail] = useState("");
  const [city, setCity] = useState("Lagos");
  const [category, setCategory] = useState("Gadgets & Phones");
  const [profilePhoto, setProfilePhoto] = useState<string>("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80");
  const [cacInfo, setCacInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSlug, setSuccessSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    setErrorMessage("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setMediaStream(stream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      // Fallback to file input capture if getUserMedia fails or is blocked in iframe
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setErrorMessage("Camera access restricted. Please upload your photo from device camera.");
      }
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePhoto(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePhoto(event.target.result as string);
          setErrorMessage("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    if (!isOpen || authMode !== "REGISTER") {
      stopCamera();
    }
  }, [isOpen, authMode]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setErrorMessage("Please enter a valid WhatsApp / phone number");
      return;
    }
    setErrorMessage("");
    setAuthMode("OTP");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMessage("Please enter the 4-digit code sent to your WhatsApp (e.g. 1234)");
      return;
    }
    // Simulate login
    const slug = phoneNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "merchant";
    onLoginSuccess(slug);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phoneNumber.trim() || !addressDetail.trim()) {
      setErrorMessage("Please fill in all required fields (Business Name, WhatsApp Line, Address)");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const newVendor = {
        id: "v_" + Date.now(),
        slug,
        name: businessName,
        city,
        state: city === "Lagos" ? "Lagos State" : "Nigeria",
        category,
        verified: false, // Pending AI verification
        avatar_url: profilePhoto,
        bio: `${businessName} (${addressType}: ${addressDetail}). Verified informal market merchant on FLOATE Africa.`,
        whatsapp_number: phoneNumber,
        address_type: addressType,
        address_detail: addressDetail,
        cac_info: cacInfo,
        created_at: new Date().toISOString()
      };

      // Store in localStorage for instant mock persistence & session
      try {
        const existingVendors = JSON.parse(localStorage.getItem("floate_merchants") || "[]");
        existingVendors.unshift(newVendor);
        localStorage.setItem("floate_merchants", JSON.stringify(existingVendors));
        localStorage.setItem("floate_current_merchant_slug", slug);
      } catch (err) {}

      setSuccessSlug(slug);
      setAuthMode("SUCCESS");
    } catch (err) {
      setErrorMessage("Registration failed. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsappClaim = () => {
    const text = encodeURIComponent(`CLAIM_BUSINESS_${successSlug}_${businessName}`);
    window.open(`https://wa.me/message/YYWEZAZZIXBRF1?text=${text}`, '_blank', 'noopener,noreferrer');
    onLoginSuccess(successSlug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FAF8F2] border-2 border-[#13241F] rounded-[32px] shadow-[8px_8px_0px_#13241F] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#13241F] text-white p-6 flex items-center justify-between border-b-2 border-[#13241F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FACC15] text-[#13241F] flex items-center justify-center font-black border-2 border-[#13241F]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Merchant Portal</h2>
              <p className="text-xs text-slate-300 font-medium">FLOATE Africa informal market OS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authMode === "SELECT" && (
            <div className="space-y-6 py-4 text-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#13241F]">Grow your market stall with AI</h3>
                <p className="text-xs text-[#5B6E66] max-w-sm mx-auto font-medium">
                  Register your shop or home business, upload your selfie (permanently locked for trust), and receive direct WhatsApp orders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    window.history.pushState({}, "", "/register");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="p-5 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#13241F] border-2 border-[#13241F] shadow-[4px_4px_0px_#13241F] transition flex flex-col items-center text-center gap-2 cursor-pointer active:translate-y-[1px]"
                >
                  <Store className="w-8 h-8 text-[#13241F]" />
                  <span className="font-black text-sm uppercase tracking-wider">Register Business</span>
                  <span className="text-[11px] font-medium opacity-80">Get verified storefront & AI WhatsApp bot</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.history.pushState({}, "", "/login");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="p-5 rounded-2xl bg-white hover:bg-slate-50 text-[#13241F] border-2 border-[#13241F] shadow-[4px_4px_0px_#13241F] transition flex flex-col items-center text-center gap-2 cursor-pointer active:translate-y-[1px]"
                >
                  <Phone className="w-8 h-8 text-[#0A4D3C]" />
                  <span className="font-black text-sm uppercase tracking-wider">Merchant Login</span>
                  <span className="text-[11px] font-medium text-[#5B6E66]">Sign in via WhatsApp One-Click</span>
                </button>
              </div>
            </div>
          )}

          {authMode === "LOGIN" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#13241F]">Sign in to your Dashboard</h3>
                <p className="text-xs text-[#5B6E66] font-medium">Enter your registered WhatsApp or phone number.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">WhatsApp / Phone Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-[#5B6E66] pointer-events-none flex items-center gap-1 select-none">
                    <span>🇳🇬</span>
                    <span>+234</span>
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 08031234567 or 8031234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-20 pr-4 py-3 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("SELECT")}
                  className="px-5 py-2.5 rounded-xl bg-white text-xs font-black text-[#13241F] border-2 border-[#13241F] hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#13241F] text-white text-xs font-black uppercase tracking-wider hover:bg-[#0A4D3C] border-2 border-[#13241F] shadow-[3px_3px_0px_#13241F] transition cursor-pointer flex items-center gap-2"
                >
                  <span>Send OTP Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {authMode === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#13241F]">WhatsApp OTP Verification</h3>
                <p className="text-xs text-[#5B6E66] font-medium">Floate AI sent a 4-digit security code to your WhatsApp (+234 {phoneNumber}). (Demo code: <span className="font-bold text-[#0A4D3C]">1234</span>)</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">4-Digit Code</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg py-3 rounded-xl bg-white border-2 border-[#13241F] font-black text-[#13241F] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("LOGIN")}
                  className="px-5 py-2.5 rounded-xl bg-white text-xs font-black text-[#13241F] border-2 border-[#13241F] hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#FACC15] text-[#13241F] text-xs font-black uppercase tracking-wider hover:bg-[#EAB308] border-2 border-[#13241F] shadow-[3px_3px_0px_#13241F] transition cursor-pointer flex items-center gap-2"
                >
                  <span>Verify & Login</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0A4D3C]" />
                </button>
              </div>
            </form>
          )}

          {authMode === "REGISTER" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#13241F]">Register Informal Business</h3>
                <p className="text-xs text-[#5B6E66] font-medium">Create your verified market stall and instant WhatsApp AI catalog.</p>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">Business / Store Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chivora Phones & Gadgets"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                  required
                />
              </div>

              {/* WhatsApp Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">Direct WhatsApp Line *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#5B6E66] pointer-events-none flex items-center gap-1 select-none">
                    <span>🇳🇬</span>
                    <span>+234</span>
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 08031234567 or 8031234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                    required
                  />
                </div>
              </div>

              {/* Address Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">Address Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddressType("Shop Address")}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition cursor-pointer ${
                      addressType === "Shop Address"
                        ? "bg-[#13241F] text-white border-[#13241F]"
                        : "bg-white text-[#13241F] border-[#13241F] hover:bg-slate-50"
                    }`}
                  >
                    🏪 Shop Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType("Home Address")}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition cursor-pointer ${
                      addressType === "Home Address"
                        ? "bg-[#13241F] text-white border-[#13241F]"
                        : "bg-white text-[#13241F] border-[#13241F] hover:bg-slate-50"
                    }`}
                  >
                    🏠 Home Address
                  </button>
                </div>
              </div>

              {/* Specific Address Detail */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">
                  {addressType === "Shop Address" ? "Shop Location & Market / Address *" : "Home Address / Delivery Location *"}
                </label>
                <input
                  type="text"
                  placeholder={addressType === "Shop Address" ? "e.g. Alaba Int Market, Shop 14B" : "e.g. No 12 Adebayo St, Ikeja"}
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                  required
                />
              </div>

              {/* City & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* One-Time Locked Profile Selfie with Live Camera */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#FEF3C7]/60 border-2 border-[#13241F]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#13241F] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#78350F]" />
                    <span>Profile Photo / Selfie (Permanent Lock)</span>
                  </label>
                  <span className="text-[10px] bg-[#13241F] text-[#FACC15] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked Once Set
                  </span>
                </div>
                <p className="text-[11px] text-[#78350F] font-medium">
                  To prevent identity switching and build absolute buyer trust in African informal markets, your profile photo cannot be changed after initial setup.
                </p>

                {isCameraActive ? (
                  <div className="space-y-3 bg-black p-3 rounded-2xl border-2 border-[#13241F] text-center">
                    <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2 rounded-xl bg-[#FACC15] text-[#13241F] text-xs font-black uppercase tracking-wider hover:bg-[#EAB308] border-2 border-[#13241F] transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Live Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 rounded-xl bg-white text-[#13241F] text-xs font-black uppercase tracking-wider hover:bg-slate-100 border-2 border-[#13241F] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <img
                      src={profilePhoto}
                      alt="Profile Preview"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-[#13241F] shadow-xs shrink-0"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 w-full flex-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#13241F] hover:bg-[#0A4D3C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#13241F] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#FACC15]" />
                        <span>Open Camera (Take Selfie)</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleFileCapture}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* KYC / CAC info (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#13241F] uppercase tracking-wider">CAC / Trade Union Registration (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BN-20261234 or Alaba Traders Union ID"
                  value={cacInfo}
                  onChange={(e) => setCacInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#13241F] text-xs font-bold text-[#13241F]"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("SELECT")}
                  className="px-5 py-2.5 rounded-xl bg-white text-xs font-black text-[#13241F] border-2 border-[#13241F] hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FACC15] text-[#13241F] text-xs font-black uppercase tracking-wider hover:bg-[#EAB308] border-2 border-[#13241F] shadow-[3px_3px_0px_#13241F] transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? "Registering..." : "Submit & Verify"}</span>
                  <Sparkles className="w-4 h-4 text-[#0A4D3C]" />
                </button>
              </div>
            </form>
          )}

          {authMode === "SUCCESS" && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] text-[#78350F] border-2 border-[#13241F] shadow-[4px_4px_0px_#13241F] mx-auto flex items-center justify-center">
                <Store className="w-8 h-8 text-[#78350F]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#13241F]">Pending Admin Vetting</h3>
                <p className="text-xs text-[#5B6E66] max-w-sm mx-auto font-medium">
                  Your business has been registered and queued for manual admin approval. Once vetted and approved by our team, Floate AI will send a confirmation message to your WhatsApp number.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E6F4EA] border-2 border-[#13241F] text-left space-y-2">
                <div className="text-xs font-black text-[#0A4D3C] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0A4D3C]" />
                  <span>WhatsApp Login & Verification</span>
                </div>
                <p className="text-xs text-[#13241F] font-semibold leading-relaxed">
                  Upon approval, your store will be live in search and you can log into your merchant dashboard anytime via WhatsApp OTP.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-[#13241F] hover:bg-[#0A4D3C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#13241F] shadow-[4px_4px_0px_#13241F] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Done, Return to Home</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
