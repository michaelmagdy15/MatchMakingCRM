import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from './context';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  TrendingUp, 
  Users, 
  Heart, 
  Sparkles, 
  UserCheck, 
  Layers, 
  ShieldCheck, 
  HelpCircle,
  FileText,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { clients, matches, users } = useAppContext();

  // Helper to export CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Candidate Status Funnel Analysis
  const candidateFunnel = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let hold = 0;
    let rejected = 0;

    clients.forEach(c => {
      const status = c.status;
      if (status === 'Pending' || status === 'Lead') pending++;
      else if (status === 'Approved' || status === 'Active') approved++;
      else if (status === 'Hold') hold++;
      else if (status === 'Rejected' || status === 'Expired') rejected++;
    });

    const total = pending + approved + hold + rejected;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '0%';

    return {
      pending,
      approved,
      hold,
      rejected,
      total,
      approvalRate
    };
  }, [clients]);

  // Funnel Rows for Table
  const funnelTableData = useMemo(() => {
    const total = candidateFunnel.total;
    const rows = [
      { Stage: 'Pending Review', Count: candidateFunnel.pending, Percentage: total > 0 ? ((candidateFunnel.pending / total) * 100).toFixed(1) + '%' : '0%' },
      { Stage: 'Approved (Active Search)', Count: candidateFunnel.approved, Percentage: total > 0 ? ((candidateFunnel.approved / total) * 100).toFixed(1) + '%' : '0%' },
      { Stage: 'On Hold', Count: candidateFunnel.hold, Percentage: total > 0 ? ((candidateFunnel.hold / total) * 100).toFixed(1) + '%' : '0%' },
      { Stage: 'Rejected', Count: candidateFunnel.rejected, Percentage: total > 0 ? ((candidateFunnel.rejected / total) * 100).toFixed(1) + '%' : '0%' }
    ];
    return rows;
  }, [candidateFunnel]);

  // 2. Kanban Match Pipeline Metrics
  const matchPipeline = useMemo(() => {
    let pendingProfile = 0;
    let pendingPhoto = 0;
    let pendingContacts = 0;
    let activeMatch = 0;
    let pendingFeedback = 0;

    matches.forEach(m => {
      switch (m.status) {
        case 'PENDING_PROFILE_APPROVAL':
          pendingProfile++;
          break;
        case 'PENDING_PHOTO_APPROVAL':
          pendingPhoto++;
          break;
        case 'PENDING_CONTACT_SHARE':
          pendingContacts++;
          break;
        case 'MATCH_ACTIVE':
          activeMatch++;
          break;
        case 'PENDING_FEEDBACK':
          pendingFeedback++;
          break;
      }
    });

    const totalMatches = matches.length;

    return {
      pendingProfile,
      pendingPhoto,
      pendingContacts,
      activeMatch,
      pendingFeedback,
      totalMatches
    };
  }, [matches]);

  const matchPipelineTableData = useMemo(() => {
    const total = matchPipeline.totalMatches;
    return [
      { Column: 'Pending Profile Review', ActiveProposals: matchPipeline.pendingProfile, Ratio: total > 0 ? ((matchPipeline.pendingProfile / total) * 100).toFixed(1) + '%' : '0%' },
      { Column: 'Pending Photo Review', ActiveProposals: matchPipeline.pendingPhoto, Ratio: total > 0 ? ((matchPipeline.pendingPhoto / total) * 100).toFixed(1) + '%' : '0%' },
      { Column: 'Pending Contact Share', ActiveProposals: matchPipeline.pendingContacts, Ratio: total > 0 ? ((matchPipeline.pendingContacts / total) * 100).toFixed(1) + '%' : '0%' },
      { Column: 'Successful Matches (Contacts Shared)', ActiveProposals: matchPipeline.activeMatch, Ratio: total > 0 ? ((matchPipeline.activeMatch / total) * 100).toFixed(1) + '%' : '0%' },
      { Column: 'Pending Follow-up Feedback', ActiveProposals: matchPipeline.pendingFeedback, Ratio: total > 0 ? ((matchPipeline.pendingFeedback / total) * 100).toFixed(1) + '%' : '0%' }
    ];
  }, [matchPipeline]);

  // 3. Matchmaker Workload & Balance
  const matchmakerWorkload = useMemo(() => {
    return users.map(user => {
      const assignedCandidates = clients.filter(c => c.assignedTo === user.id).length;
      const assignedMatches = matches.filter(m => m.responsibleAdminId === user.id).length;

      return {
        Matchmaker: user.name || user.email || 'Unknown',
        Role: user.role,
        'Candidates Managed': assignedCandidates,
        'Match Proposals Managed': assignedMatches,
        'Total Workload Score': assignedCandidates + (assignedMatches * 2) // weight match proposals higher
      };
    }).sort((a, b) => b['Total Workload Score'] - a['Total Workload Score']);
  }, [users, clients, matches]);

  const handleExportCandidates = () => {
    const data = clients.map(c => ({
      Code: c.code || 'C-XXX',
      Gender: c.gender || 'Not specified',
      Age: c.age || c.finalAge || 'N/A',
      Residence: c.locationOfResidence || 'N/A',
      Religion: c.religion || 'N/A',
      Status: c.status,
      GUCIAN: c.areYouGucian || 'No',
      AssignedAdmin: users.find(u => u.id === c.assignedTo)?.name || 'Unassigned',
      CommentsCount: c.comments?.length || 0,
      InteractionsCount: c.interactions?.length || 0
    }));
    exportToCSV(data, 'candidates_status_funnel');
  };

  const handleExportMatches = () => {
    const data = matches.map(m => ({
      MatchID: m.id,
      GentlemanCode: m.maleId,
      GentlemanName: m.maleName,
      GentlemanProfileApproved: m.maleProfileApproved ? 'Yes' : 'No',
      GentlemanPhotoApproved: m.malePhotoApproved ? 'Yes' : 'No',
      LadyCode: m.femaleId,
      LadyName: m.femaleName,
      LadyProfileApproved: m.femaleProfileApproved ? 'Yes' : 'No',
      LadyPhotoApproved: m.femalePhotoApproved ? 'Yes' : 'No',
      MatchStatus: m.status,
      AdminResponsible: m.responsibleAdminName || 'Unassigned',
      CreatedDate: m.createdAt
    }));
    exportToCSV(data, 'matchmaking_proposals_funnel');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-pink-950/20 via-background to-purple-950/20 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Matchmaker Analytics & Insights <TrendingUp className="h-6 w-6 text-pink-400" />
          </h2>
          <p className="text-zinc-400 mt-1">Real-time indicators of candidate conversions, active proposals, and matchmaker workload capacity.</p>
        </div>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl p-6 rounded-2xl flex flex-col justify-between shadow-black/40">
          <div className="space-y-2">
            <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block">Total Registered Candidates</span>
            <span className="text-4xl font-black text-white">{candidateFunnel.total}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-4">
            <UserCheck className="h-4 w-4" />
            <span>Active candidates database</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl p-6 rounded-2xl flex flex-col justify-between shadow-black/40">
          <div className="space-y-2">
            <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block">Approved Candidates</span>
            <span className="text-4xl font-black text-emerald-400">{candidateFunnel.approved}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-4">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
              {candidateFunnel.approvalRate} approval rate
            </Badge>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl p-6 rounded-2xl flex flex-col justify-between shadow-black/40">
          <div className="space-y-2">
            <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block">Pending Profiles</span>
            <span className="text-4xl font-black text-indigo-400">{candidateFunnel.pending}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-4">
            <Activity className="h-4 w-4" />
            <span>Awaiting matchmaker review</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/40 via-zinc-950/20 to-zinc-900/40 backdrop-blur-lg border border-white/10 shadow-2xl p-6 rounded-2xl flex flex-col justify-between shadow-black/40">
          <div className="space-y-2">
            <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block">Active Match Couples</span>
            <span className="text-4xl font-black text-pink-500">{matchPipeline.totalMatches}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-pink-400 font-bold mt-4">
            <Heart className="h-4 w-4" />
            <span>Matched proposals in pipeline</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate Status Funnel table */}
        <Card className="bg-gradient-to-br from-zinc-900/35 via-zinc-950/15 to-zinc-900/35 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                Candidate Status Funnel
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1">Breakdown of registered matchmaking candidates by their review status.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCandidates} className="border-white/10 hover:bg-zinc-900 text-white text-xs">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5">
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase">Review Stage</TableHead>
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Candidates</TableHead>
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnelTableData.map(row => (
                  <TableRow key={row.Stage} className="border-b border-white/5">
                    <TableCell className="font-semibold text-white">{row.Stage}</TableCell>
                    <TableCell className="text-right font-bold text-zinc-200">{row.Count}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-indigo-600 text-white font-bold">{row.Percentage}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Proposals Pipeline funnel */}
        <Card className="bg-gradient-to-br from-zinc-900/35 via-zinc-950/15 to-zinc-900/35 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                Match Proposals Pipeline
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1">Current state of match proposal couples across the Kanban review columns.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportMatches} className="border-white/10 hover:bg-zinc-900 text-white text-xs">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5">
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase">Kanban Column</TableHead>
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Proposals</TableHead>
                  <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchPipelineTableData.map(row => (
                  <TableRow key={row.Column} className="border-b border-white/5">
                    <TableCell className="font-semibold text-white">{row.Column}</TableCell>
                    <TableCell className="text-right font-bold text-zinc-200">{row.ActiveProposals}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-pink-600 text-white font-bold">{row.Ratio}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Matchmaker workload and capacity analysis */}
      <Card className="bg-gradient-to-br from-zinc-900/35 via-zinc-950/15 to-zinc-900/35 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl shadow-black/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Matchmaker Workload Capacity Balance
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs mt-1">
            Audit assigned responsibilities and manage capacity mapping across the matchmaker team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5">
                <TableHead className="text-zinc-400 font-bold text-xs uppercase">Matchmaker Name</TableHead>
                <TableHead className="text-zinc-400 font-bold text-xs uppercase">System Role</TableHead>
                <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Candidates Managed</TableHead>
                <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Proposals Managed</TableHead>
                <TableHead className="text-zinc-400 font-bold text-xs uppercase text-right">Capacity Weight Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchmakerWorkload.map(row => (
                <TableRow key={row.Matchmaker} className="border-b border-white/5 hover:bg-zinc-900/10">
                  <TableCell className="font-semibold text-white">{row.Matchmaker}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="border-zinc-800 text-zinc-400 uppercase font-semibold">
                      {row.Role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-300">{row['Candidates Managed']}</TableCell>
                  <TableCell className="text-right font-bold text-zinc-300">{row['Match Proposals Managed']}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={row['Total Workload Score'] > 10 ? 'bg-amber-600 text-white font-bold' : 'bg-emerald-600 text-white font-bold'}>
                      {row['Total Workload Score']} pts
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
