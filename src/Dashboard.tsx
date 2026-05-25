import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from './context';
import { 
  Heart, 
  Sparkles, 
  Plus, 
  Users, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle, 
  CalendarDays, 
  Database,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  BookmarkCheck
} from 'lucide-react';
import { MatchStatus, Match, Client } from './types';
import { isSupabaseConfigured } from './supabase';
import { ConfirmDialog } from './components/ConfirmDialog';

export default function Dashboard() {
  const { 
    profiles, 
    rawProfiles,
    matches, 
    addMatch, 
    updateMatch, 
    deleteMatch, 
    currentUser, 
    users,
    addComment,
    matchMeetings,
    recordMatchMeeting,
    addTask
  } = useAppContext();

  // State to track which match cards have revealed contacts
  const [revealedMatches, setRevealedMatches] = React.useState<Record<string, boolean>>({});

  // Dating scheduling states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMatchForDate, setSelectedMatchForDate] = useState<Match | null>(null);
  const [dateVenue, setDateVenue] = useState<'CAIRO' | 'GIZA' | 'ONLINE'>('CAIRO');
  const [dateTime, setDateTime] = useState('');
  const [dateNotes, setDateNotes] = useState('');

  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const clean = phone.trim();
    if (clean.length < 5) return '***';
    return clean.slice(0, 4) + ' •••• ••' + clean.slice(-2);
  };

  const handleRevealMatchContacts = async (match: Match) => {
    if (!currentUser) return;
    setRevealedMatches(prev => ({ ...prev, [match.id]: true }));
    // Add audit comments
    await addComment(match.maleId, `REVEAL: Matchmaker ${currentUser.name} revealed sensitive contacts via Match #${match.id}`, currentUser.name);
    await addComment(match.femaleId, `REVEAL: Matchmaker ${currentUser.name} revealed sensitive contacts via Match #${match.id}`, currentUser.name);
  };


  // Dialog & Form State
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [selectedGentlemanId, setSelectedGentlemanId] = useState('');
  const [selectedLadyId, setSelectedLadyId] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [activeColIndex, setActiveColIndex] = useState(0);

  // Custom confirmation dialog states for archiving matches
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [matchToUnmatch, setMatchToUnmatch] = useState<string | null>(null);

  // Filter candidates for match proposing
  const gentlemen = profiles.filter(
    p => (p.gender?.toLowerCase() === 'gentleman' || p.gender?.toLowerCase() === 'male') && p.status === 'Active'
  );
  const ladies = profiles.filter(
    p => (p.gender?.toLowerCase() === 'lady' || p.gender?.toLowerCase() === 'female') && p.status === 'Active'
  );

  // Stats calculation
  const totalProfilesCount = profiles.length;
  const activeGentlemenCount = gentlemen.length;
  const activeLadiesCount = ladies.length;
  const activeMatchesCount = matches.filter(m => m.status !== 'UNMATCHED').length;

  const handleProposeMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGentlemanId || !selectedLadyId) {
      alert('Please select both a Gentleman and a Lady.');
      return;
    }

    const gentleman = profiles.find(p => p.id === selectedGentlemanId);
    const lady = profiles.find(p => p.id === selectedLadyId);

    if (!gentleman || !lady) {
      alert('Selected profiles not found.');
      return;
    }

    // Check if they are already in a match
    const existingMatch = matches.find(
      m => m.status !== 'UNMATCHED' && 
      ((m.maleId === gentleman.id && m.femaleId === lady.id) || 
       (m.maleId === lady.id && m.femaleId === gentleman.id))
    );

    if (existingMatch) {
      alert('A match already exists between these two candidates!');
      return;
    }

    try {
      await addMatch({
        maleId: gentleman.id,
        maleName: gentleman.fullName || gentleman.name,
        maleProfileApproved: false,
        malePhotoApproved: false,
        maleContactApproved: false,
        femaleId: lady.id,
        femaleName: lady.fullName || lady.name,
        femaleProfileApproved: false,
        femalePhotoApproved: false,
        femaleContactApproved: false,
        gentlemanCode: gentleman.code || 'G-XXX',
        ladyCode: lady.code || 'L-XXX',
        status: MatchStatus.PENDING_PROFILE_APPROVAL,
        notes: proposalNotes
      });

      // Clear Form & Close
      setSelectedGentlemanId('');
      setSelectedLadyId('');
      setProposalNotes('');
      setIsProposalOpen(false);
    } catch (e: any) {
      alert('Failed to propose match: ' + (e.message || String(e)));
    }
  };

  // State Machine transition trigger helpers - Optimized to Demote Statuses on De-approval to prevent traps
  const toggleMaleProfileApprove = async (match: Match) => {
    const nextApproved = !match.maleProfileApproved;
    const isBothApproved = nextApproved && match.femaleProfileApproved;
    await updateMatch(match.id, {
      maleProfileApproved: nextApproved,
      status: isBothApproved ? MatchStatus.PENDING_PHOTO_APPROVAL : MatchStatus.PENDING_PROFILE_APPROVAL
    });
  };

  const toggleFemaleProfileApprove = async (match: Match) => {
    const nextApproved = !match.femaleProfileApproved;
    const isBothApproved = match.maleProfileApproved && nextApproved;
    await updateMatch(match.id, {
      femaleProfileApproved: nextApproved,
      status: isBothApproved ? MatchStatus.PENDING_PHOTO_APPROVAL : MatchStatus.PENDING_PROFILE_APPROVAL
    });
  };

  const toggleMalePhotoApprove = async (match: Match) => {
    const nextApproved = !match.malePhotoApproved;
    const isBothApproved = nextApproved && match.femalePhotoApproved;
    await updateMatch(match.id, {
      malePhotoApproved: nextApproved,
      status: isBothApproved ? MatchStatus.PENDING_CONTACT_SHARE : MatchStatus.PENDING_PHOTO_APPROVAL
    });
  };

  const toggleFemalePhotoApprove = async (match: Match) => {
    const nextApproved = !match.femalePhotoApproved;
    const isBothApproved = match.malePhotoApproved && nextApproved;
    await updateMatch(match.id, {
      femalePhotoApproved: nextApproved,
      status: isBothApproved ? MatchStatus.PENDING_CONTACT_SHARE : MatchStatus.PENDING_PHOTO_APPROVAL
    });
  };

  const toggleMaleContactApprove = async (match: Match) => {
    const nextApproved = !match.maleContactApproved;
    const isBothApproved = nextApproved && match.femaleContactApproved;
    await updateMatch(match.id, {
      maleContactApproved: nextApproved,
      status: isBothApproved ? MatchStatus.MATCH_ACTIVE : MatchStatus.PENDING_CONTACT_SHARE
    });
  };

  const toggleFemaleContactApprove = async (match: Match) => {
    const nextApproved = !match.femaleContactApproved;
    const isBothApproved = match.maleContactApproved && nextApproved;
    await updateMatch(match.id, {
      femaleContactApproved: nextApproved,
      status: isBothApproved ? MatchStatus.MATCH_ACTIVE : MatchStatus.PENDING_CONTACT_SHARE
    });
  };

  const updateMatchProgress = async (match: Match, field: 'firstCheck' | 'secondCheck' | 'thirdCheck', value: string) => {
    const updates: Partial<Match> = { [field]: value };
    // If we finished the 3rd check, move optionally to active success state or pending feedback
    if (field === 'firstCheck' && match.status === MatchStatus.MATCH_ACTIVE) {
      updates.status = MatchStatus.PENDING_FEEDBACK;
    }
    await updateMatch(match.id, updates);
  };

  const triggerUnmatch = (matchId: string) => {
    setMatchToUnmatch(matchId);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = async () => {
    if (matchToUnmatch) {
      await updateMatch(matchToUnmatch, { status: 'UNMATCHED' as MatchStatus });
      setShowUnmatchConfirm(false);
      setMatchToUnmatch(null);
    }
  };

  const triggerScheduleDate = (match: Match) => {
    setSelectedMatchForDate(match);
    setDateVenue('CAIRO');
    setDateTime(new Date().toISOString().slice(0, 16));
    setDateNotes('');
    setIsScheduleOpen(true);
  };

  const handleScheduleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchForDate || !dateTime) {
      alert('Please fill out the date and time.');
      return;
    }

    try {
      await recordMatchMeeting(selectedMatchForDate.maleId, dateVenue);
      await recordMatchMeeting(selectedMatchForDate.femaleId, dateVenue);

      const dateString = new Date(dateTime).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      
      const maleComment = `[DATE SCHEDULED] Confirmed date/meeting scheduled with Lady ${selectedMatchForDate.femaleName} (${selectedMatchForDate.ladyCode}) on ${dateString} via ${dateVenue}. Notes: ${dateNotes || 'No specific notes.'}`;
      const femaleComment = `[DATE SCHEDULED] Confirmed date/meeting scheduled with Gentleman ${selectedMatchForDate.maleName} (${selectedMatchForDate.gentlemanCode}) on ${dateString} via ${dateVenue}. Notes: ${dateNotes || 'No specific notes.'}`;
      
      await addComment(selectedMatchForDate.maleId, maleComment, currentUser?.name || 'Matchmaker');
      await addComment(selectedMatchForDate.femaleId, femaleComment, currentUser?.name || 'Matchmaker');

      const updatedNotes = (selectedMatchForDate.notes || '') + 
        `\n\n[SCHEDULED DATE] ${dateString} @ ${dateVenue}: ${dateNotes || 'Meeting set.'}`;
      await updateMatch(selectedMatchForDate.id, { notes: updatedNotes });

      // Automatically create a post-date feedback call task due 1 day after the scheduled date
      const postDateDue = new Date(dateTime);
      postDateDue.setDate(postDateDue.getDate() + 1);

      await addTask({
        title: `[Post-Date Feedback Call] Match #${selectedMatchForDate.id} (${selectedMatchForDate.gentlemanCode} & ${selectedMatchForDate.ladyCode})`,
        description: `Conduct a post-date feedback call with Gentleman ${selectedMatchForDate.gentlemanCode} (${selectedMatchForDate.maleName}) and Lady ${selectedMatchForDate.ladyCode} (${selectedMatchForDate.femaleName}) to collect feedback about their date at ${dateVenue} on ${dateString}.`,
        dueDate: postDateDue.toISOString(),
        status: 'Pending',
        priority: 'High',
        clientId: selectedMatchForDate.maleId,
        assignedTo: selectedMatchForDate.responsibleAdminId || currentUser?.id || 'admin-sarah'
      });

      setIsScheduleOpen(false);
      setSelectedMatchForDate(null);
    } catch (err: any) {
      alert('Failed to schedule date: ' + err.message);
    }
  };

  // Group Matches by Status Columns
  const columns: { title: string; status: MatchStatus; desc: string; bg: string; border: string; accent: string }[] = [
    { 
      title: '1. Text Profile Review', 
      status: MatchStatus.PENDING_PROFILE_APPROVAL,
      desc: 'Admins reviewing mutual profile texts', 
      bg: 'bg-indigo-950/20', 
      border: 'border-indigo-500/20',
      accent: 'indigo'
    },
    { 
      title: '2. Photo Swap Approval', 
      status: MatchStatus.PENDING_PHOTO_APPROVAL,
      desc: 'Candidates approved text, swapping photos', 
      bg: 'bg-pink-950/20', 
      border: 'border-pink-500/20',
      accent: 'pink'
    },
    { 
      title: '3. Contact Share', 
      status: MatchStatus.PENDING_CONTACT_SHARE,
      desc: 'Awaiting phone/link release permission', 
      bg: 'bg-amber-950/20', 
      border: 'border-amber-500/20',
      accent: 'amber'
    },
    { 
      title: '4. Active Connection', 
      status: MatchStatus.MATCH_ACTIVE,
      desc: 'Direct WhatsApp/Call active couple', 
      bg: 'bg-emerald-950/20', 
      border: 'border-emerald-500/20',
      accent: 'emerald'
    },
    { 
      title: '5. Feedback & Match Progress', 
      status: MatchStatus.PENDING_FEEDBACK,
      desc: '1-week, 1-month, 3-month trackers', 
      bg: 'bg-cyan-950/20', 
      border: 'border-cyan-500/20',
      accent: 'cyan'
    }
  ];

  const renderColumn = (col: typeof columns[0], isMobile = false) => {
    const colMatches = matches.filter(m => m.status === col.status);

    const accentClasses: Record<string, string> = {
      indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };

    return (
      <div key={col.status} className={`rounded-2xl p-4 border ${col.bg} ${col.border} flex flex-col space-y-4 ${isMobile ? 'min-h-[400px]' : 'min-h-[500px]'}`}>
        {/* Column Title Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-100 tracking-tight">{col.title}</h3>
            <Badge variant="outline" className={accentClasses[col.accent] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
              {colMatches.length}
            </Badge>
          </div>
          <p className="text-[10px] text-zinc-400">{col.desc}</p>
        </div>

        {/* Match Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[600px] no-scrollbar">
          {colMatches.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center text-zinc-600">
              <HelpCircle className="h-6 w-6 mb-1 opacity-50" />
              <span className="text-xs">No active pairs</span>
            </div>
          ) : (
            colMatches.map(match => {
              return (
                <Card key={match.id} className="bg-zinc-950 border-white/5 shadow-md rounded-xl p-3 space-y-3 hover:scale-[1.01] hover:border-zinc-800 hover:shadow-lg active:scale-[0.99] transition-all duration-300 relative overflow-hidden group cursor-pointer">
                  {/* Top row codes & unmatch button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-indigo-950 text-indigo-400 font-bold border-indigo-500/10 text-[10px]">{match.gentlemanCode}</Badge>
                      <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                      <Badge className="bg-pink-950 text-pink-400 font-bold border-pink-500/10 text-[10px]">{match.ladyCode}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-zinc-600 hover:text-rose-400 hover:bg-zinc-900 rounded-md"
                      onClick={() => triggerUnmatch(match.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Matching Names */}
                  <div className="text-xs text-zinc-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Gentleman:</span>
                      <span className="text-zinc-300 font-semibold truncate max-w-[120px]">{match.maleName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Lady:</span>
                      <span className="text-zinc-300 font-semibold truncate max-w-[120px]">{match.femaleName}</span>
                    </div>
                  </div>

                  {/* Phase Actions State Machine */}
                  <div className="bg-zinc-900/50 p-2 rounded-lg border border-white/5 space-y-2">
                    {match.status === MatchStatus.PENDING_PROFILE_APPROVAL && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">1. Text Approvals</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button 
                            size="sm" 
                            variant={match.maleProfileApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.maleProfileApproved ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleMaleProfileApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.gentlemanCode} Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant={match.femaleProfileApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.femaleProfileApproved ? 'bg-pink-600 hover:bg-pink-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleFemaleProfileApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.ladyCode} Profile
                          </Button>
                        </div>
                      </div>
                    )}

                    {match.status === MatchStatus.PENDING_PHOTO_APPROVAL && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">2. Photo Approvals</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button 
                            size="sm" 
                            variant={match.malePhotoApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.malePhotoApproved ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleMalePhotoApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.gentlemanCode} Photo
                          </Button>
                          <Button 
                            size="sm" 
                            variant={match.femalePhotoApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.femalePhotoApproved ? 'bg-pink-600 hover:bg-pink-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleFemalePhotoApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.ladyCode} Photo
                          </Button>
                        </div>
                      </div>
                    )}

                    {match.status === MatchStatus.PENDING_CONTACT_SHARE && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">3. Contact Share Approvals</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button 
                            size="sm" 
                            variant={match.maleContactApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.maleContactApproved ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleMaleContactApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.gentlemanCode} Ok
                          </Button>
                          <Button 
                            size="sm" 
                            variant={match.femaleContactApproved ? 'default' : 'outline'}
                            className={`h-7 text-[10px] px-1 transition-all ${match.femaleContactApproved ? 'bg-pink-600 hover:bg-pink-700 text-white font-bold' : 'border-white/5 text-zinc-400 hover:bg-zinc-900'}`}
                            onClick={() => toggleFemaleContactApprove(match)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {match.ladyCode} Ok
                          </Button>
                        </div>
                      </div>
                    )}

                    {match.status === MatchStatus.MATCH_ACTIVE && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Match Progress Tracker</span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] border-emerald-500/10">Active Match</Badge>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                            <span className="text-zinc-400 flex items-center gap-1"><CalendarDays className="h-3 w-3 text-zinc-500" /> 1-Week Check:</span>
                            <Select 
                              value={match.firstCheck || 'Pending'} 
                              onValueChange={(val) => updateMatchProgress(match, 'firstCheck', val)}
                            >
                              <SelectTrigger className="h-6 w-[80px] text-[10px] bg-zinc-900 border-zinc-800 text-white p-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Touch">In Touch</SelectItem>
                                <SelectItem value="Cold">Cold</SelectItem>
                                <SelectItem value="Broken">Broken</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-[9px] bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-pink-400 hover:text-pink-300 font-bold tracking-wider uppercase mt-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                            onClick={() => triggerScheduleDate(match)}
                          >
                            <CalendarDays className="h-3.5 w-3.5 text-pink-400" /> Schedule Date
                          </Button>
                        </div>
                      </div>
                    )}

                    {match.status === MatchStatus.PENDING_FEEDBACK && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Feedback Checks</span>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                            <span className="text-zinc-500">1-Week:</span>
                            <span className={`font-semibold ${match.firstCheck === 'Broken' ? 'text-rose-400' : 'text-emerald-400'}`}>{match.firstCheck || 'Pending'}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                            <span className="text-zinc-400">1-Month:</span>
                            <Select 
                              value={match.secondCheck || 'Pending'} 
                              onValueChange={(val) => updateMatchProgress(match, 'secondCheck', val)}
                            >
                              <SelectTrigger className="h-5 w-[70px] text-[10px] bg-zinc-900 border-zinc-800 text-white p-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Engaged">Engaged</SelectItem>
                                <SelectItem value="Still Chatting">Chatting</SelectItem>
                                <SelectItem value="No Match">Ended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-zinc-400">3-Month:</span>
                            <Select 
                              value={match.thirdCheck || 'Pending'} 
                              onValueChange={(val) => updateMatchProgress(match, 'thirdCheck', val)}
                            >
                              <SelectTrigger className="h-5 w-[70px] text-[10px] bg-zinc-900 border-zinc-800 text-white p-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Married">Married!</SelectItem>
                                <SelectItem value="Engaged">Engaged</SelectItem>
                                <SelectItem value="Finished">Ended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Details / Reveal section */}
                  {['PENDING_CONTACT_SHARE', 'MATCH_ACTIVE', 'PENDING_FEEDBACK'].includes(match.status) && (
                    <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span>Contact Details</span>
                        {!revealedMatches[match.id] ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRevealMatchContacts(match)} 
                            className="h-5 px-1.5 text-[9px] font-black border border-amber-500/25 text-amber-500 hover:bg-amber-500/10 rounded-md"
                          >
                            Reveal
                          </Button>
                        ) : (
                          <Badge className="bg-amber-600/10 text-amber-500 border border-amber-500/25 text-[8px] font-black tracking-widest px-1 py-0 h-4">Revealed</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs text-zinc-300 font-mono">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">{match.gentlemanCode}:</span>
                          <span>
                            {revealedMatches[match.id] 
                              ? (rawProfiles.find(p => p.id === match.maleId)?.phone || 'No phone') 
                              : maskPhone(rawProfiles.find(p => p.id === match.maleId)?.phone || '+20 100 *** ****')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">{match.ladyCode}:</span>
                          <span>
                            {revealedMatches[match.id] 
                              ? (rawProfiles.find(p => p.id === match.femaleId)?.phone || 'No phone') 
                              : maskPhone(rawProfiles.find(p => p.id === match.femaleId)?.phone || '+20 111 *** ****')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {match.notes && (
                    <p className="text-[10px] text-zinc-500 bg-zinc-900/30 p-1.5 rounded border border-white/5 italic line-clamp-2" title={match.notes}>
                      "{match.notes}"
                    </p>
                  )}

                  {/* Footer Admin info */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1"><User className="h-3 w-3 text-zinc-700" /> {match.responsibleAdminName || 'Matchmaker'}</span>
                    <span>{new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Database Lights */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-950/30 via-background to-pink-950/30 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="space-y-1.5 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Match Control Center <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            </h2>
            <Badge variant="outline" className={`text-xs flex items-center gap-1.5 ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <Database className="h-3 w-3" />
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Sandbox Database'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Welcome back, <span className="text-pink-300 font-semibold">{currentUser?.name}</span>. Facilitate candidate approvals step-by-step.
          </p>
        </div>

        {/* Propose Button */}
        <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-purple-700 transition-all font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Propose New Match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-none w-full h-[92vh] md:h-auto md:max-w-md fixed bottom-0 md:bottom-auto top-auto md:top-1/2 left-0 md:left-1/2 translate-x-0 md:-translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-t-3xl rounded-b-none md:rounded-xl bg-zinc-950 border-t md:border border-white/10 text-white flex flex-col justify-between p-0 shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:zoom-in-95">
            {/* Drawer Drag handle for mobile visual hint */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-zinc-800 rounded-full" />
            </div>
            
            <DialogHeader className="p-6 pb-0 md:p-6 md:pb-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500 animate-pulse" /> Propose Match Couple
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProposeMatch} className="flex-1 flex flex-col justify-between space-y-4 p-6 pt-2 overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label htmlFor="gentleman" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Select Gentleman (Male Candidates)</Label>
                  <Select value={selectedGentlemanId} onValueChange={setSelectedGentlemanId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Choose gentleman profile..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {gentlemen.length === 0 ? (
                        <SelectItem value="none" disabled>No active gentlemen profiles available</SelectItem>
                      ) : (
                        gentlemen.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.code} - {(g.fullName || g.name)} ({g.age}y, {g.locationOfResidence})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center text-zinc-600 font-bold text-sm py-1">
                  <ArrowRight className="h-6 w-6 transform rotate-90 md:rotate-0 text-pink-500/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lady" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Select Lady (Female Candidates)</Label>
                  <Select value={selectedLadyId} onValueChange={setSelectedLadyId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Choose lady profile..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {ladies.length === 0 ? (
                        <SelectItem value="none" disabled>No active ladies profiles available</SelectItem>
                      ) : (
                        ladies.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.code} - {(l.fullName || l.name)} ({l.age}y, {l.locationOfResidence})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Proposal Context & Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="E.g. Both highly value location, are GUC alumni, share same values..." 
                    className="bg-zinc-900 border-zinc-800 text-white min-h-[80px]"
                    value={proposalNotes}
                    onChange={(e) => setProposalNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="mt-auto pt-4 border-t border-white/5 flex gap-2 sm:flex-row flex-row-reverse">
                <Button type="button" variant="outline" className="flex-1 sm:flex-none border-white/10 hover:bg-zinc-900 text-white active:scale-95 transition-all duration-150" onClick={() => setIsProposalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all duration-150 font-semibold">
                  Launch Match Machine
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-zinc-950 border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] hover:border-zinc-800 transition-all duration-300">
          <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full group-hover:from-pink-500/25 transition-all duration-500" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider block leading-tight">Total Candidates</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalProfilesCount}</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-pink-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-pink-400 flex-shrink-0 group-hover:bg-pink-500/20 transition-colors duration-300">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] hover:border-zinc-800 transition-all duration-300">
          <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full group-hover:from-indigo-500/25 transition-all duration-500" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider block leading-tight">Active Gentlemen</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{activeGentlemenCount}</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors duration-300">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] hover:border-zinc-800 transition-all duration-300">
          <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full group-hover:from-teal-500/25 transition-all duration-500" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider block leading-tight">Active Ladies</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">{activeLadiesCount}</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-teal-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-teal-400 flex-shrink-0 group-hover:bg-teal-500/20 transition-colors duration-300">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] hover:border-zinc-800 transition-all duration-300">
          <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full group-hover:from-rose-500/25 transition-all duration-500" />
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wider block leading-tight">Proposed Matches</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{activeMatchesCount}</p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-rose-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-rose-400 flex-shrink-0 group-hover:bg-rose-500/20 transition-colors duration-300">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-400/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date & Meeting Scheduler Overview Panel */}
      {matchMeetings.length > 0 && (
        <Card className="bg-zinc-950/60 border border-white/10 shadow-2xl overflow-hidden rounded-2xl backdrop-blur-md">
          <CardHeader className="border-b border-white/5 bg-zinc-900/20 p-4 sm:p-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-pink-500" /> Active Dates & Match Consultations ({matchMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {[...matchMeetings].reverse().map(meeting => {
                const client = profiles.find(p => p.id === meeting.clientId);
                return (
                  <div key={meeting.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 shadow-sm text-xs transition-all hover:scale-[1.01]">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0">{client?.code || 'C-XXX'}</Badge>
                        <span className="font-bold text-zinc-200 truncate">{client?.fullName || client?.name || 'Anonymous Candidate'}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <span>Venue/Method:</span> <strong className="text-zinc-300 font-semibold uppercase tracking-wider text-[9px]">{meeting.branch}</strong>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-pink-400 font-mono text-[11px]">{new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Confirmed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Kanban Board Tabs (viewports below md) */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar snap-x snap-mandatory">
        {columns.map((col, index) => {
          const colMatchesCount = matches.filter(m => m.status === col.status).length;
          const isActive = activeColIndex === index;
          
          return (
            <button
              key={col.status}
              type="button"
              onClick={() => setActiveColIndex(index)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 snap-center border ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-500/30 shadow-lg shadow-pink-500/20 scale-95'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] bg-white/10 text-white font-extrabold">
                {index + 1}
              </span>
              <span className="tracking-wide">{col.title.replace(/^\d+\.\s*/, '')}</span>
              <Badge variant="outline" className={`h-4 min-w-4 px-1 flex items-center justify-center text-[9px] border-none font-black ${
                isActive ? 'bg-white/20 text-white animate-pulse' : 'bg-muted text-muted-foreground'
              }`}>
                {colMatchesCount}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Kanban Columns */}
      <div className="pb-4">
        {/* Desktop multi-column board (hidden on mobile) - Wrapped in horizontal scroll to prevent bleeding */}
        <div className="hidden md:block w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="grid grid-cols-5 gap-4 min-w-[1200px]">
            {columns.map(col => renderColumn(col, false))}
          </div>
        </div>

        {/* Mobile single-column board (hidden on desktop) */}
        <div className="md:hidden">
          {renderColumn(columns[activeColIndex], true)}
        </div>
      </div>

      {/* Date Scheduling Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-none w-full h-[92vh] md:h-auto md:max-w-md fixed bottom-0 md:bottom-auto top-auto md:top-1/2 left-0 md:left-1/2 translate-x-0 md:-translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-t-3xl rounded-b-none md:rounded-xl bg-background border-t md:border border-border text-foreground flex flex-col justify-between p-0 shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:zoom-in-95">
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1 bg-muted rounded-full" />
          </div>
          <DialogHeader className="p-6 pb-0 md:p-6 md:pb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-pink-500" /> Schedule Match Date / Consultation
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleDateSubmit} className="flex-1 flex flex-col justify-between space-y-4 p-6 pt-2 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted p-3.5 rounded-2xl border border-border">
                Scheduling a date for <strong className="text-foreground">{selectedMatchForDate?.maleName} ({selectedMatchForDate?.gentlemanCode})</strong> and <strong className="text-foreground">{selectedMatchForDate?.femaleName} ({selectedMatchForDate?.ladyCode})</strong>. This will log the date automatically in both profiles' timelines.
              </p>

              <div className="space-y-2">
                <Label htmlFor="dateVenue" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Date Venue / Branch Method</Label>
                <Select value={dateVenue} onValueChange={(v: any) => setDateVenue(v)}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="CAIRO">Cairo Branch / Coffee Meetup</SelectItem>
                    <SelectItem value="GIZA">Giza Branch / Coffee Meetup</SelectItem>
                    <SelectItem value="ONLINE">Online Video Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTime" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Date & Time</Label>
                <Input 
                  id="dateTime"
                  type="datetime-local" 
                  className="bg-background border-input text-foreground"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateNotes" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Dating Instructions / Matchmaker Notes</Label>
                <Textarea 
                  id="dateNotes" 
                  placeholder="e.g. Set to meet at Giza Cafe, Karim will bring flowers, Sarah following up..." 
                  className="bg-background border-input text-foreground min-h-[80px]"
                  value={dateNotes}
                  onChange={(e) => setDateNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-auto pt-4 border-t border-border flex gap-2 sm:flex-row flex-row-reverse">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none border-border hover:bg-muted text-foreground active:scale-95 transition-all duration-150" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all duration-150 font-semibold">
                Confirm Date & Log
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern custom confirmation dialog for archiving matches, eliminating window.confirm blocking threads */}
      <ConfirmDialog
        isOpen={showUnmatchConfirm}
        onOpenChange={setShowUnmatchConfirm}
        title="End Match Proposal"
        description="Are you sure you want to end this match proposal (Archive as Unmatched)? This will remove it from the active match board."
        onConfirm={confirmUnmatch}
        confirmText="Archive as Unmatched"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
