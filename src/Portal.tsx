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
  Copy
} from 'lucide-react';
import { MatchStatus, Match, Client } from './types';

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
    const isBothApproved = isMale ? (nextApproved && activeMatch.femaleProfileApproved) : (activeMatch.maleProfileApproved && nextApproved);

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleProfileApproved' : 'femaleProfileApproved']: nextApproved,
        status: isBothApproved ? MatchStatus.PENDING_PHOTO_APPROVAL : activeMatch.status
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved Match #${activeMatch.id} text profile.`, activeCandidate.name);
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
    const isBothApproved = isMale ? (nextApproved && activeMatch.femalePhotoApproved) : (activeMatch.malePhotoApproved && nextApproved);

    try {
      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
        status: isBothApproved ? MatchStatus.PENDING_CONTACT_SHARE : activeMatch.status
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate approved photo swap for Match #${activeMatch.id}.`, activeCandidate.name);
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
    const isBothApproved = isMale ? (nextApproved && activeMatch.femaleContactApproved) : (activeMatch.maleContactApproved && nextApproved);

    try {
      const updates: Partial<Match> = {
        [isMale ? 'maleContactApproved' : 'femaleContactApproved']: nextApproved,
        status: isBothApproved ? MatchStatus.MATCH_ACTIVE : activeMatch.status
      };
      await updateMatch(activeMatch.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Candidate unlocked contact information for Match #${activeMatch.id}.`, activeCandidate.name);
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
      const isBothApproved = isMale ? (nextApproved && activeMatch!.femalePhotoApproved) : (activeMatch!.malePhotoApproved && nextApproved);

      const updates: Partial<Match> = {
        [isMale ? 'malePhotoApproved' : 'femalePhotoApproved']: nextApproved,
        status: isBothApproved ? MatchStatus.PENDING_CONTACT_SHARE : activeMatch!.status
      };
      await updateMatch(activeMatch!.id, updates);
      await addComment(activeCandidate.id, `PORTAL: Uploaded profile photo and approved photo swap.`, activeCandidate.name);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 flex flex-col justify-center items-center px-4 font-sans text-white py-12">
        {isSigningUp ? (
          <Card className="w-full max-w-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-1">
                <Heart className="h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extralight tracking-[0.1em] uppercase text-white font-logo">
                Candidate Registration
              </h2>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                Step {signUpStep} of 4: {
                  signUpStep === 1 ? 'Core Profile Details' :
                  signUpStep === 2 ? 'Academics & Career' :
                  signUpStep === 3 ? 'Lifestyle & Religion' :
                  'Partner Preferences'
                }
              </p>
            </div>

            {/* Stepper Indicators */}
            <div className="flex justify-between items-center relative py-2 max-w-md mx-auto">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
              <div className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 -translate-y-1/2 z-0 transition-all duration-300" style={{ width: `${(signUpStep - 1) / 3 * 100}%` }} />
              
              {[1, 2, 3, 4].map((stepNum) => (
                <div 
                  key={stepNum} 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ${
                    signUpStep >= stepNum 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (signUpStep === 4) handleSignUpSubmit(e); }} className="space-y-6 pt-2">
              
              {/* Step 1: Core Details */}
              {signUpStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Full Name <span className="text-pink-500">*</span></label>
                      <Input 
                        type="text" 
                        placeholder="Your full name"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.fullName}
                        onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Phone / WhatsApp Number <span className="text-pink-500">*</span></label>
                      <Input 
                        type="text" 
                        placeholder="e.g. +20123456789"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.phoneNumber}
                        onChange={(e) => setSignUpData({...signUpData, phoneNumber: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Gender <span className="text-pink-500">*</span></label>
                      <Select 
                        value={signUpData.gender} 
                        onValueChange={(val) => setSignUpData({...signUpData, gender: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Female">Female (Lady)</SelectItem>
                          <SelectItem value="Male">Male (Gentleman)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                      <Input 
                        type="email" 
                        placeholder="your.email@example.com"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Age</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 25"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.age}
                        onChange={(e) => setSignUpData({...signUpData, age: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Height (cm)</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. 170"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.height}
                        onChange={(e) => setSignUpData({...signUpData, height: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Location of Residence</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. New Cairo, Egypt"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.locationOfResidence}
                        onChange={(e) => setSignUpData({...signUpData, locationOfResidence: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Facebook Link</label>
                      <Input 
                        type="url" 
                        placeholder="https://facebook.com/yourprofile"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.facebookLink}
                        onChange={(e) => setSignUpData({...signUpData, facebookLink: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Photo URL</label>
                      <Input 
                        type="url" 
                        placeholder="https://example.com/your-recent-photo.jpg"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.recentPhoto}
                        onChange={(e) => setSignUpData({...signUpData, recentPhoto: e.target.value})}
                      />
                      <p className="text-[10px] text-zinc-500 leading-normal">Provide a link to a recent photo. Note: Photos are locked and only swapped dynamically after mutual consent in the portal.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academics & Career */}
              {signUpStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Are you a GUCian?</label>
                      <Select 
                        value={signUpData.areYouGucian} 
                        onValueChange={(val) => setSignUpData({...signUpData, areYouGucian: val, gucId: val === 'No' ? '' : signUpData.gucId})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">GUC ID</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. 43-12345"
                          className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                          value={signUpData.gucId}
                          onChange={(e) => setSignUpData({...signUpData, gucId: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">University / Field of Study</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Computer Science, Engineering, Business Administration"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.universityFieldOfStudy}
                        onChange={(e) => setSignUpData({...signUpData, universityFieldOfStudy: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Current Job / Profession</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Software Engineer, Marketing Manager, Business Owner"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.currentJob}
                        onChange={(e) => setSignUpData({...signUpData, currentJob: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Current Financial Status / Level</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Stable, Upper Middle, Comfortable"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.currentFinancialStatus}
                        onChange={(e) => setSignUpData({...signUpData, currentFinancialStatus: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Lifestyle & Religion */}
              {signUpStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Religion</label>
                      <Select 
                        value={signUpData.religion} 
                        onValueChange={(val) => setSignUpData({...signUpData, religion: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Religious Denomination / Sect</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Sunni, Coptic Orthodox, Catholic"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.religiousDenomination}
                        onChange={(e) => setSignUpData({...signUpData, religiousDenomination: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Pray Regularly?</label>
                      <Select 
                        value={signUpData.prayRegularly} 
                        onValueChange={(val) => setSignUpData({...signUpData, prayRegularly: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Hijab Preference</label>
                        <Select 
                          value={signUpData.hijabPreference} 
                          onValueChange={(val) => setSignUpData({...signUpData, hijabPreference: val})}
                        >
                          <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
                            <SelectValue placeholder="Select Hijab Preference" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="Hijab">Hijab</SelectItem>
                            <SelectItem value="No Hijab">No Hijab</SelectItem>
                            <SelectItem value="Turband">Turband</SelectItem>
                            <SelectItem value="Svarf">Svarf</SelectItem>
                            <SelectItem value="Abaya">Abaya</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Religious Commitment Level</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Moderate, Practicing, Highly religious"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.religiousCommitmentLevel}
                        onChange={(e) => setSignUpData({...signUpData, religiousCommitmentLevel: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Marital Status</label>
                      <Select 
                        value={signUpData.maritalStatus} 
                        onValueChange={(val) => setSignUpData({...signUpData, maritalStatus: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Have Children?</label>
                      <Select 
                        value={signUpData.haveChildren} 
                        onValueChange={(val) => setSignUpData({...signUpData, haveChildren: val, childrenDetails: val === 'No' ? '' : signUpData.childrenDetails})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Children Details</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. One child (age 4)"
                          className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                          value={signUpData.childrenDetails}
                          onChange={(e) => setSignUpData({...signUpData, childrenDetails: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Smoke or Drink?</label>
                      <Select 
                        value={signUpData.smokeOrDrink} 
                        onValueChange={(val) => setSignUpData({...signUpData, smokeOrDrink: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
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
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Self Introduction / About Me</label>
                      <textarea 
                        rows={3}
                        placeholder="Introduce yourself to potential matches, highlighting your interests, values, and personality..."
                        className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                        value={signUpData.selfIntroduction}
                        onChange={(e) => setSignUpData({...signUpData, selfIntroduction: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Partner Preferences */}
              {signUpStep === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Preferred Age Range</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. 23-28"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.preferredAgeRange}
                        onChange={(e) => setSignUpData({...signUpData, preferredAgeRange: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Preferred Sect / Denomination</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Sunni preferred, Orthodox"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.preferredReligiousDenomination}
                        onChange={(e) => setSignUpData({...signUpData, preferredReligiousDenomination: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Open to Long Distance?</label>
                      <Select 
                        value={signUpData.openToLongDistance} 
                        onValueChange={(val) => setSignUpData({...signUpData, openToLongDistance: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Willing to Relocate?</label>
                      <Select 
                        value={signUpData.willingToRelocate} 
                        onValueChange={(val) => setSignUpData({...signUpData, willingToRelocate: val})}
                      >
                        <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Believe Duty to Provide?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Yes, Shared duty, No"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.believeDutyToProvide}
                        onChange={(e) => setSignUpData({...signUpData, believeDutyToProvide: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Okay with Spouse Working?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Yes, Absolutely, No"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.areOkayWithWifeWorking}
                        onChange={(e) => setSignUpData({...signUpData, areOkayWithWifeWorking: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Prefer Older or Younger?</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Prefer older, No preference"
                        className="bg-zinc-950/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs h-10 pl-3"
                        value={signUpData.preferOlderOrYounger}
                        onChange={(e) => setSignUpData({...signUpData, preferOlderOrYounger: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">General Partner Preferences</label>
                      <textarea 
                        rows={3}
                        placeholder="Describe your ideal partner's characteristics, values, personality, and expectations..."
                        className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl focus:border-pink-500/50 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                        value={signUpData.partnerPreferences}
                        onChange={(e) => setSignUpData({...signUpData, partnerPreferences: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-950/30 p-2.5 rounded-lg flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" /> {errorMsg}
                </p>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
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
                  className="border-zinc-800 bg-zinc-950/40 text-xs h-10 rounded-xl text-zinc-300 hover:text-white"
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
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold h-10 rounded-xl border-0 px-5 shadow-lg shadow-pink-500/10"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : signUpStep === 4 ? (
                    'Complete Registration'
                  ) : (
                    'Next Step'
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center text-[10px] text-zinc-500 flex justify-center items-center gap-1">
              <Shield className="h-3 w-3" /> End-to-end encrypted profile security. All rights reserved.
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
              <p className="text-sm text-zinc-400 uppercase tracking-widest">Candidate Secure Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="loginInput" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Candidate Email or ID Code</label>
                <div className="relative">
                  <Input 
                    id="loginInput"
                    type="text" 
                    placeholder="e.g. L101 or your email address"
                    className="bg-zinc-900/80 border-zinc-800 text-white rounded-xl focus:border-pink-500/50 pl-3 h-11"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-950/30 p-2.5 rounded-lg flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" /> {errorMsg}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl border-0 shadow-lg shadow-pink-500/20 transition-all flex justify-center items-center gap-2"
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
              <p className="text-xs text-zinc-400">
                New candidate?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSigningUp(true);
                    setSignUpStep(1);
                    setErrorMsg('');
                  }}
                  className="text-pink-400 hover:text-pink-300 font-bold focus:outline-none transition-colors"
                >
                  Register Profile
                </button>
              </p>
            </div>

            {/* Sandbox Helper Dropdown */}
            {sandboxList.length > 0 && (
              <div className="border-t border-white/5 pt-5 space-y-3">
                <div className="text-center">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold tracking-wider">
                    Sandbox Testing Mode Active
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 text-center">
                  Select a seed candidate profile below to simulate portal logins instantly.
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  {sandboxList.map(p => (
                    <Button 
                      key={p.id}
                      variant="outline"
                      size="sm"
                      className="border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white justify-start"
                      onClick={() => handleQuickSelect(p.code || '')}
                    >
                      <User className="h-3 w-3 mr-1.5 opacity-50 shrink-0" />
                      <span className="truncate">{p.code} ({p.gender})</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-[10px] text-zinc-500 flex justify-center items-center gap-1">
              <Shield className="h-3 w-3" /> End-to-end encrypted profile security. All rights reserved.
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 font-sans text-white pb-12">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
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
            <div className="text-xs text-right hidden sm:block">
              <p className="font-bold text-zinc-200">{activeCandidate.name}</p>
              <p className="text-pink-400 font-semibold tracking-wider text-[10px] uppercase">ID: {activeCandidate.code}</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-destructive hover:bg-zinc-800" 
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
        <div className="bg-gradient-to-r from-pink-950/20 to-purple-950/20 border border-white/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              Salam, {activeCandidate.name}! <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            </h2>
            <p className="text-sm text-zinc-400">
              Welcome to your private candidate portal. Here you can review match proposals securely.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs uppercase tracking-wider font-semibold rounded-full shrink-0">
            Status: {activeCandidate.status}
          </Badge>
        </div>

        {/* Portal Match Progression State Monitor */}
        {activeMatch ? (
          <div className="space-y-6">
            {/* Match Roadmap Progress Slider */}
            <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                    <span>Proposed Match Journey</span>
                    <span className="text-pink-400 font-bold">{progressPercent}% Completed</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-700" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium text-zinc-500 uppercase tracking-wider">
                    <span className={activeMatch.status ? "text-indigo-400" : ""}>1. Profile text</span>
                    <span className={['PENDING_PHOTO_APPROVAL', 'PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-pink-400" : ""}>2. Swap Photos</span>
                    <span className={['PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-amber-400" : ""}>3. Contact share</span>
                    <span className={['MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(activeMatch.status) ? "text-emerald-400" : ""}>4. Active Couple</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* main Match Stage Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Partner specifications details card (Left/Middle Spanning 2 cols) */}
              <Card className="md:col-span-2 bg-zinc-900/60 border-white/10 backdrop-blur-2xl overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-white/5 bg-zinc-950/20 p-5 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500 fill-pink-500" /> Compatible Match Details
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Anonymous partner code: <span className="text-pink-400 font-bold uppercase tracking-wider">{maskedPartner?.code || 'G-XXX'}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-pink-500/20 text-pink-400 bg-pink-500/5">
                    {maskedPartner?.gender}
                  </Badge>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Photo Display depending on stage */}
                  <div className="flex justify-center border-b border-white/5 pb-6">
                    {maskedPartner?.recentPhoto ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-48 h-60 bg-zinc-950 flex items-center justify-center">
                        <img 
                          src={maskedPartner.recentPhoto} 
                          alt="Match partner profile photo" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3.5">
                          <p className="text-xs font-semibold uppercase tracking-wider">Swapped Profile Photo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 w-48 h-60 flex flex-col justify-center items-center text-center p-4 text-zinc-500 space-y-2">
                        <div className="p-3 bg-zinc-900 rounded-full">
                          <Lock className="h-6 w-6 text-zinc-600" />
                        </div>
                        <p className="text-xs font-semibold">Photo Protected</p>
                        <p className="text-[10px] text-zinc-600">Swaps open when both candidates approve text descriptions.</p>
                      </div>
                    )}
                  </div>

                  {/* Profile Attributes grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                      <Calendar className="h-4 w-4 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Age</p>
                        <p className="font-semibold text-zinc-200">{maskedPartner?.age} Years old</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                      <MapPin className="h-4 w-4 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Location / Region</p>
                        <p className="font-semibold text-zinc-200">{maskedPartner?.locationOfResidence || 'Cairo, Egypt'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                      <GraduationCap className="h-4 w-4 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Education / Field</p>
                        <p className="font-semibold text-zinc-200 truncate max-w-[200px]">{maskedPartner?.universityFieldOfStudy || 'Bachelor of Science'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                      <Briefcase className="h-4 w-4 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Job Title</p>
                        <p className="font-semibold text-zinc-200">{maskedPartner?.currentJob || 'Corporate Executive'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Religious practices details */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">Religious Commitment & Social Prefs</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-zinc-950/20 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block mb-0.5">Religion / Sect:</span>
                        <span className="font-medium">{maskedPartner?.religion} ({maskedPartner?.religiousDenomination || 'General'})</span>
                      </div>
                      <div className="p-2.5 bg-zinc-950/20 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block mb-0.5">Pray Regularly:</span>
                        <span className="font-medium">{maskedPartner?.prayRegularly || 'Yes'}</span>
                      </div>
                      {maskedPartner?.hijabPreference && (
                        <div className="p-2.5 bg-zinc-950/20 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 block mb-0.5">Hijab Preference:</span>
                          <span className="font-medium">{maskedPartner?.hijabPreference}</span>
                        </div>
                      )}
                      <div className="p-2.5 bg-zinc-950/20 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block mb-0.5">Marital Status:</span>
                        <span className="font-medium">{maskedPartner?.maritalStatus || 'Single'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Self intro text */}
                  {maskedPartner?.selfIntroduction && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">Self Introduction</h3>
                      <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/30 p-4 border border-zinc-800/50 rounded-2xl italic">
                        "{maskedPartner.selfIntroduction}"
                      </p>
                    </div>
                  )}

                  {/* Partner specs details */}
                  {maskedPartner?.partnerPreferences && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400">What they look for in a partner</h3>
                      <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/30 p-4 border border-zinc-800/50 rounded-2xl">
                        {maskedPartner.partnerPreferences}
                      </p>
                    </div>
                  )}

                  {/* Unlocked Contact Card (Visible at Phase 3 Success) */}
                  {activeMatch.status === 'MATCH_ACTIVE' && (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Unlock className="h-5 w-5 animate-bounce" />
                        <h4 className="font-bold text-sm">Mutual Match Active! Contact Details Unlocked</h4>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Congratulations! You have both unlocked and shared contact details. Speak directly via call, email, or social media!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-400" />
                            <span>Phone: <strong>{partnerProfile?.phoneNumber || partnerProfile?.phone}</strong></span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-emerald-400 shrink-0"
                            onClick={() => copyToClipboard(partnerProfile?.phoneNumber || partnerProfile?.phone || '', 'phone')}
                          >
                            {copied === 'phone' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-emerald-400" />
                            <span className="truncate max-w-[150px]">Email: <strong>{partnerProfile?.email}</strong></span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-emerald-400 shrink-0"
                            onClick={() => copyToClipboard(partnerProfile?.email || '', 'email')}
                          >
                            {copied === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {partnerProfile?.phoneNumber && (
                        <div className="flex justify-center pt-2">
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-semibold rounded-xl flex items-center gap-2 text-xs h-9 px-4 shadow-md"
                            onClick={() => window.open(`https://wa.me/${(partnerProfile.phoneNumber || '').replace(/[^0-9]/g, '')}`, '_blank')}
                          >
                            <MessageCircle className="h-4 w-4 fill-white text-emerald-600" /> Send WhatsApp Message
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Match Approval Dashboard Widget (Right Side Column) */}
              <div className="space-y-6">
                
                {/* Step Controller Box */}
                <Card className="bg-zinc-900/60 border-white/10 backdrop-blur-2xl rounded-3xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Match Actions
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Facilitate step-by-step approvals. Both candidates must complete each phase to move to the next stage.
                  </p>

                  <div className="border-t border-white/5 pt-4 space-y-4">
                    
                    {/* Phase 1 Actions: Text Profile Approval */}
                    {activeMatch.status === 'PENDING_PROFILE_APPROVAL' && (
                      <div className="space-y-3">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Phase 1: Text Review</Badge>
                        <p className="text-xs text-zinc-300">
                          Review this profile carefully. If you're interested in swapping photos, click Approve.
                        </p>
                        
                        {selfApprovedProfile ? (
                          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300 font-semibold">
                            <Check className="h-4 w-4 bg-indigo-500 text-white rounded-full p-0.5" />
                            <span>You approved this description. Awaiting partner approval...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button 
                              onClick={handleRejectMatch}
                              variant="outline" 
                              className="border-zinc-800 bg-zinc-900/40 text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 h-10 rounded-xl"
                              disabled={isLoading}
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> Pass
                            </Button>
                            <Button 
                              onClick={handleApproveTextProfile}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 border-0 rounded-xl shadow-md"
                              disabled={isLoading}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 2 Actions: Photo Swap Approval */}
                    {activeMatch.status === 'PENDING_PHOTO_APPROVAL' && (
                      <div className="space-y-3">
                        <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20">Phase 2: Photo Swap</Badge>
                        <p className="text-xs text-zinc-300">
                          Excellent! You both approved descriptions. Now, upload/opt-in to swap photos.
                        </p>

                        {!activeCandidate.recentPhoto && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-2 text-xs text-amber-300">
                            <p className="font-semibold flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Photo Upload Needed</p>
                            <p className="text-[10px] text-zinc-400">Please provide a URL to swap photos with your match.</p>
                            <Button 
                              onClick={() => setShowPhotoUpload(true)} 
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white w-full border-none h-8 rounded-lg text-[10px] font-bold"
                            >
                              <Upload className="h-3 w-3 mr-1" /> Upload Photo
                            </Button>
                          </div>
                        )}

                        {activeCandidate.recentPhoto && (
                          <>
                            {selfApprovedPhoto ? (
                              <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-pink-300 font-semibold">
                                <Check className="h-4 w-4 bg-pink-500 text-white rounded-full p-0.5" />
                                <span>You approved photo swap. Awaiting partner...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button 
                                  onClick={handleRejectMatch}
                                  variant="outline" 
                                  className="border-zinc-800 bg-zinc-900/40 text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 h-10 rounded-xl"
                                  disabled={isLoading}
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Pass
                                </Button>
                                <Button 
                                  onClick={handleApprovePhotoSwap}
                                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-10 border-0 rounded-xl shadow-md"
                                  disabled={isLoading}
                                >
                                  <ImageIcon className="h-3.5 w-3.5 mr-1" /> Swap Photo
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
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Phase 3: Contact Swap</Badge>
                        <p className="text-xs text-zinc-300">
                          Photos swapped successfully! Would you like to share your phone, email, and social link to speak?
                        </p>

                        {selfApprovedContact ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-amber-300 font-semibold">
                            <Check className="h-4 w-4 bg-amber-500 text-white rounded-full p-0.5" />
                            <span>Contact swap approved! Awaiting partner...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button 
                              onClick={handleRejectMatch}
                              variant="outline" 
                              className="border-zinc-800 bg-zinc-900/40 text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 h-10 rounded-xl"
                              disabled={isLoading}
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> Pass
                            </Button>
                            <Button 
                              onClick={handleApproveContactSwap}
                              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold h-10 border-0 rounded-xl shadow-md"
                              disabled={isLoading}
                            >
                              <Phone className="h-3.5 w-3.5 mr-1" /> Share Details
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stage 4: Success matched couple */}
                    {activeMatch.status === 'MATCH_ACTIVE' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-xs text-emerald-300 space-y-2">
                        <p className="font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4 animate-bounce" /> Mutual Match Success!</p>
                        <p className="text-[10px] text-zinc-400">
                          You both unlocked contact details. Contact information is fully available in the details box.
                        </p>
                      </div>
                    )}

                  </div>
                </Card>

                {/* Profile Settings Box */}
                <Card className="bg-zinc-900/60 border-white/10 backdrop-blur-2xl rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Your matchmaking spec</h4>
                  <div className="space-y-2 text-xs text-zinc-400">
                    <p>• Code: <strong className="text-zinc-200">{activeCandidate.code}</strong></p>
                    <p>• Assigned Matchmaker: <strong className="text-zinc-200">{activeMatch?.responsibleAdminName || 'Sarah'}</strong></p>
                    <p>• Pray Habits: <strong className="text-zinc-200">{activeCandidate.prayRegularly || 'N/A'}</strong></p>
                    <p>• Relocate Preference: <strong className="text-zinc-200">{activeCandidate.willingToRelocate || 'N/A'}</strong></p>
                  </div>
                </Card>

              </div>

            </div>

            {/* Photo upload modal dialog */}
            {showPhotoUpload && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
                <Card className="w-full max-w-sm bg-zinc-900 border-white/10 text-white rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-pink-400" /> Upload Profile Photo</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowPhotoUpload(false)} 
                      className="h-8 w-8 text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={handlePhotoUploadSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="photoUrl" className="text-xs text-zinc-400 font-semibold">Photo URL address</label>
                      <Input 
                        id="photoUrl"
                        type="url" 
                        placeholder="https://example.com/your-photo.jpg" 
                        className="bg-zinc-950 border-zinc-800 text-white rounded-xl focus:border-pink-500/40 text-xs h-10"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        required
                      />
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        To participate in photo swap, please enter an active image address. You can upload a photo to any free host and copy the direct link.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-10 rounded-xl border-none shadow-md"
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
          <Card className="bg-zinc-900/60 border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-full mb-2">
              <Heart className="h-10 w-10 text-pink-400 opacity-60 animate-pulse" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">No Active Proposed Matches</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              Your matchmaker is currently searching through our database for highly compatible candidates matching your criteria. You will receive an immediate notification to your inbox at <span className="text-pink-300 font-medium">{activeCandidate.email || '[No Email Set]'}</span> as soon as a proposed couple is locked!
            </p>
            <div className="pt-2 text-zinc-500 text-[10px] uppercase font-semibold tracking-widest flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-pink-400" /> Awaiting match proposal from matchmaking desk
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
