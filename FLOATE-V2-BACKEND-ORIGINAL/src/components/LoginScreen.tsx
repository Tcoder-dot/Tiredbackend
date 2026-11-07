import React, { useState } from 'react';
import { Mail, Lock, Phone, User, Landmark, Building, MapPin, Briefcase, ChevronRight, Check, Sun, Moon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (name: string, email: string, tier: 'FREE' | 'HUSTLER' | 'MERCHANT', sandboxProfile?: any) => void;
  onBackToLanding: () => void;
  isFirestoreOffline?: boolean;
}

export default function LoginScreen({ onLoginSuccess, onBackToLanding, isFirestoreOffline }: LoginScreenProps) {
  const darkMode = false;
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('chukwuemekarich24@gmail.com');
  const [name, setName] = useState('Emeka Rich');
  const [password, setPassword] = useState('password123');
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'HUSTLER' | 'MERCHANT' | 'ENTERPRISE'>('FREE');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🚪 Onboarding Wizard States
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardUid, setOnboardUid] = useState('');
  const [onboardStep, setOnboardStep] = useState(1); // 1 = Name/Location, 2 = Professional, 3 = referral, 4 = challenge

  // Onboarding Form fields
  const [realName, setRealName] = useState('');
  const [location, setLocation] = useState('Nigeria');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  const [profession, setProfession] = useState('Freelancer / Consultant');
  const [customProfession, setCustomProfession] = useState('');
  const [showCustomProfession, setShowCustomProfession] = useState(false);

  const [referralSource, setReferralSource] = useState('Twitter / X');
  const [customReferral, setCustomReferral] = useState('');
  const [showCustomReferral, setShowCustomReferral] = useState(false);

  const [paymentChallenge, setPaymentChallenge] = useState('Clients paying late');
  const [customChallenge, setCustomChallenge] = useState('');
  const [showCustomChallenge, setShowCustomChallenge] = useState(false);

  // 🤝 Helper to pre-populate onboarding form data based on profile structure or demo presets
  const loadOnboardingWithDefaults = (uid: string, emailStr: string, defaultName: string, profile?: any) => {
    setOnboardUid(uid);
    setIsOnboarding(true);
    setOnboardStep(1);

    const isDemoRich = emailStr === 'chukwuemekarich24@gmail.com';
    const isDemoMama = emailStr === 'mama_shop@market.ng';

    setRealName(profile?.realName || profile?.name || (isDemoRich ? 'Emeka Rich' : isDemoMama ? 'Mama Tunde' : defaultName || ''));
    
    const initialLocation = profile?.location || 'Nigeria';
    setLocation(initialLocation);
    setShowCustomLocation(initialLocation === 'Other');
    setCustomLocation(profile?.location && initialLocation === 'Other' ? profile.location : '');

    const initialProfession = profile?.profession || 'Freelancer / Consultant';
    setProfession(initialProfession);
    setShowCustomProfession(initialProfession === 'Other');
    setCustomProfession(profile?.profession && initialProfession === 'Other' ? profile.profession : '');

    const initialReferral = profile?.referralSource || 'Twitter / X';
    setReferralSource(initialReferral);
    setShowCustomReferral(initialReferral === 'Other');
    setCustomReferral(profile?.referralSource && initialReferral === 'Other' ? profile.referralSource : '');

    const initialChallenge = profile?.paymentChallenge || 'Clients paying late';
    setPaymentChallenge(initialChallenge);
    setShowCustomChallenge(initialChallenge === 'Other');
    setCustomChallenge(profile?.paymentChallenge && initialChallenge === 'Other' ? profile.paymentChallenge : '');
  };

  // Dynamic credit score calculation for gamification & visual display
  const getSimulatedCreditScore = () => {
    let baseScore = 600;
    if (realName.trim().length > 3) baseScore += 100;
    if (location !== 'Other' || customLocation.trim().length > 0) baseScore += 100;
    if (profession !== 'Other' || customProfession.trim().length > 0) baseScore += 100;
    if (paymentChallenge !== 'Other' || customChallenge.trim().length > 0) baseScore += 100;
    return Math.min(baseScore, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;
      
      const profileSnap = await getDoc(doc(db, 'users', uid));
      let profile = profileSnap.data();
      
      if (!profile) {
        // Create initial placeholder, check if needs onboarding
        loadOnboardingWithDefaults(uid, firebaseUser.email || '', firebaseUser.displayName || '');
      } else if (!profile.onboardingCompleted) {
        loadOnboardingWithDefaults(uid, firebaseUser.email || '', firebaseUser.displayName || '', profile);
      } else {
        onLoginSuccess(
          profile.name || profile.realName || 'Merchant', 
          profile.email || firebaseUser.email || '', 
          (profile.subscriptionTier || 'FREE') as 'FREE' | 'HUSTLER' | 'MERCHANT'
        );
      }
    } catch (err: any) {
      console.error('Google Sign-In Error: ', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In provider is not enabled in your Firebase Project Console. To use Google Sign-In, please navigate to your Firebase Console (Build -> Authentication -> Sign-in Method), click "Add new provider" and enable "Google" provider. In the meantime, you can instantly bypass this by using our Offline Sandbox mode below!');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In popup was closed before completion. If you are having trouble with popups or want to proceed without authenticating, feel free to bypass this via our fully functional Offline Sandbox mode below!');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser\'s pop-up blocker. Please allow popups for this site or use our fully functional Offline Sandbox mode below!');
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setError('A network request failed when communicating with Google/Firebase servers. This is usually due to an internet offline state or local connectivity blocks. To bypass this immediately, you can use our robust Offline Sandbox mode below.');
      } else {
        setError(err.message || 'Google Sign-In failed. Feel free to use Offline Sandbox mode.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxFallback = (fallbackEmail: string, fallbackName: string, plan: 'FREE' | 'HUSTLER' | 'MERCHANT') => {
    setIsLoading(true);
    setError('');
    
    const isDemoRich = fallbackEmail === 'chukwuemekarich24@gmail.com';
    const isDemoMama = fallbackEmail === 'mama_shop@market.ng';

    // Load onboarding, set special onboardUid starting with "sandbox_"
    setRealName(isDemoRich ? 'Emeka Rich' : isDemoMama ? 'Mama Tunde' : fallbackName);
    setLocation('Nigeria');
    setShowCustomLocation(false);
    setCustomLocation('');

    setProfession('Freelancer / Consultant');
    setShowCustomProfession(false);
    setCustomProfession('');

    setReferralSource('Twitter / X');
    setShowCustomReferral(false);
    setCustomReferral('');

    setPaymentChallenge('Clients paying late');
    setShowCustomChallenge(false);
    setCustomChallenge('');
    
    setOnboardUid(`sandbox_${fallbackEmail}`);
    setIsOnboarding(true);
    setOnboardStep(1);
    setIsLoading(false);
  };

  const handleAuthentication = async (targetEmail: string, targetName: string, desiredPlan: 'FREE' | 'HUSTLER' | 'MERCHANT') => {
    setIsLoading(true);
    setError('');
    const targetPassword = password.length >= 6 ? password : 'password123';
    
    try {
      let userCredential;
      if (isSignUp) {
        // Sign-up process
        userCredential = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
        const uid = userCredential.user.uid;
        
        // Write the profile but do not call onLoginSuccess yet! Bring up Onboarding
        await setDoc(doc(db, 'users', uid), {
          name: targetName,
          email: targetEmail,
          credits: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 4500 : 0,
          subscriptionTier: desiredPlan,
          escrowBalance: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 25000 : 0,
          onboardingCompleted: false,
          createdAt: new Date().toISOString()
        });

        // Initialize Onboarding step states
        loadOnboardingWithDefaults(uid, targetEmail, targetName);
      } else {
        // Sign-in process
        try {
          userCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        } catch (authErr: any) {
          // Fallback mechanism to sign them up if account is a demo profile and does not exist in Cloud auth block yet
          const isDemoEmail = targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' || targetEmail.includes('sandbox_');
          if (isDemoEmail && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.message?.includes('invalid-credential'))) {
            userCredential = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            const uid = userCredential.user.uid;
            
            await setDoc(doc(db, 'users', uid), {
              name: targetName,
              email: targetEmail,
              credits: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 4500 : 0,
              subscriptionTier: desiredPlan,
              escrowBalance: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 25000 : 0,
              onboardingCompleted: false,
              createdAt: new Date().toISOString()
            });

            loadOnboardingWithDefaults(uid, targetEmail, targetName);
            return;
          } else {
            throw authErr;
          }
        }
        
        const uid = userCredential.user.uid;
        const profileSnap = await getDoc(doc(db, 'users', uid));
        let profile = profileSnap.data();
        
        if (!profile) {
          // Self-heal profile document if it was missing
          profile = {
            name: targetName || targetEmail.split('@')[0],
            email: targetEmail,
            credits: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 4500 : 0,
            subscriptionTier: desiredPlan,
            escrowBalance: targetEmail === 'chukwuemekarich24@gmail.com' || targetEmail === 'mama_shop@market.ng' ? 25000 : 0,
            onboardingCompleted: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', uid), profile);
        }

        if (!profile.onboardingCompleted) {
          loadOnboardingWithDefaults(uid, targetEmail, targetName, profile);
        } else {
          onLoginSuccess(
            profile.name || targetName, 
            profile.email || targetEmail, 
            (profile.subscriptionTier || desiredPlan) as 'FREE' | 'HUSTLER' | 'MERCHANT'
          );
        }
      }
    } catch (err: any) {
      console.error('Firebase Auth Error: ', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in provider is not enabled in your Firebase Project Console. To connect production accounts using password credentials, navigate to your Firebase Console (Build -> Authentication -> Sign-in Method), click "Add new provider" and enable "Email/Password". In the meantime, click the "Bypass" button below to enter the fully-featured Sandbox mode instantly!');
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setError('A network request failed when communicating with Firebase servers. If you are experiencing network firewalls or internet blocks, please feel free to bypass this via our fully functional Offline Sandbox mode of Floate.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential') || err.message?.includes('INVALID_LOGIN_CREDENTIALS')) {
        setError('Incorrect email address or password. Please verify your login details.');
      } else {
        setError(`[${err.code || 'auth-error'}]: ${err.message || 'Authentication failed. Please verify your credentials.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isSignUp && !name) {
      setError('Please enter your display name.');
      return;
    }

    const mappedPlan = selectedPlan === 'ENTERPRISE' ? 'MERCHANT' : selectedPlan;
    handleAuthentication(email, name, mappedPlan as 'FREE' | 'HUSTLER' | 'MERCHANT');
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field Verifications
    if (onboardStep === 1) {
      if (!realName.trim()) {
        setError('Real full name is mandatory.');
        return;
      }
      if (location === 'Other' && !customLocation.trim()) {
        setError('Please enter your custom location.');
        return;
      }
      setOnboardStep(2);
      return;
    }

    if (onboardStep === 2) {
      if (profession === 'Other' && !customProfession.trim()) {
        setError('Please specify your professional role.');
        return;
      }
      setOnboardStep(3);
      return;
    }

    if (onboardStep === 3) {
      if (referralSource === 'Other' && !customReferral.trim()) {
        setError('Please specify where you heard about us.');
        return;
      }
      setOnboardStep(4);
      return;
    }

    if (onboardStep === 4) {
      if (paymentChallenge === 'Other' && !customChallenge.trim()) {
        setError('Please specify your biggest challenge.');
        return;
      }
    }

    // Step 4 submission - Save
    setIsLoading(true);
    try {
      const computedScore = getSimulatedCreditScore();
      const planMapped = selectedPlan === 'ENTERPRISE' ? 'MERCHANT' : selectedPlan;

      const finalLocation = location === 'Other' ? customLocation : location;
      const finalProfession = profession === 'Other' ? customProfession : profession;
      const finalReferral = referralSource === 'Other' ? customReferral : referralSource;
      const finalChallenge = paymentChallenge === 'Other' ? customChallenge : paymentChallenge;

      const updatePayload = {
        name: realName || name,
        realName: realName,
        location: finalLocation,
        profession: finalProfession,
        referralSource: finalReferral,
        paymentChallenge: finalChallenge,
        onboardingCompleted: true,
        creditScore: computedScore,
        subscriptionTier: planMapped as 'FREE' | 'HUSTLER' | 'MERCHANT',
        email: email,
        credits: email === 'chukwuemekarich24@gmail.com' || email === 'mama_shop@market.ng' ? 4500 : 0,
        escrowBalance: email === 'chukwuemekarich24@gmail.com' || email === 'mama_shop@market.ng' ? 25000 : 0,
        // Compatibility fields
        phone: '+234 800 000 0000',
        businessName: realName || name,
        businessCategory: finalProfession,
        businessAddress: finalLocation,
        cacNumber: 'Unregistered'
      };

      if (onboardUid.startsWith('sandbox_')) {
        onLoginSuccess(
          realName || name,
          email,
          planMapped as 'FREE' | 'HUSTLER' | 'MERCHANT',
          updatePayload
        );
      } else {
        const userRef = doc(db, 'users', onboardUid);
        await setDoc(userRef, updatePayload, { merge: true });

        onLoginSuccess(
          realName || name,
          email,
          planMapped as 'FREE' | 'HUSTLER' | 'MERCHANT'
        );
      }
    } catch (err: any) {
      console.error('Onboarding Save Error: ', err);
      setError(err.message || 'Onboarding failed. Please review values.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setName(demoName);
    setPassword('demoaccess123');
    const plan = demoEmail.includes('rich') ? 'MERCHANT' : 'HUSTLER';
    setIsSignUp(false);
    
    // Trigger authentication workflow directly
    setTimeout(() => {
      handleAuthentication(demoEmail, demoName, plan as 'FREE' | 'HUSTLER' | 'MERCHANT');
    }, 50);
  };


  const handleLocationChange = (val: string) => {
    setLocation(val);
    setShowCustomLocation(val === 'Other');
  };

  const handleProfessionChange = (val: string) => {
    setProfession(val);
    setShowCustomProfession(val === 'Other');
  };

  const handleReferralChange = (val: string) => {
    setReferralSource(val);
    setShowCustomReferral(val === 'Other');
  };

  const handleChallengeChange = (val: string) => {
    setPaymentChallenge(val);
    setShowCustomChallenge(val === 'Other');
  };

  if (isOnboarding) {
    const activeScore = getSimulatedCreditScore();
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col justify-center py-10 px-4 md:px-8 font-sans relative transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10 mb-6">
          <div className="inline-flex items-center space-x-2 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 uppercase">Onboarding Setup Wizard</span>
          </div>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight uppercase">Let's Personalize Your Floate Experience</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Please answer these simple questions to customize your merchant collection automation templates.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
          <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-5">
            
            {/* Left sidebar info column with 4-Step Trackers */}
            <div className="md:col-span-2 bg-slate-50 text-slate-900 border-r border-slate-200/80 p-6 flex flex-col justify-between select-none">
              <div>
                <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black">Profile Integration</p>
                <h3 className="text-sm font-sans font-extrabold uppercase tracking-wide mt-1 text-slate-955">Setup Progress</h3>
                
                {/* Visual score display or rating index for gamification */}
                <div className="my-6 text-center bg-white p-4 rounded-lg border border-slate-200/80 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
                  <div className="relative">
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 font-extrabold">computed SME Rating</span>
                    <span className="block text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-600 font-mono tracking-tighter my-1">
                      {activeScore}
                    </span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(activeScore / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center space-x-3 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      onboardStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      1
                    </div>
                    <div>
                      <p className={`font-bold uppercase tracking-wider text-[10px] ${onboardStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Name & Location</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">Personal identity details</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      onboardStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      2
                    </div>
                    <div>
                      <p className={`font-bold uppercase tracking-wider text-[10px] ${onboardStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Professional Background</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">Role or industry specialty</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      onboardStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      3
                    </div>
                    <div>
                      <p className={`font-bold uppercase tracking-wider text-[10px] ${onboardStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>Referral Source</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">How you heard of us</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      onboardStep >= 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      4
                    </div>
                    <div>
                      <p className={`font-bold uppercase tracking-wider text-[10px] ${onboardStep >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>Core Challenge</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">Payment request obstacles</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-snug">
                🤝 <strong>Almost Done:</strong> These setup questions personalize your chasing campaign strategies to yield optimal recovery rates.
              </div>
            </div>

            {/* Right Form processing area */}
            <form onSubmit={handleOnboardingSubmit} className="md:col-span-3 p-6 flex flex-col justify-between font-sans bg-white dark:bg-slate-900">
              <div>
                {error && (
                  <div className="mb-4 text-xs bg-red-50 text-red-800 p-3 rounded-md border border-red-100 font-bold">
                    ⚠️ {error}
                  </div>
                )}

                {onboardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">1: Identity & Location</h3>
                      <p className="text-[10px] text-slate-400">Introduce yourself and your primary operating location.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono mb-1.5">
                        Real Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          required
                          value={realName}
                          onChange={(e) => setRealName(e.target.value)}
                          placeholder="Surname & Given Name"
                          className="block w-full text-xs rounded border border-slate-200 py-2.5 pl-9 pr-3 text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono mb-1.5">
                        Primary Location
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="block w-full text-xs rounded border border-slate-200 py-2.5 pl-9 pr-2 text-slate-900 bg-white font-bold focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                        >
                          <option value="Nigeria">Nigeria (Primary)</option>
                          <option value="South Africa">South Africa</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="Germany">Germany</option>
                          <option value="Other">Other (Add Custom)</option>
                        </select>
                      </div>

                      {showCustomLocation && (
                        <div className="mt-3">
                          <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            Type your location
                          </label>
                          <input
                            type="text"
                            required
                            value={customLocation}
                            onChange={(e) => setCustomLocation(e.target.value)}
                            placeholder="e.g. Australia or Rwanda"
                            className="block w-full text-xs rounded border border-indigo-200 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {onboardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">2: Professional Specialty</h3>
                      <p className="text-[10px] text-slate-400">Select your professional background to align reminder language styles.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono mb-1.5">
                        Your Profession / Role
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Briefcase className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={profession}
                          onChange={(e) => handleProfessionChange(e.target.value)}
                          className="block w-full text-xs rounded border border-slate-200 py-2.5 pl-9 pr-2 text-slate-900 bg-white font-bold focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                        >
                          <option value="Freelancer / Consultant">Freelancer / Consultant</option>
                          <option value="Software Engineer / Tech">Software Engineer / Tech</option>
                          <option value="Creative Designer / Writer">Creative Designer / Writer</option>
                          <option value="Digital Marketer / Agency">Digital Marketer / Agency</option>
                          <option value="SME Owner / Retailer">SME Owner / Retailer</option>
                          <option value="Handyman / Service Provider">Handyman / Service Provider</option>
                          <option value="Other">Other (Add Custom)</option>
                        </select>
                      </div>

                      {showCustomProfession && (
                        <div className="mt-3">
                          <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            Type your profession
                          </label>
                          <input
                            type="text"
                            required
                            value={customProfession}
                            onChange={(e) => setCustomProfession(e.target.value)}
                            placeholder="e.g. Real Estate Agent or Chef"
                            className="block w-full text-xs rounded border border-indigo-200 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {onboardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">3: Referral Source</h3>
                      <p className="text-[10px] text-slate-400">We are curious to know where you discovered Floate!</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono mb-1.5">
                        Where did you hear about us?
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Building className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={referralSource}
                          onChange={(e) => handleReferralChange(e.target.value)}
                          className="block w-full text-xs rounded border border-slate-200 py-2.5 pl-9 pr-2 text-slate-900 bg-white font-bold focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                        >
                          <option value="Twitter / X">Twitter / X</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Google / Search Engine">Google / Search Engine</option>
                          <option value="Blog or Article">Blog or Article</option>
                          <option value="Friend / Colleague recommendation">Friend / Colleague recommendation</option>
                          <option value="Online Community (Slack, Discord, Facebook)">Online Community (Slack, Discord, Facebook)</option>
                          <option value="Other">Other (Add Custom)</option>
                        </select>
                      </div>

                      {showCustomReferral && (
                        <div className="mt-3">
                          <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            Type custom referral source
                          </label>
                          <input
                            type="text"
                            required
                            value={customReferral}
                            onChange={(e) => setCustomReferral(e.target.value)}
                            placeholder="e.g. YouTube Video or Newsletter"
                            className="block w-full text-xs rounded border border-indigo-200 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {onboardStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">4: Payment Obstacles</h3>
                      <p className="text-[10px] text-slate-400">What is your biggest pain point when collecting payments from clients?</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono mb-1.5">
                        Biggest Payment Request Challenge
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={paymentChallenge}
                          onChange={(e) => handleChallengeChange(e.target.value)}
                          className="block w-full text-xs rounded border border-slate-200 py-2.5 pl-9 pr-2 text-slate-900 bg-white font-bold focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                        >
                          <option value="Clients ignoring my follow-ups">Clients ignoring my follow-ups</option>
                          <option value="Awkwardness of asking for money">Awkwardness of asking for money</option>
                          <option value="No formal contract or proof of work">No formal contract or proof of work</option>
                          <option value="Clients paying late">Clients paying late</option>
                          <option value="Lack of automated reminder system">Lack of automated reminder system</option>
                          <option value="High platform transaction fees">High platform transaction fees</option>
                          <option value="Other">Other (Add Custom)</option>
                        </select>
                      </div>

                      {showCustomChallenge && (
                        <div className="mt-3">
                          <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            Type custom challenge description
                          </label>
                          <input
                            type="text"
                            required
                            value={customChallenge}
                            onChange={(e) => setCustomChallenge(e.target.value)}
                            placeholder="e.g. Complex international wire transfers"
                            className="block w-full text-xs rounded border border-indigo-200 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between space-x-4">
                {onboardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setOnboardStep(onboardStep - 1);
                    }}
                    className="py-2.5 px-4 text-xs font-bold text-slate-500 bg-white hover:text-slate-900 border border-slate-200 rounded uppercase tracking-wider transition hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-900 text-white rounded font-extrabold uppercase tracking-widest text-[9.5px] transition inline-flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Saving Profile...</span>
                  ) : onboardStep < 4 ? (
                    <>
                      <span>Continue to Next Step</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete & Launch Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans relative selection:bg-slate-950 selection:text-white transition-colors duration-300">
      {/* luxury dots bg */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Simple Return Link */}
        <button 
          onClick={onBackToLanding}
          className="inline-flex items-center space-x-2.5 mx-auto group hover:opacity-80 transition cursor-pointer font-sans border-none bg-transparent"
        >
          <img 
            src="https://i.postimg.cc/nzQ7WvPK/20260807-223513.jpg" 
            alt="Floate logo" 
            className="w-7 h-7 object-cover rounded-xs border-2 border-slate-950 shadow-xs" 
            referrerPolicy="no-referrer"
          />
          <span className="font-sans font-black text-slate-950 text-lg tracking-widest uppercase">FLOATE</span>
        </button>

        <h2 className="mt-6 font-sans font-black text-2xl text-slate-950 uppercase tracking-tight">
          {isSignUp ? 'Create your Account' : 'Sign in to Floate'}
        </h2>
        <p className="mt-1 text-xs text-slate-550 max-w-xs mx-auto">
          {isSignUp ? 'Register now to start collecting what is yours' : 'Access your dashboard and invoices'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-lg border border-slate-200/80 sm:px-10">
          
          {isFirestoreOffline && (
            <div id="firestore-offline-alert" className="mb-4 text-xs bg-amber-50 text-amber-900 p-3.5 rounded-md border border-amber-200/60 font-medium space-y-1">
              <strong className="text-[10px] uppercase tracking-wider font-bold block text-amber-800">
                ☁️ Local Isolation Detected (Cloud Offline)
              </strong>
              <p className="text-[11px] text-amber-750 font-sans leading-normal">
                Floate has detected that the cloud database is currently unreachable. You can continue beautifully using our secure, fully-featured **Offline Sandbox Mode** by clicking the **Bypass** button below!
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 text-xs bg-red-50 text-red-900 p-3.5 rounded-md border border-red-150 font-medium space-y-2">
              <p className="font-bold">⚠️ {error}</p>
              <div className="pt-2 border-t border-red-100 flex flex-col gap-2">
                <p className="text-[10px] text-red-800 leading-relaxed font-sans">
                  No action required! You can use our secure <strong>Offline Sandbox Mode</strong> to test all invoice tracking, handshake confirmations, and automated outreach triggers instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const planMapped = selectedPlan === 'ENTERPRISE' ? 'MERCHANT' : selectedPlan;
                    handleSandboxFallback(email || 'sandbox_user@floate.co', name || (email ? email.split('@')[0] : 'Merchant User'), planMapped as 'FREE' | 'HUSTLER' | 'MERCHANT');
                  }}
                  className="w-full text-center py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-white rounded font-extrabold uppercase tracking-widest text-[9px] transition cursor-pointer mt-0.5"
                >
                  ⚡ Bypass via Offline Sandbox Mode
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-5 py-3 px-4 border border-slate-200 rounded-sm text-center bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-50 font-extrabold uppercase tracking-widest text-[10px] transition cursor-pointer active:scale-98 flex items-center justify-center space-x-2.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-extrabold font-mono text-slate-400">
              <span className="bg-white px-2">or use email credentials</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1 font-mono">
                  Your Name
                </label>
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aliko Muhammadu"
                    className="block w-full rounded border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1 font-mono">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. business@company.com"
                  className="block w-full rounded border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">
                  Password
                </label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] text-slate-400 hover:text-slate-900 font-bold uppercase tracking-wider font-mono bg-transparent border-none cursor-pointer">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="pt-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 font-mono">
                  Select Onboarding Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e: any) => setSelectedPlan(e.target.value)}
                  className="block w-full rounded border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 font-bold uppercase"
                >
                  <option value="FREE">Free Tier (₦0/mo) - 1 Debtor limit, Standard SMS</option>
                  <option value="HUSTLER">Hustler Plan (₦12,500/mo) - 10 Debtors, Pidgin language</option>
                  <option value="MERCHANT">Merchant Suite (₦35,000/mo) - Unlimited, AI Voice calls</option>
                  <option value="ENTERPRISE">Enterprise (₦120,000/mo) - Legal layers, API</option>
                </select>
                <p className="mt-1.5 text-[10px] text-slate-400 leading-snug font-medium">
                  Select the plan that fits your business scale. No immediate credit card required during setup.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-sm text-center bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] transition cursor-pointer active:scale-98 flex items-center justify-center space-x-2 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>{isSignUp ? 'Create Account & Log In' : 'Sign In'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Toggle between Signup and Signin */}
          <div className="mt-5 text-center">
            <button
              id="login-toggle-signup"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] text-slate-550 font-extrabold hover:text-slate-955 uppercase tracking-widest bg-transparent border-none cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign in here' : 'Need an account? Sign up here'}
            </button>
          </div>

          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <button 
              type="button"
              onClick={onBackToLanding}
              className="text-[10px] text-slate-400 hover:text-slate-800 transition uppercase tracking-widest font-bold bg-transparent border-none cursor-pointer"
            >
              ← Back to main site
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
