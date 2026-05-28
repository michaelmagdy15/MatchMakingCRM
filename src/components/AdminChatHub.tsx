import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../context';
import { ChatMessage, Client } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User as UserIcon, 
  Shield, 
  Clock, 
  MessageCircle, 
  Sparkles, 
  Lock, 
  ChevronRight,
  RefreshCw,
  Heart,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const getClientSenderDisplayName = (msg: ChatMessage, profile?: Client) => {
  if (profile) {
    const isFemale = 
      profile.gender?.toLowerCase() === 'female' || 
      profile.gender?.toLowerCase() === 'lady' || 
      (profile.code && profile.code.toUpperCase().startsWith('L'));
    const code = profile.code || '';
    return `${isFemale ? 'Lady' : 'Gentleman'} ${code}`.trim();
  }
  
  if (msg.senderName) {
    if (msg.senderName.toLowerCase().includes('lady') || msg.senderName.toLowerCase().includes('gentleman')) {
      return msg.senderName;
    }
    const match = msg.senderName.match(/([LG]\d+)/i);
    if (match) {
      const code = match[0].toUpperCase();
      return `${code.startsWith('L') ? 'Lady' : 'Gentleman'} ${code}`;
    }
    return msg.senderName;
  }
  return 'Client';
};

const getAdminSenderDisplayName = (msg: ChatMessage) => {
  const email = (msg.senderEmail || '').toLowerCase();
  const name = (msg.senderName || '').toLowerCase();
  if (email.includes('arwa') || name.includes('arwa') || name.includes('hope')) {
    return 'Arwa (Admin Hope)';
  }
  if (email.includes('eman') || name.includes('eman') || name.includes('truth')) {
    return 'Eman (Admin Truth)';
  }
  if (email.includes('michael') || name.includes('michael') || name.includes('grace')) {
    return 'Michael (Admin Grace)';
  }
  
  const realName = msg.senderName || 'Sarah';
  const cleanName = realName.replace(/^admin\s+/i, '').trim();
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return `${capitalized} (Admin)`;
};

