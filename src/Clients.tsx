import React, { useState, useDeferredValue, useMemo } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  Sparkles, 
  Plus, 
  User, 
  Users, 
  Search, 
  Filter, 
  Unlock, 
  Lock, 
  Trash2, 
  Phone, 
  Mail, 
  Facebook, 
  Calendar, 
  MessageSquare, 
  Settings,
  Eye,
  Activity,
  Award,
  BookOpen,
  MapPin,
  Map,
  Compass,
  Smile,
  BadgeAlert,
  Download,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Client, InteractionType, InteractionOutcome, ClientStatus } from './types';
import { format, parseISO } from 'date-fns';
import { ConfirmDialog } from './components/ConfirmDialog';
import ImportData from './ImportData';
import ImportHistory from './ImportHistory';

export default function Clients() {
  const { 
    clients, 
    rawProfiles, 
    addClient, 
    updateClient, 
    deleteClient, 
    deleteMultipleClients, 
    currentUser, 
    users, 
    isManagerOrAdmin, 
    addInteraction, 
    addComment 
  } = useAppContext();

  // Selected tab: 'gentlemen' or 'ladies'
  const [genderTab, setGenderTab] = useState<'gentlemen' | 'ladies'>('gentlemen');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [revealedClients, setRevealedClients] = useState<Record<string, boolean>>({});
  
  // Dialog opens
  const [isNewProfileOpen, setIsNewProfileOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterReligion, setFilterReligion] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAdmin, setFilterAdmin] = useState('All');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minHeight, setMinHeight] = useState('');
  const [maxHeight, maxHeightSet] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Interaction / Comments state
  const [interactionType, setInteractionType] = useState<InteractionType>('Call');
  const [interactionOutcome, setInteractionOutcome] = useState<InteractionOutcome>('Interested');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [newComment, setNewComment] = useState('');

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePhone, setNewProfilePhone] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileGender, setNewProfileGender] = useState<'Male' | 'Female'>('Male');
  const [newProfileAge, setNewProfileAge] = useState('');
  const [newProfileResidence, setNewProfileResidence] = useState('');
  const [newProfileReligion, setNewProfileReligion] = useState('Muslim');
  const [newProfileAssignedTo, setNewProfileAssignedTo] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);

  // Privacy lock helpers
  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.length <= 5) return '*****';
    return phone.slice(0, 5) + '***' + phone.slice(-2);
  };

  const maskEmail = (email?: string) => {
    if (!email) return '-';
    const parts = email.split('@');
    if (parts.length !== 2) return '*****';
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? name[0] + '***' + name.slice(-1) : '***';
    return `${maskedName}@${domain}`;
  };

  const maskFacebook = (link?: string) => {
    if (!link) return '-';
    return 'facebook.com/***';
  };

  const handleAddProfile = () => {
    if (!newProfileName || !newProfilePhone) {
      alert('Please fill out Name and Phone number.');
      return;
    }

    const sequentialId = Math.floor(100 + Math.random() * 900).toString();
    const gCode = newProfileGender === 'Male' ? `G${sequentialId}` : `L${sequentialId}`;

    addClient({
      id: Math.random().toString(36).substr(2, 9),
      name: newProfileName,
      fullName: newProfileName,
      phone: newProfilePhone,
      phoneNumber: newProfilePhone,
      email: newProfileEmail || undefined,
      gender: newProfileGender === 'Male' ? 'Male' : 'Female',
      age: parseInt(newProfileAge) || undefined,
      finalAge: parseInt(newProfileAge) || undefined,
      locationOfResidence: newProfileResidence || undefined,
      religion: newProfileReligion,
      status: 'Pending',
      code: gCode,
      comments: [],
      interactions: [],
      assignedTo: newProfileAssignedTo || currentUser?.id,
      createdAt: new Date().toISOString()
    });

    setIsNewProfileOpen(false);
    setNewProfileName('');
    setNewProfilePhone('');
    setNewProfileEmail('');
    setNewProfileAge('');
    setNewProfileResidence('');
  };

  const handleReveal = async (clientId: string) => {
    if (!currentUser) return;
    setRevealedClients(prev => ({
      ...prev,
      [clientId]: true
    }));
    await addComment(clientId, `REVEAL: Matchmaker ${currentUser.name} revealed sensitive contacts`, currentUser.name);
  };

  const handleAddInteraction = async (clientId: string) => {
    if (!interactionNotes.trim()) return;
    
    await addInteraction(clientId, {
      type: interactionType,
      outcome: interactionOutcome,
      notes: interactionNotes,
      nextFollowUp: nextFollowUpDate || undefined
    });

    setInteractionNotes('');
    setNextFollowUpDate('');
  };

  const handleAddComment = async (clientId: string) => {
    if (!newComment.trim()) return;
    await addComment(clientId, newComment);
    setNewComment('');
  };

  // Get raw unique fields for filters
  const uniqueLocations = useMemo(() => {
    const locs = clients.map(c => c.locationOfResidence).filter(Boolean) as string[];
    return Array.from(new Set(locs));
  }, [clients]);

  const uniqueReligions = useMemo(() => {
    const rels = clients.map(c => c.religion).filter(Boolean) as string[];
    return Array.from(new Set(rels));
  }, [clients]);

  // Compute filtered clients
  const filteredCandidates = useMemo(() => {
    return clients.filter(c => {
      // 1. Gender check
      const gender = c.gender?.toLowerCase() || '';
      const isMale = gender === 'male' || gender === 'gentleman';
      const isFemale = gender === 'female' || gender === 'lady';
      if (genderTab === 'gentlemen' && !isMale) return false;
      if (genderTab === 'ladies' && !isFemale) return false;

      // 2. Search search by code, finalAge, or residence
      if (deferredSearch) {
        const term = deferredSearch.toLowerCase();
        const codeMatch = (c.code || '').toLowerCase().includes(term);
        const resMatch = (c.locationOfResidence || '').toLowerCase().includes(term);
        const relMatch = (c.religion || '').toLowerCase().includes(term);
        if (!codeMatch && !resMatch && !relMatch) return false;
      }

      // 3. Status
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;

      // 4. Residence
      if (filterLocation !== 'All' && c.locationOfResidence !== filterLocation) return false;

      // 5. Religion
      if (filterReligion !== 'All' && c.religion !== filterReligion) return false;

      // 6. Admin
      if (filterAdmin !== 'All' && c.assignedTo !== filterAdmin) return false;

      // 7. Age range
      const ageVal = c.age || c.finalAge;
      if (minAge && (!ageVal || ageVal < parseInt(minAge))) return false;
      if (maxAge && (!ageVal || ageVal > parseInt(maxAge))) return false;

      // 8. Height range
      if (minHeight && (!c.height || parseFloat(c.height) < parseFloat(minHeight))) return false;
      if (maxHeight && (!c.height || parseFloat(c.height) > parseFloat(maxHeight))) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'age-asc') {
        return (a.age || a.finalAge || 0) - (b.age || b.finalAge || 0);
      }
      if (sortBy === 'age-desc') {
        return (b.age || b.finalAge || 0) - (a.age || a.finalAge || 0);
      }
      return 0;
    });
  }, [clients, genderTab, deferredSearch, filterStatus, filterLocation, filterReligion, filterAdmin, minAge, maxAge, minHeight, maxHeight, sortBy]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(filteredCandidates.map(c => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleSelectClient = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds(prev => [...prev, id]);
    } else {
      setSelectedClientIds(prev => prev.filter(i => i !== id));
    }
  };

  const confirmBulkDelete = async () => {
    await deleteMultipleClients(selectedClientIds);
    setSelectedClientIds([]);
  };

  const confirmDeleteProfile = async () => {
    if (profileToDelete) {
      await deleteClient(profileToDelete);
      setProfileToDelete(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Code', 'Gender', 'Age', 'Residence', 'Religion', 'Status', 'GUC Status', 'Height', 'Assigned Admin'];
    const csvRows = [
      headers.join(','),
      ...filteredCandidates.map(c => [
        `"${c.code || 'C-XXX'}"`,
        `"${c.gender || ''}"`,
        `"${c.age || c.finalAge || ''}"`,
        `"${c.locationOfResidence || ''}"`,
        `"${c.religion || ''}"`,
        `"${c.status}"`,
        `"${c.areYouGucian || 'No'}"`,
        `"${c.height || ''}"`,
        `"${users.find(u => u.id === c.assignedTo)?.name || 'Unassigned'}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `matchmaking_profiles_${genderTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Approved</Badge>;
      case 'Pending':
      case 'Lead':
        return <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20">Pending review</Badge>;
      case 'Rejected':
      case 'Expired':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Rejected</Badge>;
      case 'Hold':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Extracted Reusable Profile View Dialog content (Deduplicated Desktop/Mobile code)
  const renderProfileDialogContent = (candidate: any) => {
    const isRevealed = revealedClients[candidate.id] === true;
    const rawProf = rawProfiles.find(rp => rp.id === candidate.id) || candidate;
    const dispPhone = isRevealed ? rawProf.phone || rawProf.phoneNumber : candidate.phone;
    const dispEmail = isRevealed ? rawProf.email : maskEmail(candidate.email);
    const dispFB = isRevealed ? rawProf.facebookLink : maskFacebook(candidate.facebookLink);
    const comments = candidate.comments || [];

    return (
      <DialogContent className="w-[95vw] max-w-[1000px] sm:max-w-[90vw] md:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0 border border-white/10 bg-zinc-900/90 backdrop-blur-xl text-white shadow-2xl rounded-2xl shadow-black/80">
        <DialogHeader className="p-6 border-b border-white/5 bg-zinc-900/40 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
              Candidate Details: <span className="text-pink-400 font-black">{candidate.code || 'C-XXX'}</span>
              {getStatusBadge(candidate.status)}
            </DialogTitle>
            <p className="text-xs text-zinc-400 mt-1">Full profile mapping for matchmaker audits.</p>
          </div>
          <div className="pr-8 flex items-center gap-3">
            {!isRevealed && isManagerOrAdmin && (
              <Button 
                onClick={() => handleReveal(candidate.id)} 
                className="bg-amber-600 hover:bg-amber-700 text-white border-none font-extrabold h-9 px-4 rounded-xl text-xs"
              >
                <Unlock className="h-3.5 w-3.5 mr-2" /> Reveal Sensitive Details
              </Button>
            )}
            {isRevealed && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-extrabold rounded-xl">
                UNLOCKED ADMIN PRIVACY
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Candidate Info Grid content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Bento: Primary Dating Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                    <Smile className="h-4 w-4" /> Personal Metrics
                  </h4>
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Gender:</span>
                      <span className="font-semibold text-white">{candidate.gender || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Age:</span>
                      <span className="font-semibold text-white">{candidate.age || candidate.finalAge || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Height:</span>
                      <span className="font-semibold text-white">{candidate.height || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Residence:</span>
                      <span className="font-semibold text-white">{candidate.locationOfResidence || 'Not set'}</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Education & Career
                  </h4>
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">University:</span>
                      <span className="font-semibold text-white truncate max-w-[120px]">{candidate.university || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Faculty:</span>
                      <span className="font-semibold text-white truncate max-w-[120px]">{candidate.faculty || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Job Title:</span>
                      <span className="font-semibold text-white truncate max-w-[120px]">{candidate.jobTitle || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Origin:</span>
                      <span className="font-semibold text-white">{candidate.originOfResidence || 'Not specified'}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Partner Preferences Bento Card */}
              <Card className="bg-zinc-900/50 border-white/5 p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                  <Heart className="h-4 w-4" /> Partner Criteria & Matching Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-300">
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Target Age Range:</span>
                      <span className="font-semibold text-white">{candidate.ageRangePartnerPreferences || 'Open'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Target Height Range:</span>
                      <span className="font-semibold text-white">{candidate.heightPartnerPreferences || 'Open'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Accepted Residencies:</span>
                      <span className="font-semibold text-white">{candidate.acceptableResidencesPartnerPreferences || 'Any'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Target Origin:</span>
                      <span className="font-semibold text-white">{candidate.acceptableOriginsPartnerPreferences || 'Open'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Target Education:</span>
                      <span className="font-semibold text-white">{candidate.acceptableEducationPartnerPreferences || 'Open'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Must Have Qualities:</span>
                      <span className="font-semibold text-white truncate max-w-[120px]">{candidate.qualitiesDescriptionPartnerPreferences || 'None set'}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Personal Bio Description Block */}
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Candidate Self Description
                </h5>
                <p className="text-zinc-300 text-xs leading-relaxed italic">{candidate.describeYourself || 'No candidate self description provided.'}</p>
              </div>
            </div>

            {/* Right Bento: Admin / Audit Metrics & Secret Notes */}
            <div className="space-y-6">
              {/* RLS Masked Sensitive Card */}
              <Card className="bg-zinc-950/80 border-amber-500/20 p-4 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Matchmaker Vault
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Full Legal Name</span>
                    <span className="font-semibold text-zinc-200">{candidate.fullName || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Direct Phone Number</span>
                    <span className="font-mono text-zinc-200">{dispPhone || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="text-zinc-200">{dispEmail || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Facebook Profile Link</span>
                    {candidate.facebookLink ? (
                      isRevealed ? (
                        <a href={candidate.facebookLink} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline flex items-center gap-1">
                          Visit Facebook Profile <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-400 font-mono">{dispFB}</span>
                      )
                    ) : (
                      <span className="text-zinc-600 italic">Not set</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Internal Engagement & Match Audit Comments */}
              <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-pink-400" /> Matchmaker Logs ({comments.length})
                  </h5>
                  {isManagerOrAdmin && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-6 bg-pink-600 hover:bg-pink-700 text-[10px] font-extrabold rounded-lg px-2">
                          + Add Log
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-sm rounded-xl">
                        <DialogHeader>
                          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300">Add Log Entry</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-3">
                          <Textarea 
                            placeholder="Type Matchmaker internal comment..." 
                            className="bg-zinc-950 border-zinc-800 text-xs min-h-[80px]"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button 
                            onClick={() => handleAddComment(candidate.id)} 
                            className="w-full bg-pink-600 hover:bg-pink-700 text-xs font-bold h-9"
                          >
                            Post Log Entry
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {comments.length > 0 ? (
                    comments.map(c => (
                      <div key={c.id} className="bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 text-[11px] space-y-1.5">
                        <div className="flex justify-between items-center text-zinc-500">
                          <span className="font-bold text-pink-400/90">{c.authorName || 'Matchmaker'}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-200">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-600 italic text-center py-4">No comments recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-950/20 via-background to-pink-950/20 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Profiles Directory <Users className="h-5 w-5 text-pink-400" />
          </h2>
          <p className="text-sm text-zinc-400">
            Browse and manage candidate profiles. Privacy locks are securely active.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="border-white/10 hover:bg-zinc-900 text-white">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>

          <Dialog open={isNewProfileOpen} onOpenChange={setIsNewProfileOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 hover:from-pink-600 hover:to-purple-700 font-semibold shadow-lg shadow-pink-500/20">
                <Plus className="mr-2 h-4 w-4" /> Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-black/80">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-500" /> Create Candidate Profile
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-zinc-400">Full Name</Label>
                  <Input value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="Ahmed Mahmoud" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-zinc-400">Gender</Label>
                    <Select value={newProfileGender} onValueChange={(val: 'Male' | 'Female') => setNewProfileGender(val)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Male">Gentleman (Male)</SelectItem>
                        <SelectItem value="Female">Lady (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-zinc-400">Age</Label>
                    <Input type="number" value={newProfileAge} onChange={e => setNewProfileAge(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="28" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">Phone</Label>
                  <Input value={newProfilePhone} onChange={e => setNewProfilePhone(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="+20 100 123 4567" />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">Email</Label>
                  <Input value={newProfileEmail} onChange={e => setNewProfileEmail(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="candidate@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-zinc-400">Residence</Label>
                    <Input value={newProfileResidence} onChange={e => setNewProfileResidence(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="Tagamoa, Cairo" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-zinc-400">Religion</Label>
                    <Select value={newProfileReligion} onValueChange={setNewProfileReligion}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Muslim">Muslim</SelectItem>
                        <SelectItem value="Christian">Christian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">Assigned Admin</Label>
                  <Select value={newProfileAssignedTo} onValueChange={setNewProfileAssignedTo}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select admin" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddProfile} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 font-bold h-11 mt-2">
                  Create Candidate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs list for Gender Division */}
      <Tabs value={genderTab} onValueChange={(val: any) => { setGenderTab(val); setSelectedClientIds([]); }} className="space-y-6">
        <TabsList className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 p-1 rounded-xl flex w-full md:w-max justify-start md:justify-center shadow-lg shadow-black/30">
          <TabsTrigger value="gentlemen" className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-wider text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" /> Gentlemen ({clients.filter(c => c.gender?.toLowerCase() === 'male' || c.gender?.toLowerCase() === 'gentleman').length})
          </TabsTrigger>
          <TabsTrigger value="ladies" className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-wider text-xs data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" /> Ladies ({clients.filter(c => c.gender?.toLowerCase() === 'female' || c.gender?.toLowerCase() === 'lady').length})
          </TabsTrigger>
        </TabsList>

        {/* Multi-Dimensional Advanced Filters Grid */}
        <Card className="hidden md:block bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Filter className="h-4 w-4 text-pink-400" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300">Advanced Match Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Search Code..." 
                    className="pl-8 bg-zinc-900 border-zinc-800 text-xs h-9 text-white placeholder:text-zinc-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="All">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Hold">Hold</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Location</Label>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="All">All locations</SelectItem>
                    {uniqueLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Religion */}
              <div className="space-y-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Religion</Label>
                <Select value={filterReligion} onValueChange={setFilterReligion}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="All">All religions</SelectItem>
                    {uniqueReligions.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range */}
              <div className="space-y-1 col-span-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Age Range</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white p-2" 
                    value={minAge} 
                    onChange={e => setMinAge(e.target.value)} 
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white p-2" 
                    value={maxAge} 
                    onChange={e => setMaxAge(e.target.value)} 
                  />
                </div>
              </div>

              {/* Assigned Admin */}
              <div className="space-y-1">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Assigned Admin</Label>
                <Select value={filterAdmin} onValueChange={setFilterAdmin}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="All">All admins</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Height & Sorting Extra row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Height:</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Min m" 
                    className="w-20 bg-zinc-900 border-zinc-800 text-xs h-8 text-white p-2" 
                    value={minHeight}
                    onChange={e => setMinHeight(e.target.value)}
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Max m" 
                    className="w-20 bg-zinc-900 border-zinc-800 text-xs h-8 text-white p-2" 
                    value={maxHeight}
                    onChange={e => maxHeightSet(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-xs h-8 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                    <SelectItem value="newest">Newest profiles</SelectItem>
                    <SelectItem value="age-asc">Age (Low → High)</SelectItem>
                    <SelectItem value="age-desc">Age (High → Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Table View */}
                {/* Mobile Float Filter Button & Toggle Panel */}
        <div className="md:hidden flex justify-between items-center gap-3 p-4 bg-zinc-950 border border-white/5 rounded-xl mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search Code, Residence..." 
              className="pl-8 bg-zinc-900 border-zinc-800 text-xs h-9 text-white placeholder:text-zinc-600 rounded-lg"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="bg-zinc-900 border border-white/10 text-white rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs"
          >
            <Filter className="h-3.5 w-3.5 text-pink-400" />
            Filters
            {(filterStatus !== 'All' || filterLocation !== 'All' || filterReligion !== 'All' || filterAdmin !== 'All' || minAge || maxAge || minHeight || maxHeight) && (
              <span className="bg-pink-500 text-white rounded-full text-[10px] px-1 font-bold">!</span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
          <div className={`fixed bottom-0 left-0 right-0 max-h-[85vh] bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 overflow-y-auto transition-transform duration-300 transform ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full'} text-white space-y-6`}>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Filter className="h-5 w-5 text-pink-400" /> Advanced Filters
              </h3>
              <Button variant="ghost" onClick={() => setIsMobileFilterOpen(false)} className="text-zinc-400 hover:text-white text-xs font-semibold">
                Done
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Hold">Hold</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Location</Label>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All locations</SelectItem>
                    {uniqueLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Religion */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Religion</Label>
                <Select value={filterReligion} onValueChange={setFilterReligion}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All religions</SelectItem>
                    {uniqueReligions.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Age Range</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white p-2 flex-1" 
                    value={minAge} 
                    onChange={e => setMinAge(e.target.value)} 
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white p-2 flex-1" 
                    value={maxAge} 
                    onChange={e => setMaxAge(e.target.value)} 
                  />
                </div>
              </div>

              {/* Height Range */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Height Range</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Min m" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white p-2 flex-1" 
                    value={minHeight}
                    onChange={e => setMinHeight(e.target.value)}
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Max m" 
                    className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white p-2 flex-1" 
                    value={maxHeight}
                    onChange={e => maxHeightSet(e.target.value)}
                  />
                </div>
              </div>

              {/* Assigned Admin */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Assigned Admin</Label>
                <Select value={filterAdmin} onValueChange={setFilterAdmin}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="All">All admins</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Sort by</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="newest">Newest profiles</SelectItem>
                    <SelectItem value="age-asc">Age (Low → High)</SelectItem>
                    <SelectItem value="age-desc">Age (High → Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold h-11 rounded-xl">
              Apply Filters
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-zinc-900/30 via-zinc-950/10 to-zinc-900/30 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl overflow-hidden shadow-black/50">
          <CardContent className="p-0">
            {selectedClientIds.length > 0 && isManagerOrAdmin && (
              <div className="bg-rose-950/20 border-b border-rose-500/20 px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300">{selectedClientIds.length} candidate profiles selected</span>
                <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="bg-rose-600 hover:bg-rose-700 h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Bulk Delete
                </Button>
              </div>
            )}

            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-white/5">
                  <TableHead className="w-[50px] py-4 px-6">
                    <input 
                      type="checkbox" 
                      className="accent-pink-500 rounded border-zinc-800 bg-zinc-900"
                      checked={selectedClientIds.length === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Code</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Age</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Residence</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Religion</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Status</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Contact details</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase">Admin</TableHead>
                  <TableHead className="text-zinc-400 font-bold py-4 px-6 text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map(candidate => {
                  const isRevealed = revealedClients[candidate.id] === true;
                  const rawProf = rawProfiles.find(rp => rp.id === candidate.id) || candidate;
                  
                  // Read unmasked contact if revealed
                  const dispPhone = isRevealed ? rawProf.phone || rawProf.phoneNumber : candidate.phone;
                  const dispEmail = isRevealed ? rawProf.email : maskEmail(candidate.email);
                  const dispFB = isRevealed ? rawProf.facebookLink : maskFacebook(candidate.facebookLink);

                  return (
                    <TableRow key={candidate.id} className="border-b border-white/5 hover:bg-zinc-900/20 transition-all group">
                      <TableCell className="py-4 px-6">
                        <input 
                          type="checkbox" 
                          className="accent-pink-500 rounded border-zinc-800 bg-zinc-900"
                          checked={selectedClientIds.includes(candidate.id)}
                          onChange={(e) => handleSelectClient(candidate.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-extrabold text-white py-4 px-6 flex items-center gap-2">
                        <span>{candidate.code || candidate.memberId || 'C-XXX'}</span>
                        {candidate.areYouGucian?.toLowerCase().includes('yes') && (
                          <Badge className="bg-pink-500 text-white border-none text-[9px] font-black tracking-widest px-1 py-0 h-4">GUC</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-300 font-medium py-4 px-6">{candidate.age || candidate.finalAge || 'N/A'}</TableCell>
                      <TableCell className="text-zinc-300 py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{candidate.locationOfResidence || 'Not set'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300 py-4 px-6">{candidate.religion || 'Not set'}</TableCell>
                      <TableCell className="py-4 px-6">{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Phone className="h-3 w-3" />
                            <span className="font-mono text-[11px]">{dispPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{dispEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className="border-white/10 text-zinc-400 font-semibold bg-zinc-900/50">
                          {users.find(u => u.id === candidate.assignedTo)?.name || 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reveal Button */}
                          {!isRevealed && isManagerOrAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReveal(candidate.id)} 
                              className="h-8 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 px-2 rounded-xl text-xs font-bold"
                              title="Reveal private contact info"
                            >
                              <Unlock className="h-3 w-3 mr-1" /> Reveal
                            </Button>
                          )}
                          {isRevealed && (
                            <Badge className="bg-amber-600/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-xl text-[10px] font-black tracking-widest">
                              REVEALED
                            </Badge>
                          )}

                          {/* Manage Dialogue */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="h-8 border-white/10 text-zinc-300 hover:bg-zinc-900 rounded-xl text-xs font-semibold px-3">
                                View Profile
                              </Button>
                            </DialogTrigger>
                            {renderProfileDialogContent(candidate)}
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCandidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-zinc-500 italic text-sm">
                      No candidate profiles found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="block md:hidden p-4 space-y-4">
              {filteredCandidates.map(candidate => {
                const isRevealed = revealedClients[candidate.id] === true;
                const rawProf = rawProfiles.find(rp => rp.id === candidate.id) || candidate;
                
                // Read unmasked contact if revealed
                const dispPhone = isRevealed ? rawProf.phone || rawProf.phoneNumber : candidate.phone;
                const dispEmail = isRevealed ? rawProf.email : maskEmail(candidate.email);

                return (
                  <Card key={candidate.id} className="bg-gradient-to-br from-zinc-900/50 to-zinc-950 border border-white/10 shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2 border-b border-white/5 bg-zinc-900/20 p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-base tracking-wide">{candidate.code || candidate.memberId || 'C-XXX'}</span>
                            {candidate.areYouGucian?.toLowerCase().includes('yes') && (
                              <Badge className="bg-pink-500 text-white border-none text-[8px] font-black tracking-widest px-1 py-0 h-4">GUC</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                            <MapPin className="h-3 w-3 text-zinc-500" />
                            <span>{candidate.locationOfResidence || 'Not set'}</span>
                          </div>
                        </div>
                        {getStatusBadge(candidate.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Age</span>
                          <span className="font-semibold text-white">{candidate.age || candidate.finalAge || 'N/A'}</span>
                        </div>
                        <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Religion</span>
                          <span className="font-semibold text-white">{candidate.religion || 'Not set'}</span>
                        </div>
                      </div>

                      {/* Basic Contact Preview */}
                      <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-zinc-500" />
                            <span className="font-mono text-[11px]">{dispPhone}</span>
                          </div>
                          {!isRevealed && isManagerOrAdmin && (
                            <Button 
                              variant="ghost" 
                              size="xs" 
                              onClick={() => handleReveal(candidate.id)} 
                              className="h-5 text-amber-500 hover:text-amber-400 p-0 text-[10px] font-bold"
                            >
                              Reveal
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Mail className="h-3 w-3 text-zinc-600" />
                          <span className="truncate max-w-[190px]">{dispEmail}</span>
                        </div>
                      </div>

                      {/* Rep Assigned */}
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                        <span>Assigned Rep:</span>
                        <Badge variant="outline" className="border-white/5 text-zinc-400 text-[9px] font-medium bg-zinc-900/30">
                          {users.find(u => u.id === candidate.assignedTo)?.name || 'Unassigned'}
                        </Badge>
                      </div>

                      {/* Actions Trigger */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-900/20">
                            View Profile Details
                          </Button>
                        </DialogTrigger>
                        {renderProfileDialogContent(candidate)}
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredCandidates.length === 0 && (
                <div className="text-center py-16 text-zinc-500 italic text-sm">
                  No candidate profiles found matching your search.
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </Tabs>

      {/* CSV Import Sections */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="bg-gradient-to-br from-zinc-900/30 via-zinc-950/10 to-zinc-900/30 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Download className="h-5 w-5 text-pink-400" />
              Import Matchmaker CSV
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Bulk upload candidate profiles directly from a google form or excel responses sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportData />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/30 via-zinc-950/10 to-zinc-900/30 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-pink-400" />
              Import History & Rollback
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Track recent file imports and rollback complete files if errors are discovered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportHistory />
          </CardContent>
        </Card>
      </div>

      {/* Audit confirm modals */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteProfile}
        title="Delete Candidate Profile"
        description="DANGER: Are you absolutely sure you want to permanently delete this candidate? All matched proposals and history will be lost."
      />

      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Profiles"
        description={`DANGER: Are you sure you want to permanently delete the ${selectedClientIds.length} selected candidate profiles?`}
      />
    </div>
  );
}
