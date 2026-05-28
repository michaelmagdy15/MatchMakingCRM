import React, { useState, useDeferredValue } from 'react';
import { useAppContext } from './context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isBefore, addDays, differenceInDays } from 'date-fns';
import { Client, LeadCategory, LeadInterest, LeadSource, LeadStage, Branch, InteractionType, InteractionOutcome } from './types';
import { SALES_MEMBERS } from './constants';
import { Phone, Calendar, MessageSquare, Plus, Filter, FileSpreadsheet, Download, UserCheck, ArrowRight } from 'lucide-react';
import ImportData from './ImportData';
import ImportHistory from './ImportHistory';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronLeft, ChevronRight, User, Search, MapPin, Tag, Info, AlertCircle, Activity, QrCode, Copy } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';

export default function Leads() {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteMultipleClients, 
    deleteClient, 
    addComment, 
    addInteraction,
    currentUser, 
    users, 
    canAssignLeads, 
    canDeleteRecords 
  } = useAppContext();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Client | null>(null);
  const [newComment, setNewComment] = useState('');
  const [interactionType, setInteractionType] = useState<InteractionType>('Call');
  const [interactionOutcome, setInteractionOutcome] = useState<InteractionOutcome>('Interested');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<Branch | 'All'>('All');
  const [filterStage, setFilterStage] = useState<LeadStage | 'All'>('All');
  const [filterInterest, setFilterInterest] = useState<LeadInterest | 'All'>('All');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'score'>('default');

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredFilterBranch = useDeferredValue(filterBranch);
  const deferredFilterStage = useDeferredValue(filterStage);
  const deferredFilterInterest = useDeferredValue(filterInterest);
  const deferredFilterAssignedTo = useDeferredValue(filterAssignedTo);
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredActiveTab = useDeferredValue(activeTab);
  
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('Instagram');
  const [newLeadBranch, setNewLeadBranch] = useState<Branch | ''>('');
  const [newLeadAssignedTo, setNewLeadAssignedTo] = useState<string>('');
  
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Client | null>(null);


  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllLeadsDialogOpen, setIsDeleteAllLeadsDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;


  const allLeads = clients.filter(c => c.status === 'Lead');

  const calculateLeadScore = (lead: Client) => {
    let score = 0;
    
    // Source
    switch (lead.source) {
      case 'Walk-in': score += 10; break;
      case 'Instagram': score += 7; break;
      case 'WhatsApp': score += 6; break;
      case 'TikTok': score += 5; break;
      case 'Other': score += 3; break;
    }

    // Interest
    switch (lead.interest) {
      case 'Interested': score += 15; break;
      case 'Pending': score += 5; break;
      case 'Not Interested': score += 0; break;
    }

    // Stage
    switch (lead.stage) {
      case 'Consultation Scheduled': score += 10; break;
      case 'Follow Up': score += 5; break;
      case 'New': score += 0; break;
    }

    // Days since last contact
    let daysDiff = 20; 
    if (lead.lastContactDate) {
      const diff = differenceInDays(new Date(), parseISO(lead.lastContactDate));
      daysDiff = Math.max(0, Math.min(20, diff));
    }
    score -= daysDiff;

    return Math.max(0, score);
  };
  
  const getFilteredLeads = () => {
    let filtered = [...allLeads];
    
    // Tab filtering
    switch (deferredActiveTab) {
      case 'unassigned': filtered = filtered.filter(l => !l.assignedTo); break;
      case 'instagram': filtered = filtered.filter(l => l.source === 'Instagram'); break;
      case 'whatsapp': filtered = filtered.filter(l => l.source === 'WhatsApp'); break;
      case 'walkin': filtered = filtered.filter(l => l.source === 'Walk-in'); break;
      case 'consultations': filtered = filtered.filter(l => l.stage === 'Consultation Scheduled'); break;
      case 'followup': filtered = filtered.filter(l => l.stage === 'Follow Up'); break;
    }

    // Search filtering
    if (deferredSearchTerm) {
      const term = deferredSearchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(term) || 
        l.phone.includes(term)
      );
    }

    if (deferredFilterBranch !== 'All') {
      filtered = filtered.filter(l => l.branch === deferredFilterBranch);
    }
    if (deferredFilterStage !== 'All') {
      filtered = filtered.filter(l => l.stage === deferredFilterStage);
    }
    if (deferredFilterInterest !== 'All') {
      filtered = filtered.filter(l => l.interest === deferredFilterInterest);
    }
    if (deferredFilterAssignedTo !== 'All') {
      filtered = filtered.filter(l => deferredFilterAssignedTo === 'unassigned' ? !l.assignedTo : l.assignedTo === deferredFilterAssignedTo);
    }

    if (deferredSortBy === 'score') {
      filtered.sort((a, b) => calculateLeadScore(b) - calculateLeadScore(a));
    }

    return filtered;
  };

  const leads = getFilteredLeads();
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(paginatedLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, id]);
    } else {
      setSelectedLeadIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkStageUpdate = async (stage: LeadStage) => {
    for (const id of selectedLeadIds) {
      await updateClient(id, { stage });
    }
    setSelectedLeadIds([]);
  };

  const handleBulkAssign = async (userId: string) => {
    for (const id of selectedLeadIds) {
      await updateClient(id, { assignedTo: userId === 'unassigned' ? '' : userId });
    }
    setSelectedLeadIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    await deleteMultipleClients(selectedLeadIds);
    setSelectedLeadIds([]);
  };

  const handleDeleteLead = async (id: string) => {
    setLeadToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (leadToDelete) {
      await deleteClient(leadToDelete);
      setLeadToDelete(null);
    }
  };

  const handleDeleteAllLeads = async () => {
    setIsDeleteAllLeadsDialogOpen(true);
  };

  const confirmDeleteAllLeads = async () => {
    const allLeadIds = allLeads.map(l => l.id);
    if (allLeadIds.length > 0) {
      await deleteMultipleClients(allLeadIds);
      setSelectedLeadIds([]);
    }
  };

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedLeadIds([]);
  }, [activeTab]);

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Region', 'Source', 'Stage', 'Interest', 'Loss Reason', 'Consultation Date', 'Last Contact', 'Next Reminder', 'Assigned To'];
    const csvRows = [
      headers.join(','),
      ...leads.map(l => {
        const assignedUser = l.assignedTo ? (users.find(u => u.id === l.assignedTo)?.name || l.assignedTo) : 'Unassigned';
        return [
          `"${l.name}"`,
          `"${l.phone}"`,
          `"${l.branch || ''}"`,
          `"${l.source || ''}"`,
          `"${l.stage || ''}"`,
          `"${l.interest || ''}"`,
          `"${l.category || ''}"`,
          `"${l.trialDate ? format(parseISO(l.trialDate), 'yyyy-MM-dd') : ''}"`,
          `"${l.lastContactDate ? format(parseISO(l.lastContactDate), 'yyyy-MM-dd') : ''}"`,
          `"${l.nextReminderDate ? format(parseISO(l.nextReminderDate), 'yyyy-MM-dd') : ''}"`,
          `"${assignedUser}"`
        ].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleAddComment = () => {
    if (selectedLead && newComment && currentUser) {
      addComment(selectedLead.id, newComment, currentUser.name);
      setNewComment('');
    }
  };

  const handleAddInteraction = () => {
    if (selectedLead && currentUser) {
      addInteraction(selectedLead.id, {
        type: interactionType,
        outcome: interactionOutcome,
        notes: interactionNotes,
        date: new Date().toISOString(),
        nextFollowUp: nextFollowUpDate || undefined
      });
      setInteractionNotes('');
      setNextFollowUpDate('');
    }
  };

  const handleAddLead = () => {
    if (newLeadName && newLeadPhone) {
      const newLead: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name: newLeadName,
        phone: newLeadPhone,
        status: 'Lead',
        source: newLeadSource,
        branch: newLeadBranch || undefined,
        stage: 'New',
        comments: [],
        interactions: [],
        assignedTo: newLeadAssignedTo || (currentUser?.role === 'rep' ? currentUser.id : undefined),
        lastContactDate: new Date().toISOString().split('T')[0],
        nextReminderDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      };
      addClient(newLead);
      setIsNewLeadOpen(false);
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadSource('Instagram');
      setNewLeadBranch('');
      setNewLeadAssignedTo('');
    }
  };

  const handleStageChange = (lead: Client, newStage: LeadStage) => {
    if (newStage === 'Converted') {
      setLeadToConvert(lead);
      setIsConvertDialogOpen(true);
    } else {
      updateClient(lead.id, { stage: newStage });
    }
  };

  const handleInterestChange = (lead: Client, newInterest: LeadInterest) => {
    if (newInterest === 'Not Interested') {
      updateClient(lead.id, { interest: newInterest, assignedTo: '' });
    } else {
      updateClient(lead.id, { interest: newInterest });
    }
  };

  const confirmConversion = () => {
    if (leadToConvert) {
      updateClient(leadToConvert.id, { 
        stage: 'Converted', 
        status: 'Active',
        startDate: new Date().toISOString()
      });
      setIsConvertDialogOpen(false);
      setLeadToConvert(null);
    }
  };

  const getInterestBadge = (interest?: LeadInterest) => {
    switch (interest) {
      case 'Interested': return <Badge className="bg-green-500">Interested</Badge>;
      case 'Not Interested': return <Badge variant="destructive">Not Interested</Badge>;
      case 'Pending': return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 20) return <Badge className="bg-green-500">{score}</Badge>;
    if (score >= 10) return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">{score}</Badge>;
    return <Badge variant="destructive">{score}</Badge>;
  };

  // Check if reminder is due (overdue or due within the next 3 days)
  const isReminderDue = (lead: Client) => {
    if (!lead.nextReminderDate) return false;
    const nextReminder = parseISO(lead.nextReminderDate);
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    
    return isBefore(nextReminder, threeDaysFromNow);
  };

  // Extracted Reusable Lead Dialog content (Deduplicated Desktop/Mobile code)
  const renderLeadDialogContent = (lead: Client) => {
    return (
      <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-[1400px] h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-3xl bg-background/95 backdrop-blur-xl text-white">
        <DialogHeader className="p-10 pb-6 bg-muted/30 border-b">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-extrabold tracking-tight">Lead Profile: <span className="text-primary">{lead.name}</span></DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                  #{lead.memberId || 'PENDING ID'}
                </div>
                <Badge variant="outline" className="rounded-full px-3 py-0.5 border-muted-foreground/30 font-bold text-[10px]">
                  {lead.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <Tabs defaultValue="information" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-0 mb-8 bg-transparent space-x-6 h-auto">
              <TabsTrigger 
                value="information" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground data-[state=active]:text-primary"
              >
                <User className="h-4 w-4 mr-2" />
                Information
              </TabsTrigger>
              <TabsTrigger 
                value="interactions" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground data-[state=active]:text-primary"
              >
                <Activity className="h-4 w-4 mr-2" />
                Interactions
              </TabsTrigger>
              <TabsTrigger 
                value="comments" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground data-[state=active]:text-primary"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="profilecard" 
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground data-[state=active]:text-primary"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Profile Code Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="information" className="mt-0 text-foreground">
              <div className="bg-muted/30 p-8 rounded-[32px] border-2 border-white/10 shadow-inner">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-3">
                  <User className="h-4 w-4 text-primary" />
                  Lead Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</Label>
                      <Select 
                        defaultValue={lead.source} 
                        onValueChange={(v) => updateClient(lead.id, { source: v as LeadSource })}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/5 rounded-xl h-12">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Walk-in">Referral</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Region</Label>
                      <Select 
                        defaultValue={lead.branch || ''} 
                        onValueChange={(v) => updateClient(lead.id, { branch: v as Branch })}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/5 rounded-xl h-12">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CAIRO">CAIRO</SelectItem>
                          <SelectItem value="GIZA">GIZA</SelectItem>
                          <SelectItem value="ONLINE">ONLINE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stage</Label>
                      <Select 
                        defaultValue={lead.stage} 
                        onValueChange={(v) => handleStageChange(lead, v as LeadStage)}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/5 rounded-xl h-12">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Consultation Scheduled">Interview / Consultation</SelectItem>
                          <SelectItem value="Follow Up">Follow Up</SelectItem>
                          <SelectItem value="Converted">Converted</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interest Level</Label>
                      <Select 
                        defaultValue={lead.interest} 
                        onValueChange={(v) => handleInterestChange(lead, v as LeadInterest)}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/5 rounded-xl h-12">
                          <SelectValue placeholder="Select interest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Interested">Interested</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Not Interested">Not Interested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                   <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category / Reason</Label>
                    <Select 
                      defaultValue={lead.category}
                      onValueChange={(v) => updateClient(lead.id, { category: v as LeadCategory })}
                    >
                      <SelectTrigger className="w-full bg-background/50 border-white/5 rounded-xl h-12">
                        <SelectValue placeholder="Select loss category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Location mismatch">Location mismatch</SelectItem>
                        <SelectItem value="Social status mismatch">Social status mismatch</SelectItem>
                        <SelectItem value="Price">Fee too high</SelectItem>
                        <SelectItem value="No answer">No response</SelectItem>
                        <SelectItem value="Age mismatch">Age mismatch</SelectItem>
                        <SelectItem value="Religious denomination mismatch">Religious denomination mismatch</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consultation / Interview Date</Label>
                    <Input 
                      type="date" 
                      className="w-full bg-background/50 border-white/5 rounded-xl h-12"
                      defaultValue={lead.trialDate || lead.expectedVisitDate ? format(parseISO((lead.trialDate || lead.expectedVisitDate)), 'yyyy-MM-dd') : ''}
                      onChange={(e) => updateClient(lead.id, { trialDate: new Date(e.target.value).toISOString(), expectedVisitDate: new Date(e.target.value).toISOString() })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 mt-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Reminder Date</Label>
                    <Input 
                      type="date" 
                      className="w-full bg-background/50 border-white/5 rounded-xl h-12"
                      defaultValue={lead.nextReminderDate ? format(parseISO(lead.nextReminderDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => updateClient(lead.id, { nextReminderDate: new Date(e.target.value).toISOString() })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="interactions" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="h-[400px] overflow-y-auto space-y-4 pr-4 custom-scrollbar bg-muted/10 p-6 rounded-[24px] border border-white/5">
                    {lead.interactions && lead.interactions.length > 0 ? (
                      [...lead.interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(interaction => (
                        <div key={interaction.id} className="bg-background/40 p-5 rounded-2xl border border-white/5 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                interaction.type === 'Call' ? 'bg-blue-500' :
                                interaction.type === 'WhatsApp' ? 'bg-green-500' :
                                interaction.type === 'Email' ? 'bg-amber-500' :
                                'bg-purple-500'
                              }>
                                {interaction.type}
                              </Badge>
                              <Badge variant="outline" className="border-primary/20 text-primary">
                                {interaction.outcome}
                              </Badge>
                            </div>
                            <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-tighter">
                              {format(parseISO(interaction.date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90 italic">"{interaction.notes}"</p>
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/50 border-t border-white/5 pt-2">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {interaction.author}</span>
                            {interaction.nextFollowUp && (
                              <span className="flex items-center gap-1 text-amber-500/80">
                                <Calendar className="h-3 w-3" /> Follow-up: {format(parseISO(interaction.nextFollowUp), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic gap-4">
                        <div className="p-4 bg-muted/20 rounded-full">
                          <Activity className="h-8 w-8 opacity-20" />
                        </div>
                        No interactions logged yet.
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-background/80 backdrop-blur-sm p-8 rounded-[32px] border border-white/10 shadow-2xl space-y-6 text-foreground">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Type</Label>
                        <Select value={interactionType} onValueChange={(v) => setInteractionType(v as InteractionType)}>
                          <SelectTrigger className="bg-muted/20 border-white/5 rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Visit">Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Outcome</Label>
                        <Select value={interactionOutcome} onValueChange={(v) => setInteractionOutcome(v as InteractionOutcome)}>
                          <SelectTrigger className="bg-muted/20 border-white/5 rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Interested">Interested</SelectItem>
                            <SelectItem value="Not Answered">Not Answered</SelectItem>
                            <SelectItem value="Scheduled Consultation">Scheduled Consultation</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Follow-up Reminder (Optional)</Label>
                      <Input 
                        type="date" 
                        className="bg-muted/20 border-white/5 rounded-xl h-10" 
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Interaction Notes</Label>
                      <Textarea 
                        placeholder="Summary of the conversation..." 
                        className="min-h-[100px] rounded-2xl bg-muted/20 border-white/5 focus:border-primary/30 transition-all resize-none p-4"
                        value={interactionNotes}
                        onChange={(e) => setInteractionNotes(e.target.value)}
                      />
                    </div>
                    <Button className="w-full rounded-2xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-transform" onClick={handleAddInteraction}>
                      Log Interaction
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-5 h-full">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-[32px] p-8 border border-primary/10 h-full flex flex-col items-center text-center space-y-6">
                    <div className="p-5 bg-background shadow-xl rounded-2xl rotate-3">
                      <Phone className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-xl tracking-tight">Structured Logging</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Log each call, message or visit with specific outcomes to build a detailed history of engagement.
                      </p>
                    </div>
                    <div className="w-full h-px bg-primary/10" />
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="p-4 bg-background/50 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black text-primary">{lead.interactions?.length || 0}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total Logs</div>
                      </div>
                      <div className="p-4 bg-background/50 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black text-primary">
                          {lead.lastContactDate ? differenceInDays(new Date(), parseISO(lead.lastContactDate)) : '∞'}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Days Since</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="h-[400px] overflow-y-auto space-y-4 pr-4 custom-scrollbar bg-muted/10 p-6 rounded-[24px] border border-white/5">
                    {lead.comments.length > 0 ? (
                      [...lead.comments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(comment => (
                        <div key={comment.id} className="bg-background/40 p-4 rounded-2xl text-sm border border-white/5 shadow-sm">
                          <p className="leading-relaxed text-foreground/90">{comment.text}</p>
                          <div className="flex justify-between mt-3 text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/60">
                            <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {comment.author}</span>
                            <span>{format(parseISO(comment.date), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                        No comments logged yet.
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-background/80 backdrop-blur-sm p-6 rounded-[32px] border border-white/10 shadow-2xl space-y-4 text-foreground">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">General Note</Label>
                    <Textarea 
                      placeholder="Type any additional internal notes here..." 
                      className="min-h-[120px] rounded-2xl bg-muted/20 border-white/5 focus:border-primary/30 transition-all resize-none p-4"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button className="w-full rounded-2xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={handleAddComment}>
                      Save Note
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 h-full flex flex-col justify-center items-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg">Internal Comments</h4>
                    <p className="text-sm text-muted-foreground px-4">Internal notes for team collaboration and background information.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="profilecard" className="mt-0 space-y-8">
               <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-[32px] border border-white/5">
                 <div className="text-center mb-8">
                   <h3 className="text-2xl font-black mb-2">Candidate Profile Card</h3>
                   <p className="text-muted-foreground">Unique identifier for matchmaking verification.</p>
                 </div>
                 
                 <div className="w-[320px] bg-gradient-to-br from-primary to-primary-foreground/30 p-6 rounded-3xl shadow-2xl text-white mb-8 border border-white/20 transform transition-transform hover:scale-105">
                   <div className="flex justify-between items-center mb-6">
                     <span className="text-xs uppercase tracking-widest font-black opacity-80">Matchmaking CRM</span>
                     <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
                       {lead.gender === 'Male' ? 'Gentleman' : lead.gender === 'Female' ? 'Lady' : 'Candidate'}
                     </Badge>
                   </div>
                   <div className="space-y-4 my-8 text-center">
                     <div className="text-sm font-bold opacity-80">Candidate Code</div>
                     <div className="text-5xl font-extrabold tracking-wider filter drop-shadow">
                       {lead.code || lead.memberId || 'N/A'}
                     </div>
                   </div>
                   <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                     <div>
                       <div className="text-[10px] uppercase tracking-widest opacity-60">Full Name</div>
                       <div className="text-sm font-bold truncate max-w-[180px]">{lead.name}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-[10px] uppercase tracking-widest opacity-60">Region</div>
                       <div className="text-xs font-bold">{lead.branch || 'N/A'}</div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex justify-center">
                   <Button 
                     onClick={async () => {
                       try {
                         await navigator.clipboard.writeText(lead.code || lead.memberId || lead.id);
                         alert('Candidate code copied to clipboard!');
                       } catch (err) {
                         alert('Failed to copy code');
                       }
                     }}
                     className="font-black uppercase tracking-widest px-8 py-6 rounded-2xl shadow-lg border-2 border-primary/20 hover:bg-primary"
                   >
                     <Copy className="mr-3 h-5 w-5" />
                     Copy Profile Code
                   </Button>
                 </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    );
  };

  const renderLeadsTable = (leadsData: Client[]) => (
    <div className="overflow-x-auto">
      
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedLeadIds.length === leadsData.length && leadsData.length > 0}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="hidden md:table-cell">Region</TableHead>
            <TableHead className="hidden md:table-cell">Source</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="hidden lg:table-cell">Interest</TableHead>
            <TableHead className="hidden lg:table-cell">Loss Category</TableHead>
            <TableHead className="hidden xl:table-cell">Consultation Date</TableHead>
            <TableHead className="hidden md:table-cell">Last Contact</TableHead>
            <TableHead>Next Reminder</TableHead>
            {canAssignLeads && <TableHead className="hidden lg:table-cell">Assigned To</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsData.map(lead => (
            <TableRow key={lead.id} className={isReminderDue(lead) ? (isBefore(parseISO(lead.nextReminderDate!), new Date()) ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-amber-50/50 dark:bg-amber-900/10') : ''}>
              <TableCell>
                <Checkbox 
                  checked={selectedLeadIds.includes(lead.id)}
                  onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <div className="font-mono text-xs text-muted-foreground">
                  #{lead.memberId || '---'}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {lead.name}
              </TableCell>
              <TableCell>
                {getScoreBadge(calculateLeadScore(lead))}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                  {currentUser?.role === 'rep' && lead.assignedTo !== currentUser.id ? '**********' : lead.phone}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary">{lead.branch || 'Unassigned'}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{lead.source || 'Unknown'}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{lead.stage || 'New'}</Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{getInterestBadge(lead.interest)}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge variant="outline">{lead.category || 'None'}</Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {lead.trialDate || lead.expectedVisitDate ? (
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2 text-blue-500" />
                    {format(parseISO((lead.trialDate || lead.expectedVisitDate)!), 'MMM d, yyyy')}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not set</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {lead.lastContactDate ? format(parseISO(lead.lastContactDate), 'MMM d') : 'Never'}
              </TableCell>
               <TableCell>
                {lead.nextReminderDate ? (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm">
                      {format(parseISO(lead.nextReminderDate), 'MMM d, yyyy')}
                    </span>
                    {isBefore(parseISO(lead.nextReminderDate), new Date()) ? (
                      <Badge variant="destructive" className="w-fit text-[10px] h-4 px-1">OVERDUE</Badge>
                    ) : isBefore(parseISO(lead.nextReminderDate), addDays(new Date(), 3)) ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 w-fit text-[10px] h-4 px-1">DUE SOON</Badge>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not set</span>
                )}
              </TableCell>
              {canAssignLeads && (
                <TableCell className="hidden lg:table-cell">
                  <Select 
                    defaultValue={lead.assignedTo || 'unassigned'}
                    onValueChange={(v) => updateClient(lead.id, { assignedTo: v === 'unassigned' ? '' : v })}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue placeholder="Assign rep">
                        {lead.assignedTo && lead.assignedTo !== 'unassigned'
                          ? users.find(u => u.id === lead.assignedTo)?.name || 'Unknown User'
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">System Users</SelectLabel>
                        {users.filter(u => u.role === 'rep').map(rep => (
                          <SelectItem key={rep.id} value={rep.id}>{rep.name || rep.email || 'Unknown User'}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Sales Members</SelectLabel>
                        {SALES_MEMBERS.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              )}
              <TableCell>
                <Dialog>
                  <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)} />}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Log Activity</span>
                  </DialogTrigger>
                  {renderLeadDialogContent(lead)}
                </Dialog>
                {canDeleteRecords && (
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteLead(lead.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="block md:hidden p-4 space-y-4">
              {leadsData.map(lead => {
                const isOverdue = lead.nextReminderDate ? isBefore(parseISO(lead.nextReminderDate), new Date()) : false;
                const isDueSoon = lead.nextReminderDate ? isBefore(parseISO(lead.nextReminderDate), addDays(new Date(), 3)) : false;
                const isUnassigned = !lead.assignedTo;

                return (
                  <Card key={lead.id} className={`bg-gradient-to-br from-zinc-900/50 to-zinc-950 border border-white/10 shadow-xl rounded-2xl overflow-hidden ${isReminderDue(lead) ? (isOverdue ? 'border-red-500/30' : 'border-amber-500/30') : ''}`}>
                    <CardHeader className="pb-2 border-b border-white/5 bg-zinc-900/20 p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-base tracking-wide">{lead.name}</span>
                            {getScoreBadge(calculateLeadScore(lead))}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                            <span className="font-mono text-zinc-500">#{lead.memberId || '---'}</span>
                            <span className="text-zinc-600">•</span>
                            <Badge variant="secondary" className="px-1 text-[9px]">{lead.branch || 'Unassigned'}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-pink-500/30 text-pink-400 text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full">
                          {lead.stage || 'New'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Source</span>
                          <span className="font-semibold text-white">{lead.source || 'Unknown'}</span>
                        </div>
                        <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Interest Level</span>
                          <div className="mt-0.5">{getInterestBadge(lead.interest)}</div>
                        </div>
                      </div>

                      {/* Contact Preview & Next Reminder */}
                      <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-zinc-500" />
                            <span className="font-mono text-[11px]">
                              {currentUser?.role === 'rep' && lead.assignedTo !== currentUser.id ? '**********' : lead.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Next Follow-up:</span>
                          <span className="font-bold text-zinc-200">
                            {lead.nextReminderDate ? (
                              <span className="flex items-center gap-1.5">
                                {format(parseISO(lead.nextReminderDate), 'MMM d, yyyy')}
                                {isOverdue ? (
                                  <span className="text-red-500 font-extrabold text-[9px]">OVERDUE</span>
                                ) : isDueSoon ? (
                                  <span className="text-amber-500 font-extrabold text-[9px]">DUE SOON</span>
                                ) : null}
                              </span>
                            ) : 'Not set'}
                          </span>
                        </div>
                      </div>

                      {/* Rep Assigned */}
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                        <span>Assigned Rep:</span>
                        <Badge variant="outline" className="border-white/5 text-zinc-400 text-[9px] font-medium bg-zinc-900/30">
                          {users.find(u => u.id === lead.assignedTo)?.name || 'Unassigned'}
                        </Badge>
                      </div>

                      {/* Actions Trigger */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-900/20" onClick={() => setSelectedLead(lead)}>
                            Log Activity & Details
                          </Button>
                        </DialogTrigger>
                        {renderLeadDialogContent(lead)}
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
              
              {leadsData.length === 0 && (
                <div className="text-center py-16 text-zinc-500 italic text-sm">
                  No leads found matching your search.
                </div>
              )}
            </div>

    </div>
  );

  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Leads Follow-up</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <ImportData type="Lead" />
          <ImportHistory />
          {canDeleteRecords && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAllLeads}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Leads
            </Button>
          )}
          <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input id="name" placeholder="Client Name" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input id="phone" placeholder="+20 100..." value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={newLeadSource} onValueChange={(v) => setNewLeadSource(v as LeadSource)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Walk-in">Referral</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matchmaking Region</Label>
                  <Select value={newLeadBranch} onValueChange={(v) => setNewLeadBranch(v as Branch)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAIRO">CAIRO</SelectItem>
                      <SelectItem value="GIZA">GIZA</SelectItem>
                      <SelectItem value="ONLINE">ONLINE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select value={newLeadAssignedTo} onValueChange={setNewLeadAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">System Users</SelectLabel>
                        {users.filter(u => u.role === 'rep').map(rep => (
                          <SelectItem key={rep.id} value={rep.id}>{rep.name || rep.email || 'Unknown'}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Sales Members</SelectLabel>
                        {SALES_MEMBERS.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddLead}>Save Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

              {/* Mobile Float Filter Button & Toggle Panel */}
        <div className="md:hidden flex justify-between items-center gap-3 p-4 bg-zinc-950 border border-white/5 rounded-xl mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search Name/Phone..." 
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
            {(filterBranch !== 'All' || filterStage !== 'All' || filterInterest !== 'All' || filterAssignedTo !== 'All' || sortBy !== 'default') && (
              <span className="bg-pink-500 text-white rounded-full text-[10px] px-1 font-bold">!</span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
          <div className={`fixed bottom-0 left-0 right-0 max-h-[85vh] bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] overflow-y-auto transition-transform duration-300 transform ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full'} text-white space-y-6`}>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Filter className="h-5 w-5 text-pink-400" /> Advanced Filters
              </h3>
              <Button variant="ghost" onClick={() => setIsMobileFilterOpen(false)} className="text-zinc-400 hover:text-white text-xs font-semibold">
                Done
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Region */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Region</Label>
                <Select value={filterBranch} onValueChange={(v) => setFilterBranch(v as Branch | 'All')}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All Regions</SelectItem>
                    <SelectItem value="CAIRO">CAIRO</SelectItem>
                    <SelectItem value="GIZA">GIZA</SelectItem>
                    <SelectItem value="ONLINE">ONLINE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stage */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Stage</Label>
                <Select value={filterStage} onValueChange={(v) => setFilterStage(v as LeadStage | 'All')}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All Stages</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Follow Up">Follow Up</SelectItem>
                    <SelectItem value="Consultation Scheduled">Interview / Consultation</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interest */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Interest</Label>
                <Select value={filterInterest} onValueChange={(v) => setFilterInterest(v as LeadInterest | 'All')}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="All">All Interests</SelectItem>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Assigned To</Label>
                <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="All">All Reps</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectGroup>
                      <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">System Users</SelectLabel>
                      {users.filter(u => u.role === 'rep').map(rep => (
                        <SelectItem key={rep.id} value={rep.id}>{rep.name || rep.email || 'Unknown User'}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Sales Members</SelectLabel>
                      {SALES_MEMBERS.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Sort by</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'default' | 'score')}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="score">Score (High-Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold h-11 rounded-xl">
              Apply Filters
            </Button>
          </div>
        </div>

        <Card className="p-4 hidden md:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Sort By</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'default' | 'score')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="score">Score (High-Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Search Name/Phone</Label>
            <Input 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Region</Label>
            <Select value={filterBranch} onValueChange={(v) => setFilterBranch(v as Branch | 'All')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Regions</SelectItem>
                <SelectItem value="CAIRO">CAIRO</SelectItem>
                <SelectItem value="GIZA">GIZA</SelectItem>
                <SelectItem value="ONLINE">ONLINE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Stage</Label>
            <Select value={filterStage} onValueChange={(v) => setFilterStage(v as LeadStage | 'All')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Stages</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Follow Up">Follow Up</SelectItem>
                <SelectItem value="Consultation Scheduled">Interview / Consultation</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Interest</Label>
            <Select value={filterInterest} onValueChange={(v) => setFilterInterest(v as LeadInterest | 'All')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Interests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Interests</SelectItem>
                <SelectItem value="Interested">Interested</SelectItem>
                <SelectItem value="Not Interested">Not Interested</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Assigned To</Label>
            <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Reps">
                  {filterAssignedTo === 'All' || !filterAssignedTo
                    ? undefined
                    : filterAssignedTo === 'unassigned'
                      ? 'Unassigned'
                      : users.find(u => u.id === filterAssignedTo)?.name || 'Unknown User'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Reps</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">System Users</SelectLabel>
                  {users.filter(u => u.role === 'rep').map(rep => (
                    <SelectItem key={rep.id} value={rep.id}>{rep.name || rep.email || 'Unknown User'}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Sales Members</SelectLabel>
                  {SALES_MEMBERS.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedLeadIds.length > 0 && (
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary-foreground text-primary">
              {selectedLeadIds.length} selected
            </Badge>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setSelectedLeadIds([])}>
              Cancel
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-primary-foreground/10 p-1 rounded-md">
              <ArrowRight className="h-4 w-4" />
              <Select onValueChange={(v) => handleBulkStageUpdate(v as LeadStage)}>
                <SelectTrigger className="h-8 w-[140px] bg-transparent border-none text-primary-foreground">
                  <SelectValue placeholder="Update Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Consultation Scheduled">Interview / Consultation</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canAssignLeads ? (
              <div className="flex items-center gap-2 bg-primary-foreground/10 p-1 rounded-md">
                <UserCheck className="h-4 w-4" />
                <Select onValueChange={handleBulkAssign}>
                  <SelectTrigger className="h-8 w-[140px] bg-transparent border-none text-primary-foreground">
                    <SelectValue placeholder="Assign To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectGroup>
                      <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">System Users</SelectLabel>
                      {users.filter(u => u.role === 'rep').map(rep => (
                        <SelectItem key={rep.id} value={rep.id}>{rep.name || rep.email || 'Unknown User'}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Sales Members</SelectLabel>
                      {SALES_MEMBERS.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {canDeleteRecords && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
        onConfirm={confirmDeleteLead}
        variant="destructive"
        confirmText="Delete"
      />

      <ConfirmDialog 
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        title="Delete Multiple Leads"
        description={`Are you sure you want to delete ${selectedLeadIds.length} leads? This action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        variant="destructive"
        confirmText="Delete All Selected"
      />

      <ConfirmDialog 
        isOpen={isDeleteAllLeadsDialogOpen}
        onOpenChange={setIsDeleteAllLeadsDialogOpen}
        title="CRITICAL: Delete All Leads"
        description="Are you sure you want to delete ALL leads in the system? This action is permanent and cannot be undone."
        onConfirm={confirmDeleteAllLeads}
        variant="destructive"
        confirmText="Yes, Delete Everything"
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <TabsList className="flex w-max sm:w-full bg-muted/50 rounded-lg p-1 justify-start sm:justify-center mb-4">
            <TabsTrigger value="all" className="px-4 text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="unassigned" className="px-4 text-xs sm:text-sm text-amber-600 font-bold dark:text-amber-500">Unassigned</TabsTrigger>
            <TabsTrigger value="instagram" className="px-4 text-xs sm:text-sm">Instagram</TabsTrigger>
            <TabsTrigger value="whatsapp" className="px-4 text-xs sm:text-sm">WhatsApp</TabsTrigger>
            <TabsTrigger value="walkin" className="px-4 text-xs sm:text-sm">Referral</TabsTrigger>
            <TabsTrigger value="consultations" className="px-4 text-xs sm:text-sm">Interview / Consultation</TabsTrigger>
            <TabsTrigger value="followup" className="px-4 text-xs sm:text-sm">Follow up</TabsTrigger>
          </TabsList>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {renderLeadsTable(paginatedLeads)}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, leads.length)} of {leads.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Tabs>

      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Client?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Would you like to convert <strong>{leadToConvert?.name}</strong> into an active client record? 
              This will move them from Leads to Members.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmConversion}>Confirm Conversion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