export const AdminChatHub: React.FC = () => {
  const { currentUser, messages = [], rawProfiles = [], sendChatMessage } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedProfileId]);

  const selectedProfile = useMemo(() => {
    return rawProfiles.find(p => p.id === selectedProfileId);
  }, [rawProfiles, selectedProfileId]);

  const selectedThreadMessages = useMemo(() => {
    if (!selectedProfileId) return [];
    return messages
      .filter(m => m.profileId === selectedProfileId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, selectedProfileId]);

  // Find unique profiles with messages
  const activeProfiles = useMemo(() => {
    const profileIdsWithMessages = Array.from(new Set(messages.map(m => m.profileId)));
    return profileIdsWithMessages
      .map(id => rawProfiles.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [messages, rawProfiles]);

  const filteredThreads = useMemo(() => {
    const threads = activeProfiles.map(profile => {
      const threadMessages = messages.filter(m => m.profileId === profile.id);
      const sorted = [...threadMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const latestMessage = sorted[sorted.length - 1];
      
      // Calculate pending messages count (client messages since the last admin message)
      let pendingCount = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].senderRole === 'client') {
          pendingCount++;
        } else {
          break;
        }
      }

      return {
        profile,
        latestMessage,
        messagesCount: threadMessages.length,
        pendingCount
      };
    });

    const query = searchTerm.toLowerCase().trim();
    const filtered = query
      ? threads.filter(t => 
          (t.profile.name || '').toLowerCase().includes(query) ||
          (t.profile.code || '').toLowerCase().includes(query) ||
          (t.profile.fullName || '').toLowerCase().includes(query)
        )
      : threads;

    return filtered.sort((a, b) => {
      const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [activeProfiles, messages, searchTerm]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedProfileId) return;

    setIsSending(true);
    
    const adminId = currentUser?.id || 'admin-sarah';
    const adminName = currentUser?.name || 'Sarah';
    const adminEmail = currentUser?.email || 'sarah@purematch.app';

    try {
      await sendChatMessage(
        selectedProfileId,
        adminId,
        adminName,
        'admin',
        messageText.trim(),
        adminEmail
      );
      setMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Premium Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-violet-500/20 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Dating Support Chat Hub <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Manage encrypted chat lines, answer matchmaking candidates, and assist the GUC community.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Active CRM Line
          </Badge>
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/40 border border-white/5 rounded-full text-xs text-zinc-300">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Staff: <strong className="text-white font-semibold">{currentUser.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Glassmorphic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px] max-h-[750px] h-[calc(100vh-200px)]">
        {/* Left Sidebar - Chat Threads (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-xl overflow-hidden">
          {/* Sidebar Search & Header */}
          <div className="p-4 border-b border-white/5 bg-zinc-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Conversations</span>
              <Badge className="bg-zinc-800 text-zinc-300 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                {filteredThreads.length} active
              </Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <Input
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-900/60 border-zinc-800/80 text-xs h-9.5 rounded-xl text-white placeholder-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sidebar Thread List */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2.5">
                  <MessageCircle className="h-8 w-8 text-zinc-700 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-zinc-300">No Support Threads</p>
                    <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto mt-1 leading-relaxed">
                      Active client threads will show up here when they send or receive support messages.
                    </p>
                  </div>
                </div>
              ) : (
                filteredThreads.map(({ profile, latestMessage, pendingCount }) => {
                  const isSelected = selectedProfileId === profile.id;
                  const isFemale = 
                    profile.gender?.toLowerCase() === 'female' || 
                    profile.gender?.toLowerCase() === 'lady' || 
                    (profile.code && profile.code.toUpperCase().startsWith('L'));
                  
                  const candidateCode = profile.code || (isFemale ? 'Lady' : 'Gentleman');

                  const badgeClass = isFemale
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden group cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-950/80 border-indigo-500/40 shadow-inner'
                          : pendingCount > 0
                            ? 'bg-zinc-900/40 border-rose-500/20 hover:bg-zinc-900/60 shadow-lg shadow-rose-500/5'
                            : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                      }`}
                    >
                      {/* Left Selection Glow Bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
                      )}

                      {/* Avatar Placeholder */}
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${isFemale ? 'from-pink-500 to-rose-500' : 'from-indigo-500 to-blue-500'} flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0`}>
                        {profile.code ? profile.code.substring(0, 2) : (isFemale ? 'L' : 'G')}
                      </div>

                      {/* Thread Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeClass}`}>
                            {candidateCode}
                          </span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {pendingCount > 0 && (
                              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider flex items-center gap-1 shrink-0 shadow-sm animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                                <span>{pendingCount} Pending</span>
                              </Badge>
                            )}
                            {latestMessage && (
                              <span className="text-[9px] text-zinc-500 font-semibold uppercase flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatTime(latestMessage.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-xs text-white truncate mt-1.5 group-hover:text-indigo-300 transition-colors">
                          {profile.fullName || profile.name}
                        </h4>

                        {latestMessage ? (
                          <p className="text-[11px] text-zinc-400 truncate mt-1 leading-normal">
                            {latestMessage.senderRole === 'admin' ? (
                              <span className="text-indigo-400/80 font-bold mr-1">You:</span>
                            ) : null}
                            {latestMessage.message}
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-500 italic mt-1">No messages yet</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Main Area - Conversation Feed (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-xl overflow-hidden relative">
          
          {selectedProfile ? (
            <>
              {/* Header: Candidate details */}
              <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 bg-gradient-to-br ${
                    (selectedProfile.gender?.toLowerCase() === 'female' || (selectedProfile.code && selectedProfile.code.toUpperCase().startsWith('L')))
                      ? 'from-pink-500 to-rose-500' 
                      : 'from-indigo-500 to-blue-500'
                  } rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shrink-0`}>
                    {selectedProfile.code ? selectedProfile.code : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{selectedProfile.fullName || selectedProfile.name}</h3>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {selectedProfile.code}
                      </Badge>
                    </div>
                    
                    {/* Tiny stats about selected candidate */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-zinc-400">Age: <strong>{selectedProfile.age || 'N/A'}</strong></span>
                      <span className="text-zinc-700 text-[10px]">•</span>
                      <span className="text-[10px] text-zinc-400">Location: <strong>{selectedProfile.locationOfResidence || 'N/A'}</strong></span>
                      <span className="text-zinc-700 text-[10px]">•</span>
                      <span className="text-[10px] text-zinc-400">Marital: <strong>{selectedProfile.maritalStatus || 'Single'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/5 text-[9px] uppercase font-bold tracking-widest py-0.5 rounded-full shrink-0">
                    Client Support
                  </Badge>
                </div>
              </div>

              {/* Chat messages feed */}
              <ScrollArea className="flex-1">
                <div className="p-5 space-y-4">
                  {selectedThreadMessages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center p-8 text-zinc-500 space-y-3 min-h-[300px]">
                      <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5">
                        <MessageSquare className="h-6 w-6 text-indigo-500/60 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No Previous Conversations</p>
                        <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed mt-1">
                          No messages in this support thread. Type a message below to start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    selectedThreadMessages.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin';
                      const senderNameDisplay = isAdmin
                        ? getAdminSenderDisplayName(msg)
                        : getClientSenderDisplayName(msg, selectedProfile);

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          {/* Unified metadata header above bubble */}
                          <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-500 uppercase tracking-widest font-black px-1">
                            <span>{senderNameDisplay}</span>
                            <span>•</span>
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>

                          {/* Chat Bubble */}
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                              isAdmin
                                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white rounded-tr-none border border-indigo-500/20'
                                : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Scroll Ref marker */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input Area */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/5 bg-zinc-950/40 flex items-center gap-3 shrink-0"
              >
                <Input
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`Reply to ${selectedProfile.fullName || selectedProfile.name}...`}
                  disabled={isSending}
                  className="flex-1 bg-zinc-900/60 border-zinc-800/80 text-xs h-12 rounded-xl text-white placeholder-zinc-500 focus-visible:ring-indigo-500"
                />
                <Button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="h-12 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all border-none flex items-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Selected thread placeholder view (No selection) */
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 sm:p-12 text-zinc-500 space-y-4">
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
              
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/5 border border-indigo-500/20 rounded-3xl shadow-lg relative">
                <MessageCircle className="h-10 w-10 text-indigo-400 animate-pulse" />
              </div>
              
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-extrabold text-white tracking-tight">Select a Chat Conversation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Choose an active candidate support thread from the sidebar list to see the chronological chat history and reply directly.
                </p>
              </div>
              
              <div className="pt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-black tracking-widest border-t border-white/5 w-48 justify-center">
                <Shield className="h-3.5 w-3.5 text-indigo-500" /> Secure CRM Terminal
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminChatHub;
