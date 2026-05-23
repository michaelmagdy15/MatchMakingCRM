import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  MoreHorizontal
} from 'lucide-react';
import { MatchStatus, Match, Client } from './types';
import { ConfirmDialog } from './components/ConfirmDialog';

export default function Portal() {
  const { 
    profiles, 
    rawProfiles, 
    matches, 
    updateMatch, 
    updateClient,
    addComment,
    branding,
    addClient
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
  const [loginInput, setLoginInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdvancePrompt, setShowAdvancePrompt] = useState(false);
  const [nextStageAction, setNextStageAction] = useState<(() => void) | null>(null);

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
        recentPhoto: signUpData.recentPhoto.trim(),
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

  // Sync candidate profile updates if base state changes
  const activeCandidate = useMemo(() => {
    if (!candidate) return null;
    const found = rawProfiles.find(p => p.id === candidate.id);
    return found || candidate;
  }, [candidate, rawProfiles]);

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

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleProfileApproved' : 'femaleProfileApproved']: nextApproved,
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved Match #${activeMatch.id} text profile.`, activeCandidate.name);

      setNextStageAction(() => async () => {
        setIsLoading(true);
        try {
          await updateMatch(activeMatch.id, { status: MatchStatus.PENDING_PHOTO_APPROVAL });
          await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to PENDING_PHOTO_APPROVAL.`, activeCandidate.name);
        } catch (e: any) {
          alert('Failed to advance stage: ' + e.message);
        } finally {
          setIsLoading(false);
        }
      });
      setShowAdvancePrompt(true);
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

    try {
      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved photo swap for Match #${activeMatch.id}.`, activeCandidate.name);

      setNextStageAction(() => async () => {
        setIsLoading(true);
        try {
          await updateMatch(activeMatch.id, { status: MatchStatus.PENDING_CONTACT_SHARE });
          await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to PENDING_CONTACT_SHARE.`, activeCandidate.name);
        } catch (e: any) {
          alert('Failed to advance stage: ' + e.message);
        } finally {
          setIsLoading(false);
        }
      });
      setShowAdvancePrompt(true);
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

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleContactApproved' : 'femaleContactApproved']: nextApproved,
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate unlocked contact information for Match #${activeMatch.id}.`, activeCandidate.name);

      setNextStageAction(() => async () => {
        setIsLoading(true);
        try {
          await updateMatch(activeMatch.id, { status: MatchStatus.MATCH_ACTIVE });
          await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch.id} advanced to MATCH_ACTIVE.`, activeCandidate.name);
        } catch (e: any) {
          alert('Failed to advance stage: ' + e.message);
        } finally {
          setIsLoading(false);
        }
      });
      setShowAdvancePrompt(true);
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
        recentPhoto: newPhotoUrl.trim()
      });
      setShowPhotoUpload(false);
      setNewPhotoUrl('');
      
      // Auto-trigger photo swap approval once uploaded
      const isMale = candidateGender === 'Male';
      const nextApproved = true;

      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
      };
      await updateMatch(activeMatch!.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Uploaded profile photo and approved photo swap.`, activeCandidate.name);

      setNextStageAction(() => async () => {
        setIsLoading(true);
        try {
          await updateMatch(activeMatch!.id, { status: MatchStatus.PENDING_CONTACT_SHARE });
          await addComment(activeCandidate.id, `PORTAL: Match #${activeMatch!.id} advanced to PENDING_CONTACT_SHARE.`, activeCandidate.name);
        } catch (e: any) {
          alert('Failed to advance stage: ' + e.message);
        } finally {
          setIsLoading(false);
        }
      });
      setShowAdvancePrompt(true);
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
                  className="border-zinc-800 bg-zinc-950/40 text-xs h-12 px-6 rounded-2xl text-zinc-300 hover:text-white"
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
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold h-12 px-6 rounded-2xl border-0 shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition-all"
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
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl border-0 shadow-lg shadow-pink-500/20 transition-all flex justify-center items-center gap-2 cursor-pointer"
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
                      className="border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white justify-start h-9 rounded-xl truncate"
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
              className="border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-destructive hover:bg-zinc-800 h-9 w-9 rounded-xl" 
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

        {/* Portal Match Progression State Monitor */}
        {activeMatch ? (
          <div className="space-y-6">
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
                  {/* Optimized text for mobile viewports */}
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
              
              {/* Partner specifications details card (Left/Middle Spanning 2 cols) */}
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
                    {/* Photo Display depending on stage */}
                    <div className="flex justify-center border-b border-white/5 pb-6">
                      {maskedPartner?.recentPhoto ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-white/15 shadow-2xl w-full max-w-[220px] h-64 bg-zinc-950 flex items-center justify-center transition-all hover:scale-[1.02]">
                          <img 
                            src={maskedPartner.recentPhoto} 
                            alt="Match partner profile photo" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Swapped Profile Photo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/30 w-full max-w-[220px] h-64 flex flex-col justify-center items-center text-center p-5 text-zinc-500 space-y-3 backdrop-blur-md">
                          <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-zinc-400 shadow-inner">
                            <Lock className="h-6 w-6 text-pink-500/60" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Photo Locked</p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Photo swaps occur automatically when both candidates approve text descriptions.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Profile Attributes grid - Stacks on small devices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                        <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                          <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Age</p>
                          <p className="font-bold text-zinc-200">{maskedPartner?.age} Years old</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                        <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Location / Region</p>
                          <p className="font-bold text-zinc-200">{maskedPartner?.locationOfResidence || 'Cairo, Egypt'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                        <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Education / Field</p>
                          <p className="font-bold text-zinc-200 truncate">{maskedPartner?.universityFieldOfStudy || 'Bachelor of Science'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                        <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10 shrink-0">
                          <Briefcase className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Job Title</p>
                          <p className="font-bold text-zinc-200 truncate">{maskedPartner?.currentJob || 'Corporate Executive'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Religious practices details - Clean responsive single col to avoid bleed */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">Religious Commitment & Lifestyle</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-zinc-950/30 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Religion / Sect:</span>
                          <span className="font-bold text-zinc-200">{maskedPartner?.religion} ({maskedPartner?.religiousDenomination || 'General'})</span>
                        </div>
                        <div className="p-3 bg-zinc-950/30 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Pray Regularly:</span>
                          <span className="font-bold text-zinc-200">{maskedPartner?.prayRegularly || 'Yes'}</span>
                        </div>
                        {maskedPartner?.hijabPreference && (
                          <div className="p-3 bg-zinc-950/30 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Hijab Preference:</span>
                            <span className="font-bold text-zinc-200">{maskedPartner?.hijabPreference}</span>
                          </div>
                        )}
                        <div className="p-3 bg-zinc-950/30 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Marital Status:</span>
                          <span className="font-bold text-zinc-200">{maskedPartner?.maritalStatus || 'Single'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Self intro text */}
                    {maskedPartner?.selfIntroduction && (
                      <div className="space-y-2.5 pt-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">Self Introduction</h3>
                        <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-4.5 border border-zinc-800 rounded-2xl italic shadow-inner">
                          "{maskedPartner.selfIntroduction}"
                        </p>
                      </div>
                    )}

                    {/* Partner specs details */}
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

                {/* Unlocked Contact Card (Visible at Phase 3 Success) - Optimized with break-words to fit small viewports */}
                {activeMatch.status === 'MATCH_ACTIVE' && (
                  <div className="mx-6 mb-6 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-md">
                    <div className="flex items-center gap-2 text-emerald-450">
                      <Unlock className="h-5 w-5 animate-bounce shrink-0" />
                      <h4 className="font-bold text-sm">Mutual Match Success! Contacts Shared</h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Congratulations! You have both mutualized and shared secure contact details. You can now speak directly!
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 overflow-hidden shadow-inner">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <Phone className="h-4.5 w-4.5 text-emerald-450 shrink-0" />
                          <span className="truncate">Phone: <strong>{partnerProfile?.phoneNumber || partnerProfile?.phone}</strong></span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-emerald-450 shrink-0 cursor-pointer rounded-lg hover:bg-emerald-500/10"
                          onClick={() => copyToClipboard(partnerProfile?.phoneNumber || partnerProfile?.phone || '', 'phone')}
                        >
                          {copied === 'phone' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 overflow-hidden shadow-inner">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <Mail className="h-4.5 w-4.5 text-emerald-450 shrink-0" />
                          <span className="truncate break-all">Email: <strong>{partnerProfile?.email}</strong></span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-emerald-450 shrink-0 cursor-pointer rounded-lg hover:bg-emerald-500/10"
                          onClick={() => copyToClipboard(partnerProfile?.email || '', 'email')}
                        >
                          {copied === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                    </div>

                    {partnerProfile?.phoneNumber && (
                      <div className="flex justify-center pt-1.5">
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold rounded-xl flex items-center gap-2 text-xs h-11 px-5 shadow-lg shadow-emerald-600/15 cursor-pointer transition-all"
                          onClick={() => window.open(`https://wa.me/${(partnerProfile.phoneNumber || '').replace(/[^0-9]/g, '')}`, '_blank')}
                        >
                          <MessageCircle className="h-4.5 w-4.5 fill-white text-emerald-650" /> Message via WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Match Approval Dashboard Widget (Right Side Column) - Stacked cleanly on mobile */}
              <div className="space-y-6">
                
                {/* Step Controller Box */}
                <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5" /> Match Actions
                  </h3>
                  <p className="text-xs text-zinc-450 leading-relaxed border-b border-white/5 pb-3">
                    Your matchmaker handles secure introductions step-by-step. Both candidates must approve to proceed to each new stage.
                  </p>

                  <div className="space-y-4 pt-1">
                    
                    {/* Phase 1 Actions: Text Profile Approval */}
                    {activeMatch.status === 'PENDING_PROFILE_APPROVAL' && (
                      <div className="space-y-3">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 1: Description Review</Badge>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Please review the compatibility descriptions. If you're excited to swap photos, choose Approve. Otherwise, choose Pass.
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
                              className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer"
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                            </Button>
                            <Button 
                              onClick={handleApproveTextProfile}
                              className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all"
                              disabled={isLoading}
                            >
                              <Check className="h-4 w-4 mr-1 shrink-0" /> Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 2 Actions: Photo Swap Approval */}
                    {activeMatch.status === 'PENDING_PHOTO_APPROVAL' && (
                      <div className="space-y-3">
                        <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 2: Photo Introductions</Badge>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Wonderful! You both approved the text profiles. Now, swap photos by uploading one or approving photo introducer swap.
                        </p>

                        {!activeCandidate.recentPhoto && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-2.5 text-xs text-amber-300 shadow-inner leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-amber-400 shrink-0" /> Photo URL Required</p>
                            <p className="text-[10px] text-zinc-450 leading-relaxed">You must provide an image URL before initiating the secure swap.</p>
                            <Button 
                              onClick={() => setShowPhotoUpload(true)} 
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white w-full border-none h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
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
                                <span>You approved photo swap. Awaiting partner decision...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 pt-1.5">
                                <Button 
                                  onClick={handleRejectMatch}
                                  variant="outline" 
                                  className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer"
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                                </Button>
                                <Button 
                                  onClick={handleApprovePhotoSwap}
                                  className="bg-pink-650 hover:bg-pink-755 text-white text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all"
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

                    {/* Phase 3 Actions: Contact Swap */}
                    {activeMatch.status === 'PENDING_CONTACT_SHARE' && (
                      <div className="space-y-3">
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Phase 3: Secure Contact Swap</Badge>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Your photo swap completed! Choose Share Details to unlock phone numbers, emails, and direct social links.
                        </p>

                        {selfApprovedContact ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-300 font-semibold shadow-inner leading-relaxed">
                            <Check className="h-5 w-5 bg-amber-550 text-zinc-950 rounded-full p-0.5 shrink-0 animate-pulse" />
                            <span>Details shared! Awaiting partner approval...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 pt-1.5">
                            <Button 
                              onClick={handleRejectMatch}
                              variant="outline" 
                              className="border-zinc-800 bg-zinc-950/40 text-xs font-bold text-rose-450 hover:bg-rose-950/20 hover:text-rose-350 h-12 rounded-2xl cursor-pointer"
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4 mr-1 shrink-0" /> Pass
                            </Button>
                            <Button 
                              onClick={handleApproveContactSwap}
                              className="bg-amber-550 hover:bg-amber-600 text-zinc-950 text-xs font-bold h-12 border-0 rounded-2xl shadow-md cursor-pointer transition-all"
                              disabled={isLoading}
                            >
                              <Phone className="h-4 w-4 mr-1 shrink-0" /> Share Details
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stage 4: Success matched couple */}
                    {activeMatch.status === 'MATCH_ACTIVE' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300 space-y-2 shadow-inner leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5 text-sm"><Sparkles className="h-5 w-5 animate-bounce shrink-0 text-emerald-450" /> Mutual Match Active!</p>
                        <p className="text-[10px] text-zinc-400">
                          You have successfully unlocked contact information. Your partner's details are located in the information box.
                        </p>
                      </div>
                    )}

                  </div>
                </Card>

                {/* Profile Specifications details Widget */}
                <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-3.5 shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Your Matchmaking Criteria</h4>
                  <div className="space-y-2 text-xs text-zinc-400 border-t border-white/5 pt-3">
                    <p className="flex justify-between"><span>Candidate Code:</span> <strong className="text-zinc-200 font-semibold">{activeCandidate.code}</strong></p>
                    <p className="flex justify-between"><span>Assigned Matchmaker:</span> <strong className="text-zinc-200 font-semibold">{activeMatch?.responsibleAdminName || 'Sarah'}</strong></p>
                    <p className="flex justify-between"><span>Prayer Habitude:</span> <strong className="text-zinc-200 font-semibold">{activeCandidate.prayRegularly || 'N/A'}</strong></p>
                    <p className="flex justify-between"><span>Relocation Pref:</span> <strong className="text-zinc-200 font-semibold text-right max-w-[150px] truncate">{activeCandidate.willingToRelocate || 'N/A'}</strong></p>
                  </div>
                </Card>

              </div>

            </div>

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
                      className="h-8 w-8 text-zinc-400 hover:text-white rounded-full"
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
                        className="bg-zinc-950 border-zinc-800 text-white rounded-xl focus:border-pink-500/40 text-xs h-12 shadow-inner"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        required
                      />
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        To participate in photo introductions, please enter a valid image address. You can upload your picture to any free hosting provider and paste the direct link.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-12 rounded-xl border-none shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                      disabled={isLoading}
                    >
                      Save & Approve Swap
                    </Button>
                  </form>
                </Card>
              </div>
            )}

          </div>
        ) : (
          <Card className="bg-zinc-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[320px] shadow-xl">
            <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-full mb-2">
              <Heart className="h-10 w-10 text-pink-400 opacity-60 animate-pulse" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">No Active Proposed Matches</h3>
            <p className="text-xs sm:text-sm text-zinc-450 max-w-md leading-relaxed">
              Your personal matchmaker is currently searching the directory for highly compatible candidates. You will receive an immediate email introduction at <span className="text-pink-300 font-semibold">{activeCandidate.email || '[No Email Set]'}</span> as soon as a potential couple is locked!
            </p>
            <div className="pt-4 text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 border-t border-white/5 w-full justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-pink-400" /> Introducing compatible matches shortly
            </div>
          </Card>
        )}
      </main>
      
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
