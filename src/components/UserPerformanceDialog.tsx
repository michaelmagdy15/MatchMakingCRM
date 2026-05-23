import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppContext } from '../context';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Sparkles, Heart } from 'lucide-react';

interface UserPerformanceDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function UserPerformanceDialog({ user, isOpen, onClose }: UserPerformanceDialogProps) {
  const { userTargets, matches, updateUserTarget } = useAppContext();
  
  // Find current month string (e.g. '2026-05')
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const existingCurrentTarget = userTargets.find(t => t.userId === user.id && t.month === currentMonthStr);
  
  // Local state for setting new matchmaking activity targets
  const [newTarget, setNewTarget] = useState(existingCurrentTarget?.targetAmount?.toString() || '15'); // Proposal Target
  const [newPrivateTarget, setNewPrivateTarget] = useState(existingCurrentTarget?.privateTarget?.toString() || '4'); // Success Target
  const [newGroupTarget, setNewGroupTarget] = useState(existingCurrentTarget?.groupTarget?.toString() || '8'); // Mutual Approval Target
  
  const handleSaveTarget = () => {
    const totalAmt = parseInt(newTarget, 10);
    const privateAmt = parseInt(newPrivateTarget, 10);
    const groupAmt = parseInt(newGroupTarget, 10);

    if (!isNaN(totalAmt) && totalAmt >= 0) {
      updateUserTarget(user.id, currentMonthStr, totalAmt, privateAmt, groupAmt);
    }
  };

  // Generate last 6 months matchmaking analytics for chart
  const performanceData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
    
    return months.map(date => {
      const monthStr = format(date, 'yyyy-MM');
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const targetDoc = userTargets.find(t => t.userId === user.id && t.month === monthStr);
      
      // Defaults to represent realistic matchmaking indicators
      const targetProposals = targetDoc ? targetDoc.targetAmount : 15;
      const targetSuccess = targetDoc ? (targetDoc.privateTarget || 4) : 4;
      const targetMutual = targetDoc ? (targetDoc.groupTarget || 8) : 8;
      
      // Live calculation from matches database
      const monthMatches = matches.filter(m => {
        if (m.responsibleAdminId !== user.id) return false;
        // Parse match creation timestamp
        const mDate = parseISO(m.createdAt || new Date().toISOString());
        return isWithinInterval(mDate, { start, end });
      });

      const achievedProposals = monthMatches.length;
      
      const achievedMutual = monthMatches.filter(m => 
        (m.maleProfileApproved && m.femaleProfileApproved) ||
        m.status === 'PENDING_PHOTO_APPROVAL' ||
        m.status === 'PENDING_CONTACT_SHARE' ||
        m.status === 'MATCH_ACTIVE'
      ).length;

      const achievedSuccess = monthMatches.filter(m => m.status === 'MATCH_ACTIVE').length;

      return {
        month: format(date, 'MMM yyyy'),
        targetProposals,
        achievedProposals,
        targetSuccess,
        achievedSuccess,
        targetMutual,
        achievedMutual,
        isTargetMet: targetProposals > 0 && achievedProposals >= targetProposals
      };
    });
  }, [userTargets, matches, user.id]);

  // Determine current month's breakdown to show separately
  const currentMonthData = performanceData[performanceData.length - 1];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] bg-zinc-950 border-white/5 text-white rounded-2xl">
        <DialogHeader className="border-b border-white/5 pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Matchmaker Activity Dashboard: {user.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setting goals */}
            <div className="space-y-4 p-5 border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-md">
              <h4 className="font-semibold text-sm text-indigo-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Setup Monthly Activity Goals
              </h4>
              <p className="text-xs text-zinc-400">Establish quantitative targets for proposals created and completed matches for {format(new Date(), 'MMMM yyyy')}.</p>
              
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300 font-bold">Monthly Match Proposals Target</Label>
                  <Input 
                    type="number" 
                    value={newTarget} 
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder="e.g. 15"
                    className="h-9 bg-zinc-900 border-white/10 text-white rounded-lg focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-300 font-bold">Successful Matches Goal</Label>
                    <Input 
                      type="number" 
                      value={newPrivateTarget} 
                      onChange={e => setNewPrivateTarget(e.target.value)}
                      placeholder="e.g. 4"
                      className="h-9 bg-zinc-900 border-white/10 text-white rounded-lg focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-300 font-bold">Mutual Approvals Goal</Label>
                    <Input 
                      type="number" 
                      value={newGroupTarget} 
                      onChange={e => setNewGroupTarget(e.target.value)}
                      placeholder="e.g. 8"
                      className="h-9 bg-zinc-900 border-white/10 text-white rounded-lg focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveTarget} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/10">
                  Save Activity Goals
                </Button>
              </div>
            </div>
            
            {/* Live Stats */}
            <div className="space-y-4 p-5 border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-sm text-pink-400 flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Current Month Live Stats
                </h4>
                <p className="text-xs text-zinc-400 mb-4">Calculated live from active sandbox and PostgreSQL match records.</p>
                
                <div className="flex flex-col space-y-4">
                  {/* Proposals metrics */}
                  <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Proposals Made</span>
                      <span className="text-2xl font-black text-white">
                        {currentMonthData?.achievedProposals} <span className="text-xs font-normal text-zinc-500">created</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-bold">
                        Target: {currentMonthData?.targetProposals}
                      </Badge>
                      {currentMonthData?.isTargetMet && (
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 inline" /> Goal Reached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mutual Approvals metrics */}
                  <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Mutual Approvals</span>
                      <span className="text-2xl font-black text-amber-400">
                        {currentMonthData?.achievedMutual} <span className="text-xs font-normal text-zinc-500">cleared</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-500/10 text-amber-400 border-none font-bold">
                        Target: {currentMonthData?.targetMutual}
                      </Badge>
                    </div>
                  </div>

                  {/* Success matches metrics */}
                  <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Successful Matches</span>
                      <span className="text-2xl font-black text-emerald-400">
                        {currentMonthData?.achievedSuccess} <span className="text-xs font-normal text-zinc-500">couples</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-bold">
                        Target: {currentMonthData?.targetSuccess}
                      </Badge>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          
          {/* Chart Section */}
          <div className="space-y-3 border border-white/5 rounded-2xl p-5 bg-zinc-900/20">
            <h4 className="font-semibold text-sm text-zinc-300">Matchmaker Historical Proposals Performance (6 Months)</h4>
            <div className="h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  />
                  <Legend tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Bar dataKey="targetProposals" name="Proposals Goal" fill="#4f46e5" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar dataKey="achievedProposals" name="Proposals Achieved" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
