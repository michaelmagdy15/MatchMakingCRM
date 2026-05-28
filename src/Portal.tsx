import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Sparkles, 
  User, 
  Phone, 
  Mail, 
  Facebook, 
  Check, 
  X, 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  LogOut, 
  Loader2, 
  ArrowRight,
  Shield,
  Upload,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Copy,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Filter,
  HelpCircle
} from 'lucide-react';
import { MatchStatus, Match, Client, ClientStatus } from './types';
import { ConfirmDialog } from './components/ConfirmDialog';

interface SecureEphemeralImageProps {
  src: string;
}

function SecureEphemeralImage({ src }: SecureEphemeralImageProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopReveal = () => {
    setHasConsent(false);
    setTimeLeft(5.0);
    setIsImageLoading(true);
    setHasImageError(false);
    setCountdownStarted(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startReveal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setHasConsent(true);
    setTimeLeft(5.0);
    setIsImageLoading(true);
    setHasImageError(false);
    setCountdownStarted(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startCountdown = () => {
    setIsImageLoading(false);
    setCountdownStarted(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    timerRef.current = setTimeout(() => {
      stopReveal();
    }, 5000);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
  };

  const handleLoadError = () => {
    setIsImageLoading(false);
    setHasImageError(true);
  };

  const handleRetry = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsImageLoading(true);
    setHasImageError(false);
    setRetryCount((prev) => prev + 1);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasConsent) return;

    const handleFocusLoss = () => {
      stopReveal();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) ||
        (e.metaKey && e.key === 's' && e.shiftKey) ||
        (e.ctrlKey && e.key === 'p')
      ) {
        stopReveal();
      }
    };

    window.addEventListener('blur', handleFocusLoss);
    document.addEventListener('visibilitychange', handleFocusLoss);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleFocusLoss);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasConsent]);

  const finalSrc = src ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}` : '';

  return (
    <div className="relative flex flex-col items-center justify-center bg-zinc-950/60 border border-white/10 rounded-2xl w-full max-w-[220px] h-64 overflow-hidden select-none">
      {hasConsent ? (
        <div 
          className="relative w-full h-full cursor-none active:cursor-none"
          onPointerUp={stopReveal}
          onPointerLeave={stopReveal}
          onPointerCancel={stopReveal}
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-zinc-950 space-y-2 pointer-events-none">
              <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold animate-pulse">Decrypting photo...</span>
            </div>
          )}

          {hasImageError && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-zinc-950 p-4 text-center space-y-3 pointer-events-auto">
              <AlertCircle className="h-6 w-6 text-rose-500" />
              <p className="text-[10px] text-zinc-400">Secure link decryption timed out.</p>
              <Button 
                onClick={handleRetry}
                size="sm"
                className="h-8 text-[10px] bg-rose-950 text-rose-450 border border-rose-500/20 hover:bg-rose-900/30 rounded-xl px-3 font-bold btn-tactile-rebound"
              >
                Retry Decrypt
              </Button>
            </div>
          )}

          {!hasImageError && (
            <img 
              src={finalSrc} 
              alt="Match partner profile photo" 
              className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              draggable={false}
              onLoad={startCountdown}
              onError={handleLoadError}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserDrag: 'none'
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/80 pointer-events-none" />
          
          <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-[9px] uppercase tracking-widest text-pink-400 font-bold bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 pointer-events-none shadow-lg animate-pulse">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-pink-500 fill-pink-500/25" /> Secure View
            </span>
            <span className="text-zinc-300 font-mono">
              {isImageLoading ? '5.0s' : `${timeLeft.toFixed(1)}s`}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 pointer-events-none space-y-1.5">
            <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100 ease-linear rounded-full" 
                style={{ width: `${(timeLeft / 5) * 100}%` }}
              />
            </div>
            <p className="text-[8px] text-zinc-400 font-medium tracking-widest text-center uppercase animate-pulse">Release cursor to lock</p>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col justify-center items-center text-center p-5 text-zinc-500 space-y-3 cursor-pointer group hover:bg-zinc-950/20 active:bg-zinc-950/40 transition-all select-none touch-none"
          onPointerDown={startReveal}
        >
          <div className="p-3 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/5 text-zinc-400 shadow-inner group-hover:scale-105 group-hover:border-pink-500/25 transition-all duration-300">
            <Lock className="h-6 w-6 text-pink-500/60 animate-pulse group-hover:text-pink-500" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest group-hover:text-pink-400 transition-colors">Press & Hold to Reveal</p>
            <p className="text-[9px] text-zinc-500 leading-relaxed px-1">
              Swap completes dynamically in secure memory. Screenshot block and 5s ephemeral window active.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function convertGoogleDriveLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  const idMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return trimmed;
}

export default function Portal() {
  const { 
    profiles, 
    rawProfiles, 
    matches, 
    updateMatch, 
    updateClient,
    addComment,
    branding,
    addClient,
    favorites,
    announcements,
    messages,
    addFavorite,
    removeFavorite,
    sendChatMessage,
    addMatch
  } = useAppContext();

  // Authentication State
  const [candidate, setCandidate] = useState<Client | null>(() => {
    const saved = localStorage.getItem('portal_candidate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Sync candidate profile updates if base state changes
  const activeCandidate = useMemo(() => {
    if (!candidate) return null;
    const found = rawProfiles.find(p => p.id === candidate.id);
    return found || candidate;
  }, [candidate, rawProfiles]);

  const [loginInput, setLoginInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdvancePrompt, setShowAdvancePrompt] = useState(false);
  const [nextStageAction, setNextStageAction] = useState<(() => void) | null>(null);

  // Post-Date Feedback States
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [dateHappened, setDateHappened] = useState<'yes' | 'no' | null>(null);
  const [chemistryRating, setChemistryRating] = useState<number>(0);
  const [wantsToContinue, setWantsToContinue] = useState<'yes' | 'no' | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [safetyReport, setSafetyReport] = useState(false);
  const [safetyDetails, setSafetyDetails] = useState('');
  const [isHoldActive, setIsHoldActive] = useState(false);

  // Custom Portal Sub-tab States
  const [activePortalTab, setActivePortalTab] = useState<'match' | 'browse' | 'favorites' | 'chat' | 'announcements'>('match');

  // Browse Tab Filters
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseAgeMin, setBrowseAgeMin] = useState('');
  const [browseAgeMax, setBrowseAgeMax] = useState('');
  const [browseResidence, setBrowseResidence] = useState('All');
  const [browseReligion, setBrowseReligion] = useState('All');
  const [browseMaritalStatus, setBrowseMaritalStatus] = useState('All');

  // Support Chat Input
  const [chatInputText, setChatInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Candidate Registration State
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'Female',
    email: '',
    age: '',
    height: '',
    locationOfResidence: '',
    facebookLink: '',
    recentPhoto: '',
    areYouGucian: 'No',
    gucId: '',
    universityFieldOfStudy: '',
    currentJob: '',
    currentFinancialStatus: '',
    religion: 'Muslim',
    religiousDenomination: '',
    prayRegularly: 'Yes',
    hijabPreference: '',
    religiousCommitmentLevel: '',
    maritalStatus: 'Single',
    haveChildren: 'No',
    childrenDetails: '',
    smokeOrDrink: 'No',
    selfIntroduction: '',
    preferredAgeRange: '',
    preferredReligiousDenomination: '',
    believeDutyToProvide: '',
    areOkayWithWifeWorking: '',
    preferOlderOrYounger: '',
    openToLongDistance: 'No',
    willingToRelocate: 'No',
    partnerPreferences: '',
  });

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signUpData.fullName.trim() || !signUpData.phoneNumber.trim() || !signUpData.gender) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const newId = Math.random().toString(36).substr(2, 9);
      
      // Auto-compute next sequential code
      let nextFemaleSuffix = 101;
      let nextMaleSuffix = 101;
      
      rawProfiles.forEach(c => {
        const codeVal = (c.memberId || c.code || '').toString().trim();
        if (!codeVal) return;

        const femaleMatch = codeVal.match(/^[lL](\d+)$/);
        if (femaleMatch) {
          const num = parseInt(femaleMatch[1], 10);
          if (num >= nextFemaleSuffix) {
            nextFemaleSuffix = num + 1;
          }
        }

        const maleMatch = codeVal.match(/^[gG](\d+)$/);
        if (maleMatch) {
          const num = parseInt(maleMatch[1], 10);
          if (num >= nextMaleSuffix) {
            nextMaleSuffix = num + 1;
          }
        }
      });

      const isFemale = signUpData.gender.toLowerCase() === 'female' || signUpData.gender.toLowerCase() === 'lady';
      const code = isFemale ? `L${nextFemaleSuffix}` : `G${nextMaleSuffix}`;
      
      const newCandidate: Client = {
        id: newId,
        name: signUpData.fullName.trim(),
        phone: signUpData.phoneNumber.trim().replace(/[^\d+]/g, ''),
        fullName: signUpData.fullName.trim(),
        phoneNumber: signUpData.phoneNumber.trim().replace(/[^\d+]/g, ''),
        gender: isFemale ? 'Female' : 'Male',
        memberId: code,
        code: code,
        status: 'Pending Review',
        createdAt: new Date().toISOString(),
        comments: [],
        interactions: [],
        lastContactDate: new Date().toISOString(),
        
        email: signUpData.email.trim(),
        age: signUpData.age ? parseInt(signUpData.age, 10) : undefined,
        finalAge: signUpData.age ? parseInt(signUpData.age, 10) : undefined,
        height: signUpData.height,
        locationOfResidence: signUpData.locationOfResidence,
        facebookLink: signUpData.facebookLink,
        recentPhoto: convertGoogleDriveLink(signUpData.recentPhoto),
        areYouGucian: signUpData.areYouGucian,
        gucId: signUpData.areYouGucian === 'Yes' ? signUpData.gucId.trim() : '',
        universityFieldOfStudy: signUpData.universityFieldOfStudy,
        currentJob: signUpData.currentJob,
        currentFinancialStatus: signUpData.currentFinancialStatus,
        religion: signUpData.religion,
        religiousDenomination: signUpData.religiousDenomination,
        prayRegularly: signUpData.prayRegularly,
        hijabPreference: isFemale ? signUpData.hijabPreference : undefined,
        religiousCommitmentLevel: signUpData.religiousCommitmentLevel,
        maritalStatus: signUpData.maritalStatus,
        haveChildren: signUpData.haveChildren,
        childrenDetails: signUpData.haveChildren === 'Yes' ? signUpData.childrenDetails : '',
        smokeOrDrink: signUpData.smokeOrDrink,
        selfIntroduction: signUpData.selfIntroduction,
        preferredAgeRange: signUpData.preferredAgeRange,
        preferredReligiousDenomination: signUpData.preferredReligiousDenomination,
        believeDutyToProvide: signUpData.believeDutyToProvide,
        areOkayWithWifeWorking: signUpData.areOkayWithWifeWorking,
        preferOlderOrYounger: signUpData.preferOlderOrYounger,
        openToLongDistance: signUpData.openToLongDistance,
        willingToRelocate: signUpData.willingToRelocate,
        partnerPreferences: signUpData.partnerPreferences,
      };

      await addClient(newCandidate);
      
      // Auto login newly created client
      setCandidate(newCandidate);
      localStorage.setItem('portal_candidate', JSON.stringify(newCandidate));
      setIsSigningUp(false);
      setSignUpStep(1);
    } catch (e: any) {
      setErrorMsg('Failed to sign up: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Opposite sex browsing logic
  const oppositeSexProfiles = useMemo(() => {
    if (!activeCandidate) return [];
    const myGender = (activeCandidate.gender || '').toLowerCase();
    const isMaleUser = myGender === 'male' || myGender === 'gentleman';
    
    return profiles.filter(p => {
      // Must be approved opposite sex candidate
      const pg = (p.gender || '').toLowerCase();
      const isPartnerMale = pg === 'male' || pg === 'gentleman';
      const isPartnerFemale = pg === 'female' || pg === 'lady';
      
      if (isMaleUser && !isPartnerFemale) return false;
      if (!isMaleUser && !isPartnerMale) return false;
      
      if (p.status !== 'Approved' && p.status !== 'Active') return false;
      if (p.id === activeCandidate.id) return false;

      // Filter by search
      if (browseSearch) {
        const searchVal = browseSearch.toLowerCase();
        const codeMatch = (p.code || '').toLowerCase().includes(searchVal);
        const studyMatch = (p.universityFieldOfStudy || '').toLowerCase().includes(searchVal);
        const jobMatch = (p.currentJob || '').toLowerCase().includes(searchVal);
        const introMatch = (p.selfIntroduction || '').toLowerCase().includes(searchVal);
        if (!codeMatch && !studyMatch && !jobMatch && !introMatch) return false;
      }

      // Filter by age
      const pAge = p.age || p.finalAge || 0;
      if (browseAgeMin && pAge < parseInt(browseAgeMin)) return false;
      if (browseAgeMax && pAge > parseInt(browseAgeMax)) return false;

      // Filter by residence
      if (browseResidence !== 'All' && p.locationOfResidence !== browseResidence) return false;

      // Filter by religion
      if (browseReligion !== 'All' && p.religion !== browseReligion) return false;

      // Filter by marital status
      if (browseMaritalStatus !== 'All' && p.maritalStatus !== browseMaritalStatus) return false;

      return true;
    });
  }, [profiles, activeCandidate, browseSearch, browseAgeMin, browseAgeMax, browseResidence, browseReligion, browseMaritalStatus]);

  const browseLocations = useMemo(() => {
    const locs = profiles.map(p => p.locationOfResidence).filter(Boolean) as string[];
    return Array.from(new Set(locs));
  }, [profiles]);

  const browseReligions = useMemo(() => {
    const rels = profiles.map(p => p.religion).filter(Boolean) as string[];
    return Array.from(new Set(rels));
  }, [profiles]);

  // Support chat scrolling
  useEffect(() => {
    if (activePortalTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePortalTab, messages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeCandidate) return;

    try {
      await sendChatMessage(
        activeCandidate.id,
        activeCandidate.id,
        `Lady ${activeCandidate.code}`, // will display code cleanly
        'client',
        chatInputText.trim()
      );
      setChatInputText('');
    } catch (e: any) {
      alert('Failed to send message: ' + e.message);
    }
  };

  const isFavorited = (profileId: string) => {
    if (!activeCandidate) return false;
    return favorites.some(f => f.userId === activeCandidate.id && f.favoriteProfileId === profileId);
  };

  const handleToggleFavorite = async (profileId: string) => {
    if (!activeCandidate) return;
    if (isFavorited(profileId)) {
      await removeFavorite(profileId, activeCandidate.id);
    } else {
      await addFavorite(profileId, activeCandidate.id);
    }
  };

  const handleRequestMatch = async (partner: Client) => {
    if (!activeCandidate) return;

    // Check if they already have an active match
    if (activeMatch) {
      alert("A user can only have ONE active match process at a time. You already have an active match process!");
      return;
    }

    const partnerActiveMatch = matches.find(m => m.status !== 'UNMATCHED' && (m.maleId === partner.id || m.femaleId === partner.id));
    if (partnerActiveMatch) {
      alert("This candidate is currently participating in an active match process with someone else. We will keep you updated!");
      return;
    }

    const confirmRequest = window.confirm(`Would you like to request a secure match proposal with candidate ${partner.code}? Our matchmakers will evaluate compatibility and coordinate the next steps!`);
    if (!confirmRequest) return;

    setIsLoading(true);
    try {
      const isMale = activeCandidate.gender?.toLowerCase() === 'male' || activeCandidate.gender?.toLowerCase() === 'gentleman';
      await addMatch({
        maleId: isMale ? activeCandidate.id : partner.id,
        maleName: isMale ? activeCandidate.fullName || activeCandidate.name : partner.fullName || partner.name,
        maleProfileApproved: false,
        malePhotoApproved: false,
        maleContactApproved: false,
        femaleId: isMale ? partner.id : activeCandidate.id,
        femaleName: isMale ? partner.fullName || partner.name : activeCandidate.fullName || activeCandidate.name,
        femaleProfileApproved: false,
        femalePhotoApproved: false,
        femaleContactApproved: false,
        gentlemanCode: isMale ? activeCandidate.code || 'G-XXX' : partner.code || 'G-XXX',
        ladyCode: isMale ? partner.code || 'L-XXX' : activeCandidate.code || 'L-XXX',
        status: MatchStatus.PENDING_PROFILE_APPROVAL,
        notes: `Proposed match requested directly by candidate ${activeCandidate.code} from portal.`
      });
      alert(`Match request submitted successfully for candidate ${partner.code}! Your matchmaker has been notified.`);
      setActivePortalTab('match');
    } catch (e: any) {
      alert("Failed to request match: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Find active proposed or processed matches for this candidate
  const activeMatch = useMemo(() => {
    if (!activeCandidate) return null;
    return matches.find(
      m => m.status !== 'UNMATCHED' && 
      (m.maleId === activeCandidate.id || m.femaleId === activeCandidate.id)
    );
  }, [activeCandidate, matches]);

  // Find partner profile details
  const partnerProfile = useMemo(() => {
    if (!activeCandidate || !activeMatch) return null;
    const partnerId = activeMatch.maleId === activeCandidate.id ? activeMatch.femaleId : activeMatch.maleId;
    return rawProfiles.find(p => p.id === partnerId) || null;
  }, [activeCandidate, activeMatch, rawProfiles]);

  // Mask partner details depending on match progression status
  const maskedPartner = useMemo(() => {
    if (!partnerProfile || !activeMatch) return null;
    
    // Mask photos unless both sides approved profiles (Phase 2 or later)
    const photosUnlocked = 
      (activeMatch.maleProfileApproved && activeMatch.femaleProfileApproved) ||
      ['PENDING_PHOTO_APPROVAL', 'PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status);

    // Mask contacts unless both approved photo swaps (Phase 3 or later)
    const contactsUnlocked = 
      (activeMatch.malePhotoApproved && activeMatch.femalePhotoApproved) ||
      ['PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status);

    return {
      ...partnerProfile,
      recentPhoto: photosUnlocked ? partnerProfile.recentPhoto : '',
      phone: contactsUnlocked ? partnerProfile.phone : '[Locked - Awaiting Photo Swap Approval]',
      phoneNumber: contactsUnlocked ? partnerProfile.phoneNumber : '[Locked - Awaiting Photo Swap Approval]',
      email: contactsUnlocked ? partnerProfile.email : '[Locked - Awaiting Photo Swap Approval]',
      facebookLink: contactsUnlocked ? partnerProfile.facebookLink : ''
    };
  }, [partnerProfile, activeMatch]);

  // Handle Candidate Portal Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginInput.trim()) {
      setErrorMsg('Please enter your email or Candidate ID.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const search = loginInput.trim().toLowerCase();
      // Search base clients by code or email
      const found = rawProfiles.find(
        p => p.code?.toLowerCase() === search || p.email?.toLowerCase() === search || p.name?.toLowerCase() === search
      );

      if (found) {
        setCandidate(found);
        localStorage.setItem('portal_candidate', JSON.stringify(found));
        setLoginInput('');
      } else {
        setErrorMsg('Candidate profile not found. Please try another code or email.');
      }
      setIsLoading(false);
    }, 600);
  };

  // Quick select sandbox profiles for developer test ease
  const handleQuickSelect = (code: string) => {
    setErrorMsg('');
    setLoginInput(code);
    setIsLoading(true);
    setTimeout(() => {
      const found = rawProfiles.find(p => p.code?.toLowerCase() === code.toLowerCase());
      if (found) {
        setCandidate(found);
        localStorage.setItem('portal_candidate', JSON.stringify(found));
        setLoginInput('');
      } else {
        setErrorMsg('Sandbox profile not found.');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleLogout = () => {
    setCandidate(null);
    localStorage.removeItem('portal_candidate');
  };

  // Determine current candidate role in the match (Male/Female)
  const candidateGender = useMemo(() => {
    if (!activeCandidate) return null;
    const g = activeCandidate.gender?.toLowerCase() || '';
    if (g === 'male' || g === 'gentleman') return 'Male';
    if (g === 'female' || g === 'lady') return 'Female';
    return null;
  }, [activeCandidate]);

  // Check if candidate already approved current stages
  const selfApprovedProfile = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.maleProfileApproved : activeMatch.femaleProfileApproved;
  }, [activeMatch, candidateGender]);

  const partnerApprovedProfile = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.femaleProfileApproved : activeMatch.maleProfileApproved;
  }, [activeMatch, candidateGender]);

  const selfApprovedPhoto = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.malePhotoApproved : activeMatch.femalePhotoApproved;
  }, [activeMatch, candidateGender]);

  const partnerApprovedPhoto = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.femalePhotoApproved : activeMatch.malePhotoApproved;
  }, [activeMatch, candidateGender]);

  const selfApprovedContact = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.maleContactApproved : activeMatch.femaleContactApproved;
  }, [activeMatch, candidateGender]);

  const partnerApprovedContact = useMemo(() => {
    if (!activeMatch || !candidateGender) return false;
    return candidateGender === 'Male' ? activeMatch.femaleContactApproved : activeMatch.maleContactApproved;
  }, [activeMatch, candidateGender]);

  // Operations: Candidate actions
  const handleApproveTextProfile = async () => {
    if (!activeMatch || !candidateGender || !activeCandidate) return;
    setIsLoading(true);

    const isMale = candidateGender === 'Male';
    const nextApproved = true;
    const partnerApproved = isMale ? activeMatch.femaleProfileApproved : activeMatch.maleProfileApproved;

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleProfileApproved' : 'femaleProfileApproved']: nextApproved,
      };
      
      if (partnerApproved) {
        updates.status = MatchStatus.PENDING_PHOTO_APPROVAL;
      }
      
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved Match #${activeMatch.id} text profile.`, activeCandidate.name);

      if (partnerApproved) {
        await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to PENDING_PHOTO_APPROVAL mutually.`, activeCandidate.name);
        setNextStageAction(null);
        alert("Mutual approval! Both you and your partner have approved the profiles. You can now proceed to the Photo Swap stage.");
      } else {
        alert("Your approval has been saved. We will notify you as soon as your partner approves their side.");
      }
    } catch (e: any) {
      alert('Action failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePhotoSwap = async () => {
    if (!activeMatch || !candidateGender || !activeCandidate) return;

    if (!activeCandidate.recentPhoto) {
      setShowPhotoUpload(true);
      return;
    }

    setIsLoading(true);
    const isMale = candidateGender === 'Male';
    const nextApproved = true;
    const partnerApproved = isMale ? activeMatch.femalePhotoApproved : activeMatch.malePhotoApproved;

    try {
      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
      };
      
      if (partnerApproved) {
        updates.status = MatchStatus.PENDING_CONTACT_SHARE;
      }
      
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved photo swap for Match #${activeMatch.id}.`, activeCandidate.name);

      if (partnerApproved) {
        await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to PENDING_CONTACT_SHARE mutually.`, activeCandidate.name);
        setNextStageAction(null);
        alert("Mutual approval! Both you and your partner have approved the photo swap. You can now view their photo and proceed to contact sharing consent.");
      } else {
        alert("Your photo swap approval has been saved. Awaiting your partner's approval.");
      }
    } catch (e: any) {
      alert('Action failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveContactSwap = async () => {
    if (!activeMatch || !candidateGender || !activeCandidate) return;
    setIsLoading(true);

    const isMale = candidateGender === 'Male';
    const nextApproved = true;
    const partnerApproved = isMale ? activeMatch.femaleContactApproved : activeMatch.maleContactApproved;

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleContactApproved' : 'femaleContactApproved']: nextApproved,
      };
      
      if (partnerApproved) {
        updates.status = MatchStatus.MATCH_ACTIVE;
      }
      
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate unlocked contact information for Match #${activeMatch.id}.`, activeCandidate.name);

      if (partnerApproved) {
        await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to MATCH_ACTIVE mutually.`, activeCandidate.name);
        setNextStageAction(null);
        alert("Mutual contact share approved! Both you and your partner have consented to share coordinates. Phone numbers, emails, and direct WhatsApp links are now fully unlocked below.");
      } else {
        alert("Your contact share consent has been saved. Once your partner also consents, coordinates will unlock instantly.");
      }
    } catch (e: any) {
      alert('Action failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectMatch = async () => {
    if (!activeMatch || !activeCandidate) return;
    const reason = window.prompt("We're sorry to hear that. Please let your matchmaker know why you'd like to pass on this profile (this remains completely anonymous and private):");
    if (reason === null) return; // cancelled

    setIsLoading(true);
    try {
      await updateMatch(activeMatch.id, {
        status: 'UNMATCHED' as MatchStatus,
        notes: (activeMatch.notes || '') + `\n\n[PORTAL FEEDBACK] Pass by ${activeCandidate.code}: ${reason || 'No specific reason provided.'}`
      });
      await addComment(activeCandidate.id, `PORTAL: Candidate passed/rejected Match #${activeMatch.id}. Reason: ${reason || 'No reason.'}`, activeCandidate.name);
    } catch (e: any) {
      alert('Action failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload photo handler (simulated upload saving back to Client record)
  const handlePhotoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim() || !activeCandidate) return;

    setIsLoading(true);
    try {
      await updateClient(activeCandidate.id, {
        recentPhoto: convertGoogleDriveLink(newPhotoUrl)
      });
      setShowPhotoUpload(false);
      setNewPhotoUrl('');
      
      // Auto-trigger photo swap approval once uploaded
      const isMale = candidateGender === 'Male';
      const nextApproved = true;
      const partnerApproved = isMale ? activeMatch!.femalePhotoApproved : activeMatch!.malePhotoApproved;

      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
      };
      
      if (partnerApproved) {
        updates.status = MatchStatus.PENDING_CONTACT_SHARE;
      }
      
      await updateMatch(activeMatch!.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Uploaded profile photo and approved photo swap.`, activeCandidate.name);

      if (partnerApproved) {
        await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch!.id} advanced to PENDING_CONTACT_SHARE mutually.`, activeCandidate.name);
        setNextStageAction(null);
        alert("Mutual approval! Both you and your partner have approved the photo swap. You can now view their photo and proceed to contact sharing consent.");
      } else {
        alert("Your photo has been uploaded and approved. Awaiting your partner's photo approval.");
      }
    } catch (e: any) {
      alert('Failed to save photo: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Clipboard Helper
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Get active dashboard progress percentage
  const progressPercent = useMemo(() => {
    if (!activeMatch) return 0;
    switch (activeMatch.status) {
      case 'PENDING_PROFILE_APPROVAL': return 25;
      case 'PENDING_PHOTO_APPROVAL': return 50;
      case 'PENDING_CONTACT_SHARE': return 75;
      case 'MATCH_ACTIVE': return 100;
      case 'PENDING_FEEDBACK': return 100;
      default: return 0;
    }
  }, [activeMatch]);

  // Calculate matching compatibility report dynamically
  const compatibilityReport = useMemo(() => {
    if (!activeCandidate || !partnerProfile) return null;

    const parseAgeRange = (rangeStr?: string) => {
      if (!rangeStr) return { min: 0, max: 100 };
      const clean = rangeStr.toLowerCase().trim();
      if (clean === 'any' || clean === 'open') return { min: 0, max: 100 };
      
      const match = clean.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
      if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
      
      const underMatch = clean.match(/under\s*(\d+)/);
      if (underMatch) return { min: 0, max: parseInt(underMatch[1]) };
      
      const aboveMatch = clean.match(/(?:above\s*|(\d+)\s*\+)/);
      if (aboveMatch) {
        const val = parseInt(aboveMatch[1] || clean.match(/above\s*(\d+)/)?.[1] || '30');
        return { min: val, max: 100 };
      }
      return { min: 0, max: 100 };
    };

    // 1. Religion Match
    const relCand = (activeCandidate.religion || '').toLowerCase().trim();
    const relPartner = (partnerProfile.religion || '').toLowerCase().trim();
    const religionMatch = relCand === relPartner && relCand.length > 0;

    // 2. Age Preference Match
    const candAgePref = parseAgeRange(activeCandidate.preferredAgeRange);
    const partnerAgePref = parseAgeRange(partnerProfile.preferredAgeRange);
    const candAge = activeCandidate.age || activeCandidate.finalAge || 0;
    const partnerAge = partnerProfile.age || partnerProfile.finalAge || 0;

    const partnerAgeCompatible = partnerAge >= candAgePref.min && partnerAge <= candAgePref.max;
    const candAgeCompatible = candAge >= partnerAgePref.min && candAge <= partnerAgePref.max;
    const ageMatch = partnerAgeCompatible && candAgeCompatible;

    // 3. Location & Relocation Match
    const locCand = (activeCandidate.locationOfResidence || '').toLowerCase().trim();
    const locPartner = (partnerProfile.locationOfResidence || '').toLowerCase().trim();
    const sameLocation = locCand === locPartner && locCand.length > 0;
    const willingToRelocate = 
      (activeCandidate.willingToRelocate || '').toLowerCase() === 'yes' || 
      (partnerProfile.willingToRelocate || '').toLowerCase() === 'yes';
    const locationMatch = sameLocation || willingToRelocate;

    // 4. Hijab Preference Match
    const partnerHijab = (partnerProfile.hijabPreference || '').toLowerCase().trim();
    const candHijabPref = (activeCandidate.hijabPreference || '').toLowerCase().trim();
    
    let hijabMatch = true;
    if (candHijabPref.length > 0 && partnerHijab.length > 0) {
      if (candHijabPref === 'hijab') {
        hijabMatch = partnerHijab === 'hijab';
      } else if (candHijabPref === 'no hijab') {
        hijabMatch = partnerHijab === 'no hijab' || partnerHijab === 'no-hijab';
      }
    }

    let checkedCount = 4;
    let matchCount = 0;
    if (religionMatch) matchCount++;
    if (ageMatch) matchCount++;
    if (locationMatch) matchCount++;
    if (hijabMatch) matchCount++;

    const percent = Math.round((matchCount / checkedCount) * 100);

    return {
      religionMatch,
      ageMatch,
      locationMatch,
      hijabMatch,
      percent,
      sameLocation,
      willingToRelocate,
      candAgePref,
      partnerAgePref,
      candAge,
      partnerAge,
      partnerAgeCompatible,
      candAgeCompatible
    };
  }, [activeCandidate, partnerProfile]);

  // Post-Date Feedback submission with automated risk hold
  const handleSubmitFeedback = async () => {
    if (!activeMatch || !activeCandidate) return;

    setIsLoading(true);
    try {
      if (safetyReport && safetyDetails.trim().length > 0) {
        // Place automated risk hold on active candidate
        await updateClient(activeCandidate.id, {
          status: 'Hold' as ClientStatus
        });
        
        // Log critical security alerts
        await addComment(
          activeCandidate.id, 
          `[CRITICAL SECURITY ALERT] Automated risk hold triggered. Candidate reported safety concern: ${safetyDetails}`, 
          'System Security Guard'
        );

        // Update match status to unmatched
        await updateMatch(activeMatch.id, {
          status: 'UNMATCHED' as MatchStatus,
          notes: (activeMatch.notes || '') + `\n\n[PORTAL SAFETY ALERT] Terminated due to safety concern reported by ${activeCandidate.code}: ${safetyDetails}`
        });

        alert("Your concern has been submitted safely. For your protection, your matchmaker has temporarily placed your account on a safety hold and terminated the active pairing to conduct a full review.");
        setShowFeedbackForm(false);
      } else {
        // Standard feedback submission
        const notesFeedback = `[POST-DATE FEEDBACK] Meeting happened: ${dateHappened || 'N/A'}. Connection rating: ${chemistryRating}/5. Continue matching: ${wantsToContinue || 'N/A'}. Comments: ${feedbackNotes || 'No extra comments.'}`;
        
        await updateMatch(activeMatch.id, {
          status: wantsToContinue === 'no' ? ('UNMATCHED' as MatchStatus) : ('PENDING_FEEDBACK' as MatchStatus),
          notes: (activeMatch.notes || '') + `\n\n` + notesFeedback
        });

        await addComment(
          activeCandidate.id, 
          `PORTAL: Submitted post-date review. Chemistry: ${chemistryRating}/5. Wants to continue: ${wantsToContinue}.`, 
          activeCandidate.name
        );

        alert("Thank you! Your private feedback has been logged securely and sent directly to Sarah.");
        setShowFeedbackForm(false);
      }
    } catch (e: any) {
      alert("Failed to submit feedback: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reactivate queue from safe hold status
  const handleClearHold = async () => {
    if (!activeCandidate) return;
    setIsLoading(true);
    try {
      await updateClient(activeCandidate.id, {
        status: 'Active' as ClientStatus
      });
      alert("Hold requested to be cleared. Your matching queue status is set back to Active.");
    } catch (e: any) {
      alert("Clear hold failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Sandbox Accounts for dropdown selector
  const sandboxList = useMemo(() => {
    return rawProfiles.filter(p => p.code).slice(0, 8);
  }, [rawProfiles]);

  if (!activeCandidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.12_0.02_250)] via-[oklch(0.08_0.01_220)] to-[oklch(0.14_0.03_280)] flex flex-col justify-center items-center px-4 font-sans text-white py-12 relative overflow-hidden">
        {/* Designer ambient glowing spots for depth */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl -z-10 animate-pulse duration-4000" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl -z-10" />

        {isSigningUp ? (
          <Card className="w-full max-w-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-1">
                <Heart className="h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extralight tracking-[0.1em] uppercase text-white font-logo">
                Candidate Registration
              </h2>
              <p className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">
                Step {signUpStep} of 4: {
                  signUpStep === 1 ? 'Core Profile Details' :
                  signUpStep === 2 ? 'Academics & Career' :
                  signUpStep === 3 ? 'Lifestyle & Religion' :
                  'Partner Preferences'
                }
              </p>
            </div>

            {/* Premium Stepper Indicators */}
            <div className="flex justify-between items-center relative py-2 max-w-md mx-auto">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
              <div className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 -translate-y-1/2 z-0 transition-all duration-300" style={{ width: `${(signUpStep - 1) / 3 * 100}%` }} />
              
              {[1, 2, 3, 4].map((stepNum) => (
                <div 
                  key={stepNum} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ${
                    signUpStep >= stepNum 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 scale-105' 
                      : 'bg-zinc-850 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (signUpStep === 4) handleSignUpSubmit(e); }} className="space-y-6 pt-2">
              
              {/* Step 1: Core Details */}
              {signUpStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Full Name <span className="text-pink-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="text" 
                          placeholder="Your full name"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Phone / WhatsApp Number <span className="text-pink-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="text" 
                          placeholder="e.g. +20123456789"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.phoneNumber}
                          onChange={(e) => setSignUpData({...signUpData, phoneNumber: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Gender <span className="text-pink-500">*</span></label>
                      <Select 
                        value={signUpData.gender} 
                        onValueChange={(val) => setSignUpData({...signUpData, gender: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Female">Female (Lady)</SelectItem>
                          <SelectItem value="Male">Male (Gentleman)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Age</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="number" 
                          placeholder="e.g. 25"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.age}
                          onChange={(e) => setSignUpData({...signUpData, age: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Height (cm)</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. 170"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.height}
                        onChange={(e) => setSignUpData({...signUpData, height: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Location of Residence</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="text" 
                          placeholder="e.g. New Cairo, Egypt"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.locationOfResidence}
                          onChange={(e) => setSignUpData({...signUpData, locationOfResidence: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Facebook Link</label>
                      <div className="relative">
                        <Facebook className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="url" 
                          placeholder="https://facebook.com/yourprofile"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.facebookLink}
                          onChange={(e) => setSignUpData({...signUpData, facebookLink: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Photo URL</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="url" 
                          placeholder="https://example.com/your-recent-photo.jpg"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.recentPhoto}
                          onChange={(e) => setSignUpData({...signUpData, recentPhoto: e.target.value})}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-1">Provide a link to a recent photo. Note: Photos are locked and only swapped dynamically after mutual consent in the portal.</p>
                    </div>

                  </div>
                </div>
              )}

              {/* Step 2: Academics & Career */}
              {signUpStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Are you a GUCian?</label>
                      <Select 
                        value={signUpData.areYouGucian} 
                        onValueChange={(val) => setSignUpData({...signUpData, areYouGucian: val, gucId: val === 'No' ? '' : signUpData.gucId})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {signUpData.areYouGucian === 'Yes' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">GUC ID</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. 43-12345"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                          value={signUpData.gucId}
                          onChange={(e) => setSignUpData({...signUpData, gucId: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">University / Field of Study</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500" />
                        <Input 
                          type="text" 
                          placeholder="e.g. Computer Science, Engineering, Business Administration"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.universityFieldOfStudy}
                          onChange={(e) => setSignUpData({...signUpData, universityFieldOfStudy: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Current Job / Profession</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input 
                          type="text" 
                          placeholder="e.g. Software Engineer, Marketing Manager"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-11 shadow-inner"
                          value={signUpData.currentJob}
                          onChange={(e) => setSignUpData({...signUpData, currentJob: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Financial Status</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Stable, Upper Middle, Comfortable"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.currentFinancialStatus}
                        onChange={(e) => setSignUpData({...signUpData, currentFinancialStatus: e.target.value})}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* Step 3: Lifestyle & Religion */}
              {signUpStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Religion</label>
                      <Select 
                        value={signUpData.religion} 
                        onValueChange={(val) => setSignUpData({...signUpData, religion: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Religion" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Muslim">Muslim</SelectItem>
                          <SelectItem value="Christian">Christian</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sect / Denomination</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Sunni, Coptic Orthodox"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.religiousDenomination}
                        onChange={(e) => setSignUpData({...signUpData, religiousDenomination: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pray Regularly?</label>
                      <Select 
                        value={signUpData.prayRegularly} 
                        onValueChange={(val) => setSignUpData({...signUpData, prayRegularly: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="Sometimes">Sometimes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {signUpData.gender === 'Female' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hijab Preference</label>
                        <Select 
                          value={signUpData.hijabPreference} 
                          onValueChange={(val) => setSignUpData({...signUpData, hijabPreference: val})}
                        >
                          <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                            <SelectValue placeholder="Select Hijab Preference" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="Hijab">Hijab</SelectItem>
                            <SelectItem value="No Hijab">No Hijab</SelectItem>
                            <SelectItem value="Turban">Turban</SelectItem>
                            <SelectItem value="Svarf">Scarf</SelectItem>
                            <SelectItem value="Abaya">Abaya</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Religious Commitment Level</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Moderate, Practicing"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.religiousCommitmentLevel}
                        onChange={(e) => setSignUpData({...signUpData, religiousCommitmentLevel: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Marital Status</label>
                      <Select 
                        value={signUpData.maritalStatus} 
                        onValueChange={(val) => setSignUpData({...signUpData, maritalStatus: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Have Children?</label>
                      <Select 
                        value={signUpData.haveChildren} 
                        onValueChange={(val) => setSignUpData({...signUpData, haveChildren: val, childrenDetails: val === 'No' ? '' : signUpData.childrenDetails})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {signUpData.haveChildren === 'Yes' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Children Details</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. One child (age 4)"
                          className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                          value={signUpData.childrenDetails}
                          onChange={(e) => setSignUpData({...signUpData, childrenDetails: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Smoke or Drink?</label>
                      <Select 
                        value={signUpData.smokeOrDrink} 
                        onValueChange={(val) => setSignUpData({...signUpData, smokeOrDrink: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="No">No (Neither)</SelectItem>
                          <SelectItem value="Smoke only">Smoke only</SelectItem>
                          <SelectItem value="Drink only">Drink only</SelectItem>
                          <SelectItem value="Socially">Socially</SelectItem>
                          <SelectItem value="Yes">Yes (Both)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Self Introduction / About Me</label>
                      <textarea 
                        rows={3}
                        placeholder="Introduce yourself to potential matches, highlighting your interests, values, and personality..."
                        className="w-full bg-zinc-950/40 border border-zinc-800 text-white rounded-2xl focus:border-pink-500/50 text-xs p-4 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all placeholder:text-zinc-600"
                        value={signUpData.selfIntroduction}
                        onChange={(e) => setSignUpData({...signUpData, selfIntroduction: e.target.value})}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* Step 4: Partner Preferences */}
              {signUpStep === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Preferred Age Range</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. 23-28"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.preferredAgeRange}
                        onChange={(e) => setSignUpData({...signUpData, preferredAgeRange: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Preferred Sect / Denomination</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Sunni preferred, Orthodox"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.preferredReligiousDenomination}
                        onChange={(e) => setSignUpData({...signUpData, preferredReligiousDenomination: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Open to Long Distance?</label>
                      <Select 
                        value={signUpData.openToLongDistance} 
                        onValueChange={(val) => setSignUpData({...signUpData, openToLongDistance: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Willing to Relocate?</label>
                      <Select 
                        value={signUpData.willingToRelocate} 
                        onValueChange={(val) => setSignUpData({...signUpData, willingToRelocate: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Believe Duty to Provide?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Yes, Shared duty"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.believeDutyToProvide}
                        onChange={(e) => setSignUpData({...signUpData, believeDutyToProvide: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Okay with Spouse Working?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Yes, Absolutely"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.areOkayWithWifeWorking}
                        onChange={(e) => setSignUpData({...signUpData, areOkayWithWifeWorking: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Prefer Older or Younger?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Prefer older, No preference"
                        className="bg-zinc-950/40 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 focus-visible:ring-pink-500/10 text-xs h-12 pl-3 shadow-inner"
                        value={signUpData.preferOlderOrYounger}
                        onChange={(e) => setSignUpData({...signUpData, preferOlderOrYounger: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">General Partner Preferences</label>
                      <textarea 
                        rows={3}
                        placeholder="Describe your ideal partner's characteristics, values, personality, and expectations..."
                        className="w-full bg-zinc-950/40 border border-zinc-800 text-white rounded-2xl focus:border-pink-500/50 text-xs p-4 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all placeholder:text-zinc-600"
                        value={signUpData.partnerPreferences}
                        onChange={(e) => setSignUpData({...signUpData, partnerPreferences: e.target.value})}
                      />
                    </div>

                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-950/30 p-3 rounded-2xl flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" /> {errorMsg}
                </p>
              )}

              {/* Stepper Navigation Buttons */}
              <div className="flex justify-between items-center pt-5 border-t border-white/5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (signUpStep === 1) {
                      setIsSigningUp(false);
                      setErrorMsg('');
                    } else {
                      setSignUpStep(prev => prev - 1);
                    }
                  }}
                  className="border-zinc-800 bg-zinc-950/40 text-xs h-12 px-6 rounded-2xl text-zinc-300 hover:text-white btn-tactile-rebound"
                >
                  Back
                </Button>

                <Button
                  type="button"
                  onClick={(e) => {
                    if (signUpStep < 4) {
                      if (signUpStep === 1) {
                        if (!signUpData.fullName.trim() || !signUpData.phoneNumber.trim()) {
                          setErrorMsg('Full Name and Phone Number are required fields.');
                          return;
                        }
                        setErrorMsg('');
                      }
                      setSignUpStep(prev => prev + 1);
                    } else {
                      handleSignUpSubmit(e);
                    }
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold h-12 px-6 rounded-2xl border-0 shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition-all btn-tactile-rebound"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : signUpStep === 4 ? (
                    <>Complete Registration <Check className="h-4 w-4" /></>
                  ) : (
                    <>Next Step <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center text-[10px] text-zinc-500 flex justify-center items-center gap-1.5 pt-2 border-t border-white/5">
              <Shield className="h-3.5 w-3.5" /> End-to-end encrypted profile security. All rights reserved.
            </div>
          </Card>
        ) : (
          <Card className="w-full max-w-md bg-zinc-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-2">
                <Heart className="h-8 w-8 text-pink-500 fill-pink-500 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extralight tracking-[0.15em] uppercase text-white font-logo">
                {branding.companyName || 'PUREMATCH'}
              </h1>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Secure Candidate Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="loginInput" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Candidate Email or ID Code</label>
                <div className="relative">
                  <Input 
                    id="loginInput"
                    type="text" 
                    placeholder="e.g. L101 or your email address"
                    className="bg-zinc-900/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 pl-4 h-12"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-950/30 p-3 rounded-2xl flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" /> {errorMsg}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl border-0 shadow-lg shadow-pink-500/20 transition-all flex justify-center items-center gap-2 cursor-pointer btn-tactile-rebound"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Enter Portal <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <div className="text-center pt-1">
              <p className="text-xs text-zinc-450">
                New candidate?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSigningUp(true);
                    setSignUpStep(1);
                    setErrorMsg('');
                  }}
                  className="text-pink-400 hover:text-pink-300 font-bold focus:outline-none transition-colors cursor-pointer"
                >
                  Register Profile
                </button>
              </p>
            </div>

            {/* Sandbox Helper Dropdown */}
            {sandboxList.length > 0 && (
              <div className="border-t border-white/5 pt-5 space-y-3">
                <div className="text-center">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
                    Sandbox Testing Mode
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                  Select a seed candidate profile below to simulate portal logins instantly.
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  {sandboxList.map(p => (
                    <Button 
                      key={p.id}
                      variant="outline"
                      size="sm"
                      className="border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white justify-start h-9 rounded-xl truncate btn-tactile-rebound"
                      onClick={() => handleQuickSelect(p.code || '')}
                    >
                      <User className="h-3.5 w-3.5 mr-1.5 opacity-50 shrink-0" />
                      <span className="truncate">{p.code} ({p.gender})</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-[10px] text-zinc-500 flex justify-center items-center gap-1.5 pt-2 border-t border-white/5">
              <Shield className="h-3.5 w-3.5" /> End-to-end encrypted profile security. All rights reserved.
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.12_0.02_250)] via-[oklch(0.08_0.01_220)] to-[oklch(0.14_0.03_280)] font-sans text-white pb-12 relative overflow-hidden">
      {/* Designer background aesthetic blur spheres */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-pink-500/5 blur-3xl -z-10 animate-pulse duration-5000" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="inline-flex p-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-lg">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
            </div>
            <h1 className="text-lg sm:text-xl font-extralight tracking-[0.2em] uppercase font-logo">
              {branding.companyName || 'PUREMATCH'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-right">
              <p className="font-bold text-zinc-200">{activeCandidate.name}</p>
              <p className="text-pink-400 font-semibold tracking-wider text-[10px] uppercase">ID: {activeCandidate.code}</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-destructive hover:bg-zinc-800 h-9 w-9 rounded-xl btn-tactile-rebound" 
              onClick={handleLogout} 
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Safe Hold Warning Alert */}
        {activeCandidate.status === 'Hold' && (
          <Card className="bg-rose-500/10 border border-rose-500/25 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg animate-pulse">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-rose-450 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500" /> Account On Temporary Safe Hold
              </h3>
              <p className="text-xs text-zinc-350 leading-relaxed max-w-xl">
                Your matching profile has been temporarily placed on a safe hold by your matchmaker to review recent feedback or security concerns. Standard matchmaking pipelines are paused.
              </p>
            </div>
            <Button
              onClick={handleClearHold}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-4 rounded-xl text-xs shrink-0 btn-tactile-rebound"
              disabled={isLoading}
            >
              Request Reactivation
            </Button>
          </Card>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-pink-950/20 to-purple-950/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              Salam, {activeCandidate.name}! <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Welcome to your private candidate portal. Review and progress matches with total security.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-450 border-emerald-500/30 px-3.5 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-full shrink-0 shadow-sm">
            {activeCandidate.status}
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-zinc-950/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-1">
          <button 
            onClick={() => setActivePortalTab('match')}
            className={`flex-1 py-3.5 h-12 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer btn-tactile-rebound ${
              activePortalTab === 'match' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Heart className="h-4 w-4 shrink-0" />
            My Match
          </button>
          
          <button 
            onClick={() => setActivePortalTab('browse')}
            className={`flex-1 py-3.5 h-12 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer btn-tactile-rebound ${
              activePortalTab === 'browse' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            Browse Candidates
          </button>

          <button 
            onClick={() => setActivePortalTab('favorites')}
            className={`flex-1 py-3.5 h-12 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer btn-tactile-rebound ${
              activePortalTab === 'favorites' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Lock className="h-4 w-4 shrink-0" />
            My Favorites
          </button>

          <button 
            onClick={() => setActivePortalTab('chat')}
            className={`flex-1 py-3.5 h-12 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer btn-tactile-rebound ${
              activePortalTab === 'chat' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Support Chat
          </button>

          <button 
            onClick={() => setActivePortalTab('announcements')}
            className={`flex-1 py-3.5 h-12 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer btn-tactile-rebound ${
              activePortalTab === 'announcements' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Announcements
          </button>
        </div>

        {/* Tab 1: Match workflow */}
        {activePortalTab === 'match' && (
          <>
            {activeMatch ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Match Roadmap Progress Slider */}
                <Card className="bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-3xl shadow-lg">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
                        <span>Proposed Match Journey</span>
                        <span className="text-pink-400 font-bold">{progressPercent}% Completed</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-950/80 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-700 rounded-full" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold text-zinc-500 uppercase tracking-widest">
                        <span className={activeMatch.status ? "text-indigo-400" : ""}>
                          <span className="hidden xs:inline">1. Profile Text</span>
                          <span className="xs:hidden">1. Text</span>
                        </span>
                        <span className={['PENDING_PHOTO_APPROVAL', 'PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-pink-400" : ""}>
                          <span className="hidden xs:inline">2. Photo Swap</span>
                          <span className="xs:hidden">2. Photo</span>
                        </span>
                        <span className={['PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-amber-400" : ""}>
                          <span className="hidden xs:inline">3. Contact Share</span>
                          <span className="xs:hidden">3. Contact</span>
                        </span>
                        <span className={['MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-emerald-450" : ""}>
                          <span className="hidden xs:inline">4. Active Couple</span>
                          <span className="xs:hidden">4. Active</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* main Match Stage Box */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Partner specifications details card */}
                  <Card className="md:col-span-2 bg-zinc-900/60 border border-white/10 backdrop-blur-2xl overflow-hidden rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                      <CardHeader className="border-b border-white/5 bg-zinc-950/20 p-5 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Heart className="h-4.5 w-4.5 text-pink-500 fill-pink-500" /> Compatible Match Details
                          </CardTitle>
                          <CardDescription className="text-xs font-semibold">
                            Anonymous partner code: <span className="text-pink-450 font-bold uppercase tracking-wider">{maskedPartner?.code || 'G-XXX'}</span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-pink-500/20 text-pink-400 bg-pink-500/5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                          {maskedPartner?.gender}
                        </Badge>
                      </CardHeader>
                      
                      <CardContent className="p-6 space-y-6">
                        {/* Visual Affinity Engine Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-white/5 pb-6">
                          {/* Left: Photo Swap */}
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-505 tracking-widest">Partner Image</span>
                            {maskedPartner?.recentPhoto ? (
                              <SecureEphemeralImage src={convertGoogleDriveLink(maskedPartner.recentPhoto)} />
                            ) : (
                              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 w-full max-w-[220px] h-64 flex flex-col justify-center items-center text-center p-5 text-zinc-500 space-y-3 backdrop-blur-md">
                                <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-zinc-400 shadow-inner">
                                  <Lock className="h-6 w-6 text-pink-500/60 animate-pulse" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-350 uppercase tracking-widest">Photo Locked</p>
                                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Photo swaps occur automatically when both candidates approve text descriptions.</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Conic Gradient Affinity Dial */}
                          {compatibilityReport && (
                            <div className="flex flex-col items-center justify-center space-y-4 p-4 rounded-3xl bg-zinc-950/20 border border-white/5 shadow-inner">
                              <span className="text-[9px] font-black uppercase text-zinc-505 tracking-widest">Affinity Dial</span>
                              
                              <div className="relative w-36 h-36 flex items-center justify-center rounded-full shadow-lg shadow-pink-950/10">
                                {/* Dial Background/Border Glow */}
                                <div 
                                  className="absolute inset-0 rounded-full transition-all duration-1000 p-[3px] animate-in zoom-in duration-500"
                                  style={{
                                    background: `conic-gradient(from 0deg, #ec4899 0%, #8b5cf6 ${compatibilityReport.percent}%, #1f2937 ${compatibilityReport.percent}%)`
                                  }}
                                />
                                {/* Inner circle core */}
                                <div className="absolute inset-[6px] bg-zinc-950 rounded-full flex flex-col items-center justify-center text-center p-2 border border-white/5 shadow-inner">
                                  <span className="text-2xl font-black text-white leading-none tracking-tight">{compatibilityReport.percent}%</span>
                                  <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest mt-1">Match Level</span>
                                  <span className="text-[7px] text-zinc-500 font-semibold uppercase mt-0.5">
                                    {compatibilityReport.percent === 100 ? 'Perfect!' : compatibilityReport.percent >= 75 ? 'Strong' : compatibilityReport.percent >= 50 ? 'Moderate' : 'Low'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 w-full text-[9px] font-bold uppercase tracking-wider text-center">
                                <span className={`px-1.5 py-0.5 rounded border ${compatibilityReport.religionMatch ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 border-rose-500/10 text-rose-455'}`}>Relig</span>
                                <span className={`px-1.5 py-0.5 rounded border ${compatibilityReport.ageMatch ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 border-rose-500/10 text-rose-455'}`}>Age</span>
                                <span className={`px-1.5 py-0.5 rounded border ${compatibilityReport.locationMatch ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 border-rose-500/10 text-rose-455'}`}>Loc</span>
                                <span className={`px-1.5 py-0.5 rounded border ${compatibilityReport.hijabMatch ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 border-rose-500/10 text-rose-455'}`}>Hijab</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Comparative Age Horizontal Sliders */}
                        {compatibilityReport && (
                          <div className="p-4 bg-zinc-950/20 border border-white/5 rounded-2xl space-y-4 shadow-sm">
                            <span className="text-[9px] font-black uppercase text-zinc-555 tracking-widest block">Comparative Age Alignment</span>
                            
                            <div className="space-y-3.5">
                              {/* Slide 1: Partner Age vs Active Candidate Preferred range */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-455 font-bold">
                                  <span>Partner Age ({compatibilityReport.partnerAge} yrs)</span>
                                  <span>Your target: {activeCandidate.preferredAgeRange || 'Any'}</span>
                                </div>
                                <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                  {/* target highlight */}
                                  <div 
                                    className="absolute h-full bg-pink-500/20"
                                    style={{
                                      left: `${Math.max(0, ((compatibilityReport.candAgePref.min - 18) / 32) * 100)}%`,
                                      width: `${Math.min(100, (((compatibilityReport.candAgePref.max - compatibilityReport.candAgePref.min) || 32) / 32) * 100)}%`
                                    }}
                                  />
                                  {/* age marker dot */}
                                  <div 
                                    className={`absolute h-full rounded-full transition-all duration-1000 ${compatibilityReport.partnerAgeCompatible ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, ((compatibilityReport.partnerAge - 18) / 32) * 100))}%` }}
                                  />
                                </div>
                              </div>

                              {/* Slide 2: Active Candidate Age vs Partner Preferred range */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-455 font-bold">
                                  <span>Your Age ({compatibilityReport.candAge} yrs)</span>
                                  <span>Partner target: {partnerProfile.preferredAgeRange || 'Any'}</span>
                                </div>
                                <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                  {/* target highlight */}
                                  <div 
                                    className="absolute h-full bg-purple-500/20"
                                    style={{
                                      left: `${Math.max(0, ((compatibilityReport.partnerAgePref.min - 18) / 32) * 100)}%`,
                                      width: `${Math.min(100, (((compatibilityReport.partnerAgePref.max - compatibilityReport.partnerAgePref.min) || 32) / 32) * 100)}%`
                                    }}
                                  />
                                  {/* age marker dot */}
                                  <div 
                                    className={`absolute h-full rounded-full transition-all duration-1000 ${compatibilityReport.candAgeCompatible ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-zinc-700'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, ((compatibilityReport.candAge - 18) / 32) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Profile Attributes grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <Calendar className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Age & Height</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5">{maskedPartner?.age || maskedPartner?.finalAge || 'N/A'} yrs • {maskedPartner?.height || 'N/A'} cm</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <MapPin className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Residence</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5">{maskedPartner?.locationOfResidence || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <GraduationCap className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Education</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5 truncate max-w-[170px]">{maskedPartner?.universityFieldOfStudy || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <Briefcase className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Occupation</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5 truncate max-w-[170px]">{maskedPartner?.currentJob || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <Shield className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Religion & Sect</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5">{maskedPartner?.religion || 'Muslim'} • {maskedPartner?.religiousDenomination || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                              <Check className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Marital Status</p>
                              <p className="font-bold text-zinc-100 text-xs mt-0.5">{maskedPartner?.maritalStatus || 'Single'}</p>
                            </div>
                          </div>
                        </div>

                        {maskedPartner?.selfIntroduction && (
                          <div className="space-y-2.5 pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">About them</h3>
                            <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-4.5 border border-zinc-800 rounded-2xl shadow-inner italic">
                              "{maskedPartner.selfIntroduction}"
                            </p>
                          </div>
                        )}

                        {maskedPartner?.partnerPreferences && (
                          <div className="space-y-2.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">What they look for in a partner</h3>
                            <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-4.5 border border-zinc-800 rounded-2xl shadow-inner">
                              {maskedPartner.partnerPreferences}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Unlocked Contact Card */}
                    {activeMatch.status === 'MATCH_ACTIVE' && (
                      <div className="mx-6 mb-6 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-md">
                        <div className="flex items-center gap-2 text-emerald-450">
                          <Unlock className="h-5 w-5 animate-bounce shrink-0" />
                          <h4 className="font-bold text-sm">Mutual Match Success! Contacts Shared</h4>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Congratulations! You have both approved photo swap and details exchange. Direct lines are unlocked!
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 overflow-hidden shadow-inner">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <Phone className="h-4.5 w-4.5 text-emerald-450 shrink-0" />
                              <span className="truncate">Phone: <strong>{maskedPartner?.phoneNumber || maskedPartner?.phone}</strong></span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-emerald-450 shrink-0 cursor-pointer rounded-lg hover:bg-emerald-500/10 btn-tactile-rebound"
                              onClick={() => copyToClipboard(maskedPartner?.phoneNumber || maskedPartner?.phone || '', 'phone')}
                            >
                              {copied === 'phone' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 overflow-hidden shadow-inner">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <Mail className="h-4.5 w-4.5 text-emerald-450 shrink-0" />
                              <span className="truncate break-all">Email: <strong>{maskedPartner?.email}</strong></span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-emerald-450 shrink-0 cursor-pointer rounded-lg hover:bg-emerald-500/10 btn-tactile-rebound"
                              onClick={() => copyToClipboard(maskedPartner?.email || '', 'email')}
                            >
                              {copied === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {maskedPartner?.phoneNumber && !maskedPartner.phoneNumber.includes('[Locked') && (
                          <div className="flex justify-center pt-1.5">
                            <Button 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold rounded-xl flex items-center gap-2 text-xs h-11 px-5 shadow-lg shadow-emerald-600/15 cursor-pointer transition-all btn-tactile-rebound"
                              onClick={() => window.open(`https://wa.me/${(maskedPartner.phoneNumber || '').replace(/[^0-9]/g, '')}`, '_blank')}
                            >
                              <MessageCircle className="h-4.5 w-4.5 fill-white text-emerald-650" /> Message via WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Match Approval Dashboard Widget */}
                  <div className="space-y-6">
                    <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 shadow-xl">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                        <Shield className="h-4.5 w-4.5" /> Match Actions
                      </h3>
                      <p className="text-xs text-zinc-450 leading-relaxed border-b border-white/5 pb-3">
                        Your matchmaker handles secure introductions step-by-step. Both candidates must approve to proceed.
                      </p>

                      <div className="space-y-4 pt-1">
                        {/* Phase 1: Text Profile Approval */}
                        {activeMatch.status === 'PENDING_PROFILE_APPROVAL' && (
                          <div className="space-y-3">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 1: Description Review</Badge>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              Review the profile text above. If you're interested to swap photos with this candidate, select Approve.
                            </p>
                            
                            {selfApprovedProfile ? (
                              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-indigo-300 font-semibold shadow-inner leading-relaxed">
                                <Check className="h-5 w-5 bg-indigo-500 text-white rounded-full p-0.5 shrink-0" />
                                <span>Description approved! Awaiting partner decision...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 pt-1.5">
                                <Button 
                                  onClick={handleRejectMatch}
                                  variant="outline" 
                                  className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer btn-tactile-rebound"
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                                </Button>
                                <Button 
                                  onClick={handleApproveTextProfile}
                                  className="bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all btn-tactile-rebound"
                                  disabled={isLoading}
                                >
                                  <Check className="h-4 w-4 mr-1 shrink-0" /> Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Phase 2: Photo Swap Approval */}
                        {activeMatch.status === 'PENDING_PHOTO_APPROVAL' && (
                          <div className="space-y-3">
                            <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 2: Photo Introductions</Badge>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              Great! Description review is mutual. Now, swap photos by providing your photo link and approving photo swap.
                            </p>

                            {!activeCandidate.recentPhoto && (
                              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-2.5 text-xs text-amber-300 shadow-inner leading-relaxed">
                                <p className="font-bold flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-amber-400 shrink-0" /> Photo URL Required</p>
                                <p className="text-[10px] text-zinc-450 leading-relaxed">You must provide an image URL before initiating the secure swap.</p>
                                <Button 
                                  onClick={() => setShowPhotoUpload(true)} 
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700 text-white w-full border-none h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all btn-tactile-rebound"
                                >
                                  <Upload className="h-4.5 w-4.5 mr-1" /> Upload Profile Photo
                                </Button>
                              </div>
                        )}

                            {activeCandidate.recentPhoto && (
                              <>
                                {selfApprovedPhoto ? (
                                  <div className="bg-pink-500/10 border border-pink-500/20 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-pink-300 font-semibold shadow-inner leading-relaxed">
                                    <Check className="h-5 w-5 bg-pink-500 text-white rounded-full p-0.5 shrink-0" />
                                    <span>Photo swap approved! Awaiting partner...</span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3 pt-1.5">
                                    <Button 
                                      onClick={handleRejectMatch}
                                      variant="outline" 
                                      className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer btn-tactile-rebound"
                                      disabled={isLoading}
                                    >
                                      <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                                    </Button>
                                    <Button 
                                      onClick={handleApprovePhotoSwap}
                                      className="bg-pink-650 hover:bg-pink-755 text-white text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all btn-tactile-rebound"
                                      disabled={isLoading}
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1 shrink-0" /> Swap Photo
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Phase 3: Contact Swap */}
                        {activeMatch.status === 'PENDING_CONTACT_SHARE' && (
                          <div className="space-y-3">
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 3: Secure Contact Swap</Badge>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              Mutual photos approved! Choose Share Details to unlock contacts exchange and speak directly.
                            </p>

                            {selfApprovedContact ? (
                              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-300 font-semibold shadow-inner leading-relaxed">
                                <Check className="h-5 w-5 bg-amber-550 text-zinc-950 rounded-full p-0.5 shrink-0" />
                                <span>Details shared! Awaiting partner...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 pt-1.5">
                                <Button 
                                  onClick={handleRejectMatch}
                                  variant="outline" 
                                  className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer btn-tactile-rebound"
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                                </Button>
                                <Button 
                                  onClick={handleApproveContactSwap}
                                  className="bg-amber-550 hover:bg-amber-600 text-zinc-950 text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all btn-tactile-rebound"
                                  disabled={isLoading}
                                >
                                  <Phone className="h-4 w-4 mr-1 shrink-0" /> Share Details
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Phase 4: Success matched couple */}
                        {activeMatch.status === 'MATCH_ACTIVE' && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300 space-y-2 shadow-inner leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5 text-sm text-emerald-450"><Sparkles className="h-5 w-5 animate-bounce shrink-0" /> Match Active!</p>
                            <p className="text-[10px] text-zinc-400">
                              Mutual contact exchange unlocked! Speak directly using the WhatsApp link.
                            </p>
                          </div>
                        )}

                        {/* Post-Date Feedback Widget */}
                        {(activeMatch.status === 'MATCH_ACTIVE' || activeMatch.status === 'PENDING_FEEDBACK') && (
                          <div className="pt-2">
                            {showFeedbackForm ? (
                              <Card className="bg-zinc-950/60 border border-white/10 rounded-2xl p-4.5 space-y-4 shadow-lg">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4" /> Post-Date Secure Review
                                  </h4>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowFeedbackForm(false)} 
                                    className="h-7 px-2 text-[10px] text-zinc-400 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                </div>

                                <div className="space-y-4 text-xs">
                                  {/* Q1: Did it happen */}
                                  <div className="space-y-1.5">
                                    <Label className="text-zinc-300 font-semibold">Did your personal meeting / date take place?</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        type="button"
                                        variant={dateHappened === 'yes' ? 'default' : 'outline'}
                                        onClick={() => setDateHappened('yes')}
                                        className={`h-9 text-xs rounded-xl ${dateHappened === 'yes' ? 'bg-pink-650 hover:bg-pink-700 text-white' : 'border-zinc-800 text-zinc-400'}`}
                                      >
                                        Yes, we met
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={dateHappened === 'no' ? 'default' : 'outline'}
                                        onClick={() => setDateHappened('no')}
                                        className={`h-9 text-xs rounded-xl ${dateHappened === 'no' ? 'bg-pink-650 hover:bg-pink-700 text-white' : 'border-zinc-800 text-zinc-400'}`}
                                      >
                                        No, not yet
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Q2: Chemistry Rating */}
                                  <div className="space-y-1.5">
                                    <Label className="text-zinc-300 font-semibold">Rate your connection / chemistry:</Label>
                                    <div className="flex justify-center gap-2.5 py-1">
                                      {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => setChemistryRating(val)}
                                          className="text-2xl focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                        >
                                          <Heart 
                                            className={`h-7 w-7 transition-colors ${
                                              val <= chemistryRating 
                                                ? 'text-pink-500 fill-pink-500 animate-pulse' 
                                                : 'text-zinc-600 hover:text-pink-500/40'
                                            }`} 
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Q3: Wants to continue */}
                                  <div className="space-y-1.5">
                                    <Label className="text-zinc-300 font-semibold">Would you like to keep matching with this candidate?</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        type="button"
                                        variant={wantsToContinue === 'yes' ? 'default' : 'outline'}
                                        onClick={() => setWantsToContinue('yes')}
                                        className={`h-9 text-xs rounded-xl ${wantsToContinue === 'yes' ? 'bg-emerald-650 hover:bg-emerald-700 text-white' : 'border-zinc-800 text-zinc-400'}`}
                                      >
                                        Yes, proceed
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={wantsToContinue === 'no' ? 'default' : 'outline'}
                                        onClick={() => setWantsToContinue('no')}
                                        className={`h-9 text-xs rounded-xl ${wantsToContinue === 'no' ? 'bg-rose-650 hover:bg-rose-700 text-white' : 'border-zinc-800 text-zinc-400'}`}
                                      >
                                        No, see others
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Feedback comments */}
                                  <div className="space-y-1.5">
                                    <Label className="text-zinc-300 font-semibold">Private Comments for Sarah (Anonymous):</Label>
                                    <Input
                                      value={feedbackNotes}
                                      onChange={(e) => setFeedbackNotes(e.target.value)}
                                      placeholder="Share what went well or where interests differed..."
                                      className="bg-zinc-900 border-zinc-800 text-xs rounded-xl text-white pl-3"
                                    />
                                  </div>

                                  {/* Safety issue trigger */}
                                  <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="checkbox" 
                                        id="safetyReport" 
                                        checked={safetyReport}
                                        onChange={(e) => setSafetyReport(e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-800 text-pink-500 focus:ring-pink-500 bg-zinc-900"
                                      />
                                      <label htmlFor="safetyReport" className="text-[10px] text-zinc-350 font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5 text-rose-500" /> Report safety or policy concern
                                      </label>
                                    </div>

                                    {safetyReport && (
                                      <div className="space-y-1.5 animate-in slide-in-from-top duration-300">
                                        <Label className="text-rose-400 font-bold">Describe your concern (Mandatory & Confidential):</Label>
                                        <Input
                                          value={safetyDetails}
                                          onChange={(e) => setSafetyDetails(e.target.value)}
                                          placeholder="Report behavioral, safety, or verification issues..."
                                          className="bg-zinc-900 border-rose-950 text-xs rounded-xl text-white focus:border-rose-500 pl-3"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Submit button */}
                                  <Button
                                    onClick={handleSubmitFeedback}
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-11 rounded-xl text-xs shadow-md cursor-pointer transition-all btn-tactile-rebound"
                                    disabled={isLoading || (safetyReport && !safetyDetails.trim()) || !dateHappened || !wantsToContinue}
                                  >
                                    Submit Secure Review
                                  </Button>
                                </div>
                              </Card>
                            ) : (
                              <Button 
                                onClick={() => {
                                  setDateHappened(null);
                                  setChemistryRating(0);
                                  setWantsToContinue(null);
                                  setFeedbackNotes('');
                                  setSafetyReport(false);
                                  setSafetyDetails('');
                                  setShowFeedbackForm(true);
                                }}
                                className="w-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/15 hover:to-purple-500/15 border border-pink-500/20 text-pink-450 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm btn-tactile-rebound"
                              >
                                <Sparkles className="h-4 w-4" /> Share Post-Date Review
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-3.5 shadow-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Matchmaker Info</h4>
                      <div className="space-y-2 text-xs text-zinc-400 border-t border-white/5 pt-3">
                        <p className="flex justify-between"><span>Assigned Admin:</span> <strong className="text-zinc-200 font-semibold">{activeMatch?.responsibleAdminName || 'Sarah'}</strong></p>
                        <p className="flex justify-between"><span>Match Proposed:</span> <strong className="text-zinc-200 font-semibold">{new Date(activeMatch.createdAt).toLocaleDateString()}</strong></p>
                      </div>
                    </Card>
                  </div>

                </div>
              </div>
            ) : (
              <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[320px] shadow-xl animate-in fade-in duration-300">
                <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-full mb-2">
                  <Heart className="h-10 w-10 text-pink-400 opacity-60 animate-pulse" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">No Active Proposed Matches</h3>
                <p className="text-xs sm:text-sm text-zinc-450 max-w-md leading-relaxed">
                  Your personal matchmaker is currently searching the directory for highly compatible candidates. We will present potential partners here once locked!
                </p>
                <div className="pt-4 text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 border-t border-white/5 w-full justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-400" /> Pairing compatible cards shortly
                </div>
              </Card>
            )}
          </>
        )}

        {/* Tab 2: Anonymous Browsing & Filtering */}
        {activePortalTab === 'browse' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Elegant glass filters bar */}
            <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <Filter className="h-4.5 w-4.5" /> Anonymous Directory Filters
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Age Range</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      value={browseAgeMin} 
                      onChange={e => setBrowseAgeMin(e.target.value)} 
                      className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl"
                    />
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={browseAgeMax} 
                      onChange={e => setBrowseAgeMax(e.target.value)} 
                      className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Location</Label>
                  <Select value={browseResidence} onValueChange={setBrowseResidence}>
                    <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl">
                      <SelectValue placeholder="All Residences" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="All">All Residences</SelectItem>
                      {browseLocations.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Religion</Label>
                  <Select value={browseReligion} onValueChange={setBrowseReligion}>
                    <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl">
                      <SelectValue placeholder="All Religions" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="All">All Religions</SelectItem>
                      {browseReligions.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Marital Status</Label>
                  <Select value={browseMaritalStatus} onValueChange={setBrowseMaritalStatus}>
                    <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Keywords Search</Label>
                  <Input 
                    type="text" 
                    placeholder="Search study, job description, etc..." 
                    value={browseSearch} 
                    onChange={e => setBrowseSearch(e.target.value)} 
                    className="bg-zinc-950/40 border-zinc-800 text-xs h-10 rounded-xl"
                  />
                </div>
              </div>
            </Card>

            {/* Profiles directory grid */}
            {oppositeSexProfiles.length === 0 ? (
              <Card className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                <HelpCircle className="h-8 w-8 text-zinc-650" />
                <h4 className="font-bold text-sm">No Matching Anonymous Profiles</h4>
                <p className="text-xs text-zinc-500 max-w-sm">No opposite-sex candidates matched your selected filter parameters. Clear filters to browse again.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {oppositeSexProfiles.map(profile => {
                  const fav = isFavorited(profile.id);
                  return (
                    <Card key={profile.id} className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 flex flex-col justify-between hover:border-pink-500/20 hover:bg-zinc-900/80 transition-all shadow-xl group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400">Anonymous Card</span>
                            <h4 className="font-black text-white text-base mt-0.5">{profile.code || 'C-XXX'}</h4>
                          </div>
                          <Badge variant="outline" className="border-pink-500/20 text-pink-400 bg-pink-500/5 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider">{profile.religion || 'Muslim'}</Badge>
                        </div>

                        {/* Anonymous Specs Grid */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-xs text-zinc-300">
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Age & Height</span>
                            <strong>{profile.age || profile.finalAge || 'N/A'} yrs • {profile.height || 'N/A'} cm</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Residence</span>
                            <strong>{profile.locationOfResidence || 'N/A'}</strong>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">University / Study</span>
                            <strong className="truncate block max-w-[200px]">{profile.universityFieldOfStudy || 'N/A'}</strong>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Current Job</span>
                            <strong className="truncate block max-w-[200px]">{profile.currentJob || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Marital Status</span>
                            <strong>{profile.maritalStatus || 'Single'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Have Children?</span>
                            <strong>{profile.haveChildren || 'No'}</strong>
                          </div>
                        </div>

                        {profile.selfIntroduction && (
                          <div className="space-y-1 pb-1">
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Self Introduction</span>
                            <p className="text-[11px] leading-relaxed text-zinc-400 italic bg-zinc-950/40 p-3 border border-zinc-800 rounded-xl truncate">
                              "{profile.selfIntroduction}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="grid grid-cols-5 gap-2 pt-4 border-t border-white/5 mt-4">
                        <Button 
                          onClick={() => handleToggleFavorite(profile.id)}
                          variant="outline" 
                          className={`col-span-1 border-zinc-800 h-12 rounded-xl shrink-0 cursor-pointer btn-tactile-rebound ${
                            fav ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20' : 'bg-zinc-950/40 hover:bg-zinc-800 hover:text-white text-zinc-400'
                          }`}
                        >
                          <Heart className={`h-4.5 w-4.5 shrink-0 ${fav ? 'fill-pink-500' : ''}`} />
                        </Button>
                        <Button 
                          onClick={() => handleRequestMatch(profile)}
                          className="col-span-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs h-12 rounded-xl border-none shadow-md shadow-pink-500/10 cursor-pointer shrink-0 btn-tactile-rebound"
                        >
                          Request a Match
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Favorites */}
        {activePortalTab === 'favorites' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-purple-950/20 via-background to-pink-950/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <Heart className="h-4.5 w-4.5 fill-pink-500" /> Favorited Candidates
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                A saved repository of profiles you find compatible. You can initiate match requests directly. Names and direct contact channels remain fully encrypted until mutually approved.
              </p>
            </div>

            {favorites.filter(f => f.userId === activeCandidate.id).length === 0 ? (
              <Card className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                <Heart className="h-8 w-8 text-zinc-650 animate-pulse" />
                <h4 className="font-bold text-sm">No Saved Favorites</h4>
                <p className="text-xs text-zinc-500 max-w-sm">Browse approved candidates in the Anonymous Browse tab and click the Heart icon to add them here.</p>
                <Button 
                  onClick={() => setActivePortalTab('browse')}
                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer btn-tactile-rebound"
                >
                  Browse Candidates
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {favorites.filter(f => f.userId === activeCandidate.id).map(fav => {
                  const profile = profiles.find(p => p.id === fav.favoriteProfileId);
                  if (!profile) return null;
                  return (
                    <Card key={profile.id} className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 flex flex-col justify-between hover:border-pink-500/20 transition-all shadow-xl">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400">Anonymous Card</span>
                            <h4 className="font-black text-white text-base mt-0.5">{profile.code || 'C-XXX'}</h4>
                          </div>
                          <Badge variant="outline" className="border-pink-500/20 text-pink-400 bg-pink-500/5 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider">{profile.religion || 'Muslim'}</Badge>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-zinc-300">
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Age & Height</span>
                            <strong>{profile.age || profile.finalAge || 'N/A'} yrs • {profile.height || 'N/A'} cm</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Residence</span>
                            <strong>{profile.locationOfResidence || 'N/A'}</strong>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Studies</span>
                            <strong className="truncate block max-w-[200px]">{profile.universityFieldOfStudy || 'N/A'}</strong>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Current Job</span>
                            <strong className="truncate block max-w-[200px]">{profile.currentJob || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Marital Status</span>
                            <strong>{profile.maritalStatus || 'Single'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-black tracking-widest">Saved At</span>
                            <strong>{new Date(fav.createdAt).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-5 gap-2 pt-4 border-t border-white/5 mt-4">
                        <Button 
                          onClick={() => handleToggleFavorite(profile.id)}
                          variant="outline" 
                          className="col-span-1 border-zinc-800 h-12 rounded-xl bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20 shrink-0 cursor-pointer btn-tactile-rebound"
                        >
                          <Heart className="h-4.5 w-4.5 fill-pink-500 shrink-0" />
                        </Button>
                        <Button 
                          onClick={() => handleRequestMatch(profile)}
                          className="col-span-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs h-12 rounded-xl border-none shadow-md shadow-pink-500/10 cursor-pointer shrink-0 btn-tactile-rebound"
                        >
                          Request a Match
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Direct Chat Hub */}
        {activePortalTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Matchmaking Support Chat</h3>
                    <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> Active Team Direct
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-pink-500/20 text-pink-450 text-[9px] uppercase font-bold tracking-widest py-0.5 rounded-full">Encrypted</Badge>
              </div>

              {/* Chat messages viewport */}
              <ScrollArea className="flex-1 bg-zinc-950/20">
                <div className="p-5 space-y-4">
                  {messages.filter(m => m.profileId === activeCandidate.id).length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center p-6 text-zinc-500 space-y-3 min-h-[300px]">
                      <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5">
                        <MessageCircle className="h-6 w-6 text-pink-500/60" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No Previous Conversations</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs">
                          Welcome to GUC Matchmaking! Send a message below to connect directly with matchmakers Sarah and Ahmed. Ask questions, clarify preferences, or coordinate matches safely!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.filter(m => m.profileId === activeCandidate.id).map(msg => {
                        const isSelf = msg.senderId === activeCandidate.id || msg.senderRole === 'client';
                        let displayName = msg.senderName;
                        if (!isSelf && msg.senderRole === 'admin') {
                          const emailLower = (msg.senderEmail || '').toLowerCase();
                          if (emailLower === 'eman.matchhub@gmail.com') {
                            displayName = 'Admin Truth';
                          } else if (emailLower === 'arwa.matchhub@gmail.com') {
                            displayName = 'Admin Hope';
                          } else if (emailLower === 'michaelmitry13@gmail.com') {
                            displayName = 'Admin Grace';
                          }
                        }
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[80%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                              <span>{displayName}</span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isSelf 
                                ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white rounded-tr-none border-0' 
                                : 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tl-none'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="p-3.5 border-t border-white/5 bg-zinc-950/40 flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Ask a question or reply to your matchmaker..." 
                  value={chatInputText} 
                  onChange={e => setChatInputText(e.target.value)} 
                  className="bg-zinc-900 border-zinc-800 text-white rounded-xl focus:border-pink-500/40 text-xs h-11 shadow-inner pl-4 flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!chatInputText.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold h-11 px-5 rounded-xl border-none shadow-md shadow-pink-500/25 cursor-pointer shrink-0 transition-all flex items-center justify-center btn-tactile-rebound"
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Tab 5: Broadcast Announcements */}
        {activePortalTab === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-purple-950/20 via-background to-pink-950/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5" /> Broadcast Center
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Rules, safety regulations, and community announcements broadcasted by the Matchmaking Supervisor Sarah and operational managers Youssef. Keep active checks here.
              </p>
            </div>

            {announcements.length === 0 ? (
              <Card className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                <AlertCircle className="h-8 w-8 text-zinc-650 animate-bounce" />
                <h4 className="font-bold text-sm">No Broadcasts Active</h4>
                <p className="text-xs text-zinc-500 max-w-sm">No global updates or community rules have been broadcasted by admins yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map(ann => (
                  <Card key={ann.id} className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 shadow-xl hover:border-pink-500/10 transition-all">
                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-base">{ann.title}</h4>
                        <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest mt-0.5">Broadcasted by Matchmaker {ann.createdByName}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">{ann.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Photo upload modal dialog */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm bg-zinc-900 border border-white/10 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3.5 border-b border-white/5">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><ImageIcon className="h-4.5 w-4.5 text-pink-400" /> Upload Profile Photo</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowPhotoUpload(false)} 
                className="h-8 w-8 text-zinc-400 hover:text-white rounded-full btn-tactile-rebound"
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>
            <form onSubmit={handlePhotoUploadSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="photoUrl" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Direct Photo URL</label>
                <Input 
                  id="photoUrl"
                  type="url" 
                  placeholder="https://example.com/your-photo.jpg" 
                  className="bg-zinc-950 border-zinc-800 text-white rounded-xl focus:border-pink-500/40 text-xs h-12 shadow-inner pl-4"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  required
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  To participate in photo swaps, please paste a valid image URL. Note: Swapping is strictly locked and only completed in secure view after mutual consent.
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-12 rounded-xl border-none shadow-lg shadow-pink-500/25 transition-all cursor-pointer btn-tactile-rebound"
                disabled={isLoading}
              >
                Save & Swap Photo
              </Button>
            </form>
          </Card>
        </div>
      )}

      
      <ConfirmDialog
        isOpen={showAdvancePrompt}
        onOpenChange={setShowAdvancePrompt}
        title="Stage approved"
        description="Do you want to move to the next stage?"
        onConfirm={() => {
          if (nextStageAction) {
            nextStageAction();
          }
        }}
        confirmText="Yes"
        cancelText="No"
        variant="default"
      />
    </div>
  );
}
