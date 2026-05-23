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
  Download
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
        <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
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
                            <DialogContent className="max-w-[1000px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border border-white/10 bg-zinc-900/90 backdrop-blur-xl text-white shadow-2xl rounded-2xl shadow-black/80">
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
                                            <span className="text-zinc-500">Is GUCIAN?</span>
                                            <span className="font-semibold text-white">{candidate.areYouGucian || 'No'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">GUC ID:</span>
                                            <span className="font-mono text-white">{candidate.gucId || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Field of Study:</span>
                                            <span className="font-semibold text-white truncate max-w-[120px]">{candidate.universityFieldOfStudy || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <span className="text-zinc-500">Current Job:</span>
                                            <span className="font-semibold text-white truncate max-w-[120px]">{candidate.currentJob || 'Not set'}</span>
                                          </div>
                                        </div>
                                      </Card>

                                      <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-2">
                                        <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                                          <Compass className="h-4 w-4" /> Faith & Values
                                        </h4>
                                        <div className="space-y-1.5 text-xs text-zinc-300">
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Religion:</span>
                                            <span className="font-semibold text-white">{candidate.religion || 'Not set'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Denomination:</span>
                                            <span className="font-semibold text-white">{candidate.religiousDenomination || 'Not set'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Regular Prayer:</span>
                                            <span className="font-semibold text-white">{candidate.prayRegularly || 'Not set'}</span>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <span className="text-zinc-500">Hijab preference:</span>
                                            <span className="font-semibold text-white">{candidate.hijabPreference || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </Card>

                                      <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-2">
                                        <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                                          <Award className="h-4 w-4" /> Life Status
                                        </h4>
                                        <div className="space-y-1.5 text-xs text-zinc-300">
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Marital Status:</span>
                                            <span className="font-semibold text-white">{candidate.maritalStatus || 'Single'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Have Children:</span>
                                            <span className="font-semibold text-white">{candidate.haveChildren || 'No'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-white/5">
                                            <span className="text-zinc-500">Smoke / Drink:</span>
                                            <span className="font-semibold text-white">{candidate.smokeOrDrink || 'No'}</span>
                                          </div>
                                          <div className="flex justify-between py-1">
                                            <span className="text-zinc-500">Willing Relocate:</span>
                                            <span className="font-semibold text-white">{candidate.willingToRelocate || 'No'}</span>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>

                                    {/* Self Introduction / Partner Preferences */}
                                    <div className="space-y-4">
                                      <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Self Introduction</h4>
                                        <p className="text-sm text-zinc-200 leading-relaxed italic bg-zinc-950/40 p-3 rounded-lg border border-white/5">
                                          {candidate.selfIntroduction ? `"${candidate.selfIntroduction}"` : 'No introduction provided.'}
                                        </p>
                                      </div>

                                      <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Partner Preferences</h4>
                                        <p className="text-sm text-zinc-200 leading-relaxed italic bg-zinc-950/40 p-3 rounded-lg border border-white/5">
                                          {candidate.partnerPreferences ? `"${candidate.partnerPreferences}"` : 'No preference text provided.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Bento: Contacts & Matchmaking Actions */}
                                  <div className="space-y-6">
                                    {/* Sensitive Contacts Panel */}
                                    <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-3">
                                      <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                                        <Lock className="h-4 w-4" /> Sensitive Contacts
                                      </h4>
                                      <div className="space-y-2.5 text-xs">
                                        {isRevealed && (
                                          <div className="bg-amber-600/10 text-amber-300 p-2 rounded border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider text-center">
                                            Admin Session Reveal Active
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <span className="text-zinc-500 font-semibold block">Full Name:</span>
                                          <span className="font-bold text-white text-sm">{isRevealed ? rawProf.fullName || rawProf.name : '🔒 [Name Encrypted]'}</span>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-zinc-500 font-semibold block">Phone Number:</span>
                                          <div className="flex items-center gap-2 text-white">
                                            <Phone className="h-3.5 w-3.5 text-zinc-500" />
                                            <span className="font-mono text-sm">{dispPhone}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-zinc-500 font-semibold block">Email Address:</span>
                                          <div className="flex items-center gap-2 text-white">
                                            <Mail className="h-3.5 w-3.5 text-zinc-500" />
                                            <span className="font-mono">{dispEmail}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-zinc-500 font-semibold block">Facebook Link:</span>
                                          <div className="flex items-center gap-2 text-white">
                                            <Facebook className="h-3.5 w-3.5 text-zinc-500" />
                                            <span>{dispFB}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </Card>

                                    {/* Status & Workload Updates */}
                                    <Card className="bg-zinc-900/50 border-white/5 p-4 rounded-xl space-y-4">
                                      <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                                        <Settings className="h-4 w-4" /> Admin Controls
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <Label className="text-zinc-400 text-xs">Profile Status</Label>
                                          <select 
                                            className="w-full bg-zinc-900 border-zinc-800 text-white rounded-lg h-9 text-xs p-1 focus:ring-pink-500"
                                            value={candidate.status}
                                            onChange={(e) => updateClient(candidate.id, { status: e.target.value as any })}
                                          >
                                            <option value="Pending">Pending review</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Hold">Hold</option>
                                            <option value="Rejected">Rejected</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-zinc-400 text-xs">Assigned Matchmaker</Label>
                                          <select 
                                            className="w-full bg-zinc-900 border-zinc-800 text-white rounded-lg h-9 text-xs p-1 focus:ring-pink-500"
                                            value={candidate.assignedTo || 'unassigned'}
                                            onChange={(e) => updateClient(candidate.id, { assignedTo: e.target.value === 'unassigned' ? '' : e.target.value })}
                                          >
                                            <option value="unassigned">Unassigned</option>
                                            {users.map(u => (
                                              <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                          </select>
                                        </div>

                                        {isManagerOrAdmin && (
                                          <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="w-full bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/20 h-9 rounded-xl font-bold text-xs"
                                            onClick={() => {
                                              setProfileToDelete(candidate.id);
                                              setIsDeleteDialogOpen(true);
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Candidate
                                          </Button>
                                        )}
                                      </div>
                                    </Card>
                                  </div>
                                </div>

                                {/* Custom Comments & Interaction Logging Tab inside Sheet */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                  {/* Interactions Logs */}
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-pink-400" /> Log Matchmaker Call / Contact
                                    </h3>
                                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 space-y-3">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-zinc-500 text-[10px]">Type</Label>
                                          <select 
                                            className="w-full bg-zinc-900 border-zinc-800 text-white rounded h-8 text-xs p-1"
                                            value={interactionType}
                                            onChange={(e) => setInteractionType(e.target.value as any)}
                                          >
                                            <option value="Call">Call</option>
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Email">Email</option>
                                            <option value="Visit">Visit</option>
                                          </select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-zinc-500 text-[10px]">Outcome</Label>
                                          <select 
                                            className="w-full bg-zinc-900 border-zinc-800 text-white rounded h-8 text-xs p-1"
                                            value={interactionOutcome}
                                            onChange={(e) => setInteractionOutcome(e.target.value as any)}
                                          >
                                            <option value="Interested">Interested</option>
                                            <option value="Not Answered">Not Answered</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="Other">Other</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-zinc-500 text-[10px]">Notes</Label>
                                        <Textarea 
                                          placeholder="Enter brief interaction outcomes..." 
                                          className="bg-zinc-900 border-zinc-800 text-xs min-h-[60px]"
                                          value={interactionNotes}
                                          onChange={(e) => setInteractionNotes(e.target.value)}
                                        />
                                      </div>
                                      <Button onClick={() => handleAddInteraction(candidate.id)} className="w-full h-8 text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg">
                                        Log Contact
                                      </Button>
                                    </div>

                                    {/* Interaction History List */}
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                      {candidate.interactions && candidate.interactions.length > 0 ? (
                                        candidate.interactions.map(item => (
                                          <div key={item.id} className="bg-zinc-900/50 p-3 rounded-lg border border-white/5 text-xs space-y-1">
                                            <div className="flex justify-between text-zinc-500">
                                              <span className="font-bold text-pink-400">{item.type} → {item.outcome}</span>
                                              <span>{format(parseISO(item.date), 'MMM d, yyyy')}</span>
                                            </div>
                                            <p className="text-zinc-200 italic">"{item.notes}"</p>
                                            <div className="text-[10px] text-zinc-600">Logged by: {item.author}</div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-zinc-600 italic text-center py-4">No logged contacts for this candidate.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Comments section */}
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-pink-400" /> Internal Matchmaker Notes
                                    </h3>
                                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 space-y-2">
                                      <Textarea 
                                        placeholder="Add internal candidate comment/updates..." 
                                        className="bg-zinc-900 border-zinc-800 text-xs min-h-[70px]"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                      />
                                      <Button onClick={() => handleAddComment(candidate.id)} className="w-full h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg">
                                        Save Comment
                                      </Button>
                                    </div>

                                    {/* Comment History List */}
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                      {candidate.comments && candidate.comments.length > 0 ? (
                                        candidate.comments.map(c => (
                                          <div key={c.id} className="bg-zinc-900/50 p-3 rounded-lg border border-white/5 text-xs space-y-1">
                                            <div className="flex justify-between text-zinc-500">
                                              <span className="font-bold text-zinc-400">{c.author}</span>
                                              <span>{format(parseISO(c.date), 'MMM d, yyyy')}</span>
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
                            </DialogContent>
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
