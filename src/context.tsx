import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Client, 
  User, 
  UserRole, 
  Payment, 
  SalesTarget, 
  PTPackageRecord, 
  ActivePairing,
  AuditLog, 
  Task, 
  Package, 
  Coach, 
  Matchmaker,
  ImportBatch,
  UserSalesTarget,
  BrandingSettings,
  Attendance,
  MatchMeeting,
  Branch,
  CRMComment,
  InteractionLog,
  CommissionRates,
  Match,
  MatchStatus
} from './types';
import { mockClients, mockMatches } from './data';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  login: (email?: string, name?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  clients: Client[]; // masked profiles
  rawClients: Client[]; // raw profiles
  profiles: Client[]; // alias
  rawProfiles: Client[]; // alias
  salesTarget: SalesTarget;
  payments: Payment[];
  activePairings: ActivePairing[]; // modernized
  ptPackageRecords: PTPackageRecord[]; // alias for matches
  matches: Match[];
  auditLogs: AuditLog[];
  tasks: Task[];
  packages: Package[];
  matchmakers: Matchmaker[]; // modernized
  coaches: Coach[]; // legacy
  importBatches: ImportBatch[];
  userTargets: UserSalesTarget[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addClient: (client: Client) => Promise<void>;
  bulkAddClients: (clients: Client[]) => Promise<{success: number, failed: number, errors: {row: number, reason: string}[]}>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  deleteMultipleClients: (ids: string[]) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  inviteUser: (email: string, role: UserRole) => Promise<void>;
  addComment: (clientId: string, text: string, author?: string) => Promise<void>;
  addInteraction: (clientId: string, interaction: Omit<InteractionLog, 'id' | 'author'>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  updateSalesTarget: (target: number) => Promise<void>;
  updateUserTarget: (userId: string, month: string, total: number, privateTarget: number, groupTarget: number) => Promise<void>;
  addActivePairing: (pairing: Omit<ActivePairing, 'id'>) => Promise<void>; // modernized
  updateActivePairing: (id: string, updates: Partial<ActivePairing>) => Promise<void>; // modernized
  addPTPackageRecord: (session: Omit<PTPackageRecord, 'id'>) => Promise<void>;
  updatePTPackageRecord: (id: string, updates: Partial<PTPackageRecord>) => Promise<void>;
  addMatch: (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMatch: (id: string, updates: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addPackage: (pkg: Omit<Package, 'id'>) => Promise<void>;
  updatePackage: (id: string, updates: Partial<Package>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  addMatchmaker: (matchmaker: Omit<Matchmaker, 'id'>) => Promise<void>; // modernized
  updateMatchmaker: (id: string, updates: Partial<Matchmaker>) => Promise<void>; // modernized
  deleteMatchmaker: (id: string) => Promise<void>; // modernized
  addCoach: (coach: Omit<Coach, 'id'>) => Promise<void>;
  updateCoach: (id: string, updates: Partial<Coach>) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  addImportBatch: (batch: Omit<ImportBatch, 'id'>) => Promise<string>;
  rollbackImport: (batchId: string) => Promise<void>;
  isAuthReady: boolean;
  branding: BrandingSettings;
  updateBranding: (branding: Partial<BrandingSettings>) => Promise<void>;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  matchMeetings: MatchMeeting[]; // modernized
  recordMatchMeeting: (clientId: string, branch: Branch) => Promise<void>; // modernized
  attendances: Attendance[];
  recordAttendance: (clientId: string, branch: Branch) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  wipeSystem: () => Promise<void>;
  bulkAddPayments: (payments: Payment[]) => Promise<void>;
  canDeletePayments: boolean;
  canAccessSettings: boolean;
  canViewGlobalDashboard: boolean;
  canDeleteRecords: boolean;
  canAssignLeads: boolean;
  recalculateAllPackages: () => Promise<void>;
  selfCheckIn: (identifier: string, pin: string, branch: Branch) => Promise<{ success: boolean; message: string }>;
  mergeDuplicates: () => Promise<void>;
  backfillMemberIds: () => Promise<void>;
  commissionRates: CommissionRates;
  updateCommissionRates: (rates: CommissionRates) => Promise<void>;
  isManagerOrAdmin: boolean;
  isStrictManager: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Field Mapping Helpers
const snakeToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key) => {
      const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camel] = snakeToCamel(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

const camelToSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key) => {
      const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snake] = camelToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

// Initial Mock Seed for Local Fallback Sandbox mode
const MOCK_USERS: User[] = [
  { id: 'admin-sarah', name: 'Sarah', email: 'sarah@datingcrm.com', role: 'crm_admin' },
  { id: 'admin-youssef', name: 'Youssef', email: 'youssef@datingcrm.com', role: 'manager' },
  { id: 'rep-user', name: 'Matchmaker Staff', email: 'matchmaker@datingcrm.com', role: 'rep' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [baseClients, setBaseClients] = useState<Client[]>([]);
  const [baseMatches, setBaseMatches] = useState<Match[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [comments, setComments] = useState<Record<string, CRMComment[]>>({});
  const [interactions, setInteractions] = useState<Record<string, InteractionLog[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  // Stubs for CRM-Specific States (keeps compiler happy and adapted for matchmaking)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<Package[]>([
    { id: 'pkg-premium-3m', name: 'PureMatch Premium (3 Months)', price: 5000, sessions: 1, expiryDays: 90, branch: 'ALL', type: 'Other' },
    { id: 'pkg-gold-6m', name: 'PureMatch Gold (6 Months)', price: 8000, sessions: 1, expiryDays: 180, branch: 'ALL', type: 'Other' },
    { id: 'pkg-consult', name: 'Single Match Consultation', price: 1500, sessions: 1, expiryDays: 30, branch: 'ALL', type: 'Other' },
    { id: 'pkg-setup', name: 'Profile Setup & Optimization', price: 800, sessions: 1, expiryDays: 15, branch: 'ALL', type: 'Other' }
  ]);
  const [matchmakers, setMatchmakers] = useState<Matchmaker[]>([]);
  const coaches = matchmakers;
  const setCoaches = setMatchmakers;
  const [userTargets, setUserTargets] = useState<UserSalesTarget[]>([]);
  const [matchMeetings, setMatchMeetings] = useState<MatchMeeting[]>([]);
  const attendances = matchMeetings;
  const setAttendances = setMatchMeetings;
  const [globalSalesTarget, setGlobalSalesTarget] = useState(50000);
  const [branding, setBranding] = useState<BrandingSettings>({
    companyName: 'PureMatch CRM',
    logoUrl: ''
  });
  const [commissionRates, setCommissionRates] = useState<CommissionRates>({
    ptRate: 8,
    groupRate: 5
  });

  // Local Storage Sandbox Key definitions
  const STORAGE_KEYS = {
    USER: 'dating_crm_user',
    PROFILES: 'dating_crm_profiles',
    MATCHES: 'dating_crm_matches',
    TASKS: 'dating_crm_tasks',
    AUDIT: 'dating_crm_audit',
    BATCHES: 'dating_crm_batches',
    COMMENTS: 'dating_crm_comments',
    INTERACTIONS: 'dating_crm_interactions',
    USERS: 'dating_crm_users'
  };

  // Helper to add audit log
  const addAuditLog = useCallback(async (action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: currentUser.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          timestamp: newLog.timestamp
        });
      } catch (e) {
        console.error('Audit logger failed to save to Supabase:', e);
      }
    }

    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Load Initial Database State
  const fetchAllData = useCallback(async (userId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch Users
        const { data: dbUsers } = await supabase.from('users').select('*');
        if (dbUsers) setUsers(dbUsers.map(snakeToCamel));

        // Fetch Profiles
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles) setBaseClients(dbProfiles.map(snakeToCamel));

        // Fetch Matches
        const { data: dbMatches } = await supabase.from('matches').select('*');
        if (dbMatches) {
          const mappedMatches = dbMatches.map(m => {
            const camel = snakeToCamel(m);
            return {
              ...camel,
              clientId: camel.clientId || camel.maleId || '',
              date: camel.date || camel.createdAt || new Date().toISOString()
            };
          });
          setBaseMatches(mappedMatches);
        }

        // Fetch Tasks
        const { data: dbTasks } = await supabase.from('tasks').select('*');
        if (dbTasks) setTasks(dbTasks.map(snakeToCamel));

        // Fetch Audit Logs
        const { data: dbLogs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
        if (dbLogs) setAuditLogs(dbLogs.map(snakeToCamel));

        // Fetch Comments
        const { data: dbComments } = await supabase.from('comments').select('*');
        if (dbComments) {
          const commMap: Record<string, CRMComment[]> = {};
          dbComments.forEach(c => {
            const camel = snakeToCamel(c);
            const profId = camel.profileId;
            if (!commMap[profId]) commMap[profId] = [];
            commMap[profId].push(camel);
          });
          setComments(commMap);
        }

        // Fetch Interactions
        const { data: dbInteractions } = await supabase.from('interactions').select('*');
        if (dbInteractions) {
          const intMap: Record<string, InteractionLog[]> = {};
          dbInteractions.forEach(i => {
            const camel = snakeToCamel(i);
            const profId = camel.profileId;
            if (!intMap[profId]) intMap[profId] = [];
            intMap[profId].push(camel);
          });
          setInteractions(intMap);
        }
      } catch (error) {
        console.error('Error fetching Supabase data:', error);
      }
    } else {
      // Local Storage Load
      const loadedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      setUsers(loadedUsers ? JSON.parse(loadedUsers) : MOCK_USERS);

      const loadedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const parsedProfiles = loadedProfiles ? JSON.parse(loadedProfiles) : [];
      setBaseClients(parsedProfiles.length > 0 ? parsedProfiles : mockClients);

      const loadedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
      const parsedMatches = loadedMatches ? JSON.parse(loadedMatches) : [];
      setBaseMatches(parsedMatches.length > 0 ? parsedMatches : mockMatches);

      const loadedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      setTasks(loadedTasks ? JSON.parse(loadedTasks) : []);

      const loadedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      setAuditLogs(loadedAudit ? JSON.parse(loadedAudit) : []);

      const loadedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
      setImportBatches(loadedBatches ? JSON.parse(loadedBatches) : []);

      const loadedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      setComments(loadedComments ? JSON.parse(loadedComments) : {});

      const loadedInteractions = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
      setInteractions(loadedInteractions ? JSON.parse(loadedInteractions) : {});

      const loadedTargets = localStorage.getItem('dating_crm_targets');
      setUserTargets(loadedTargets ? JSON.parse(loadedTargets) : []);
    }
  }, []);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      let savedUser: User | null = null;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('email', data.user.email).single();
          if (profile) {
            savedUser = snakeToCamel(profile);
          } else {
            savedUser = {
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              role: 'rep'
            };
            await supabase.from('users').insert(camelToSnake(savedUser));
          }
        }
      } else {
        const localUser = localStorage.getItem(STORAGE_KEYS.USER);
        savedUser = localUser ? JSON.parse(localUser) : null;
      }
      
      if (savedUser) {
        setCurrentUser(savedUser);
        await fetchAllData(savedUser.id);
      }
      setIsAuthReady(true);
    };

    initAuth();
  }, [fetchAllData]);

  // Login handler
  const login = async (email?: string, name?: string, role?: UserRole) => {
    // If Supabase auth is wired, we could do signInWithOAuth.
    // However, to make this incredibly easy for the admins out-of-the-box,
    // we support typing or picking pre-defined accounts to log in!
    const targetEmail = email || 'sarah@datingcrm.com';
    const targetName = name || 'Sarah';
    const targetRole = role || 'crm_admin';

    let userObj: User = {
      id: targetEmail.replace(/[^a-zA-Z0-9]/g, '-'),
      name: targetName,
      email: targetEmail,
      role: targetRole
    };

    if (isSupabaseConfigured && supabase) {
      // Upsert into Supabase Users table
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', targetEmail).single();
      if (existingUser) {
        userObj = snakeToCamel(existingUser);
      } else {
        await supabase.from('users').insert(camelToSnake(userObj));
      }
    } else {
      // Local Storage users save
      const localUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const currentUsersList: User[] = localUsers ? JSON.parse(localUsers) : MOCK_USERS;
      if (!currentUsersList.find(u => u.email === targetEmail)) {
        const updatedUsersList = [...currentUsersList, userObj];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsersList));
        setUsers(updatedUsersList);
      }
    }

    setCurrentUser(userObj);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
    await fetchAllData(userObj.id);
  };

  // Logout handler
  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  };

  // Programmatic Client-Side Privacy Masking Rule Engine
  const maskProfile = useCallback((profile: Client, allMatches: Match[]) => {
    // Find all matches relating to this profile
    const profileMatches = allMatches.filter(m => m.maleId === profile.id || m.femaleId === profile.id);
    
    let photosUnlocked = false;
    let contactsUnlocked = false;

    for (const m of profileMatches) {
      // Unlocked if Phase 1 has mutual text approvals
      if (
        (m.maleProfileApproved && m.femaleProfileApproved) ||
        [
          'PENDING_PHOTO_APPROVAL', 
          'PENDING_CONTACT_SHARE', 
          'MATCH_ACTIVE', 
          'PENDING_FEEDBACK'
        ].includes(m.status)
      ) {
        photosUnlocked = true;
      }

      // Unlocked if Phase 2 has mutual photo approvals
      if (
        (m.malePhotoApproved && m.femalePhotoApproved) ||
        [
          'PENDING_CONTACT_SHARE', 
          'MATCH_ACTIVE', 
          'PENDING_FEEDBACK'
        ].includes(m.status)
      ) {
        contactsUnlocked = true;
      }
    }

    return {
      ...profile,
      // If photo is locked, block details
      recentPhoto: photosUnlocked ? profile.recentPhoto : (profile.recentPhoto ? '' : undefined),
      phone: contactsUnlocked ? profile.phone : '[Locked - Awaiting Mutual Approvals]',
      phoneNumber: contactsUnlocked ? profile.phoneNumber : '[Locked - Awaiting Mutual Approvals]',
      facebookLink: contactsUnlocked ? profile.facebookLink : (profile.facebookLink ? '' : undefined)
    };
  }, []);

  // Compute Masked Profiles
  const rawClients = useMemo(() => {
    return baseClients.map(c => ({
      ...c,
      comments: comments[c.id] || [],
      interactions: interactions[c.id] || []
    })) as Client[];
  }, [baseClients, comments, interactions]);

  const clients = useMemo(() => {
    return rawClients.map(c => maskProfile(c, baseMatches));
  }, [rawClients, baseMatches, maskProfile]);

  const profiles = clients;
  const rawProfiles = rawClients;

  // Audit Logs Getter
  const activePairings = useMemo(() => {
    return baseMatches as unknown as ActivePairing[];
  }, [baseMatches]);

  const ptPackageRecords = activePairings;
  const matches = baseMatches;

  // CRUD Operations: PROFILES (adapted from Clients)
  const addClient = async (client: Client) => {
    const newId = client.id || Math.random().toString(36).substr(2, 9);
    const newClient: Client = {
      ...client,
      id: newId,
      createdAt: client.createdAt || new Date().toISOString(),
      status: client.status || 'Pending Review'
    };

    if (isSupabaseConfigured && supabase) {
      const dbObj = camelToSnake(newClient);
      delete dbObj.comments;
      delete dbObj.interactions;
      const { error } = await supabase.from('profiles').insert(dbObj);
      if (error) throw error;
    } else {
      const currentList = [...baseClients, newClient];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => [...prev, newClient]);
    await addAuditLog('CREATE', 'CLIENT', newId, `Created matchmaking profile for ${newClient.code || newClient.name}`);
  };

  const bulkAddClients = async (clientsList: Client[]) => {
    const successList: Client[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < clientsList.length; i++) {
      const client = clientsList[i];
      const newId = client.id || Math.random().toString(36).substr(2, 9);
      const newClient: Client = {
        ...client,
        id: newId,
        createdAt: new Date().toISOString(),
        status: client.status || 'Pending Review'
      };

      try {
        if (isSupabaseConfigured && supabase) {
          const dbObj = camelToSnake(newClient);
          delete dbObj.comments;
          delete dbObj.interactions;
          const { error } = await supabase.from('profiles').insert(dbObj);
          if (error) throw error;
        }
        successList.push(newClient);
      } catch (e: any) {
        errors.push({ row: i + 1, reason: e.message || String(e) });
      }
    }

    if (!isSupabaseConfigured) {
      const currentList = [...baseClients, ...clientsList];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
      setBaseClients(currentList);
      return { success: clientsList.length, failed: 0, errors: [] };
    } else {
      setBaseClients(prev => [...prev, ...successList]);
      await addAuditLog('CREATE', 'CLIENT', 'bulk', `Bulk imported ${successList.length} profiles successfully.`);
      return { success: successList.length, failed: errors.length, errors };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.comments;
    delete cleanUpdates.interactions;

    if (isSupabaseConfigured && supabase) {
      const dbObj = camelToSnake(cleanUpdates);
      const { error } = await supabase.from('profiles').update(dbObj).eq('id', id);
      if (error) throw error;
    } else {
      const currentList = baseClients.map(c => c.id === id ? { ...c, ...cleanUpdates } : c);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => prev.map(c => c.id === id ? { ...c, ...cleanUpdates } : c));
    await addAuditLog('UPDATE', 'CLIENT', id, `Updated profile details for ID: ${id}`);
  };

  const deleteClient = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    } else {
      const currentList = baseClients.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => prev.filter(c => c.id !== id));
    await addAuditLog('DELETE', 'CLIENT', id, `Deleted profile: ${id}`);
  };

  const deleteMultipleClients = async (ids: string[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').delete().in('id', ids);
      if (error) throw error;
    } else {
      const currentList = baseClients.filter(c => !ids.includes(c.id));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => prev.filter(c => !ids.includes(c.id)));
    await addAuditLog('DELETE', 'CLIENT', 'bulk', `Deleted ${ids.length} profiles.`);
  };

  // Helper to trigger transactional matchmaking emails
  const triggerEmailFunction = useCallback(async (payload: {
    event: 'match_proposed' | 'mutual_text_approved' | 'match_success' | 'admin_inactivity_warning';
    ladyEmail?: string;
    gentlemanEmail?: string;
    ladyCode?: string;
    gentlemanCode?: string;
    adminEmail?: string;
    notes?: string;
  }) => {
    console.log('Matchmaking CRM: Dispatches email trigger ->', payload);
    
    if (isSupabaseConfigured && supabase) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const { data: sessionData } = await supabase.auth.getSession();
        
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('Matchmaking CRM: Supabase Edge Function fetch failure:', err);
      }
    } else {
      // Offline/Sandbox visual logging to console with styled elements
      console.log(
        `%c[SANDBOX EMAIL SIMULATION]%c\nEvent: ${payload.event}\nLady: ${payload.ladyCode} (${payload.ladyEmail || 'no-email'})\nGentleman: ${payload.gentlemanCode} (${payload.gentlemanEmail || 'no-email'})`,
        'background: #db2777; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
        'color: #d1d5db;'
      );
    }
  }, []);

  // CRUD Operations: MATCHES
  const addMatch = async (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMatch: Match = {
      ...match,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('matches').insert(camelToSnake(newMatch));
      if (error) throw error;
    } else {
      const currentList = [...baseMatches, newMatch];
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(currentList));
    }

    setBaseMatches(prev => [...prev, newMatch]);
    await addAuditLog('CREATE', 'PACKAGE_RECORD', newId, `Proposed match between Gentleman ${newMatch.gentlemanCode} and Lady ${newMatch.ladyCode}`);

    // Trigger transactional match proposed email
    const gentleman = baseClients.find(c => c.id === newMatch.maleId);
    const lady = baseClients.find(c => c.id === newMatch.femaleId);
    if (gentleman || lady) {
      const assignedAdmin = users.find(u => u.id === newMatch.responsibleAdminId);
      const adminEmail = assignedAdmin?.email || currentUser?.email || 'admin@purematch.app';
      
      triggerEmailFunction({
        event: 'match_proposed',
        ladyEmail: lady?.email || '',
        gentlemanEmail: gentleman?.email || '',
        ladyCode: newMatch.ladyCode || lady?.code || 'Lady',
        gentlemanCode: newMatch.gentlemanCode || gentleman?.code || 'Gentleman',
        adminEmail,
        notes: newMatch.notes || 'Proposed match created.'
      });
    }
  };

  const updateMatch = async (id: string, updates: Partial<Match>) => {
    const oldMatch = baseMatches.find(m => m.id === id);
    const timeUpdates = { ...updates, updatedAt: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('matches').update(camelToSnake(timeUpdates)).eq('id', id);
      if (error) throw error;
    } else {
      const currentList = baseMatches.map(m => m.id === id ? { ...m, ...timeUpdates } : m);
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(currentList));
    }

    setBaseMatches(prev => prev.map(m => m.id === id ? { ...m, ...timeUpdates } : m));
    await addAuditLog('UPDATE', 'PACKAGE_RECORD', id, `Updated Match progress for ID: ${id}`);

    // Transactional emails triggers on match updates
    if (oldMatch) {
      const gentleman = baseClients.find(c => c.id === oldMatch.maleId);
      const lady = baseClients.find(c => c.id === oldMatch.femaleId);
      
      const ladyEmail = lady?.email || '';
      const gentlemanEmail = gentleman?.email || '';
      const ladyCode = oldMatch.ladyCode || lady?.code || 'Lady';
      const gentlemanCode = oldMatch.gentlemanCode || gentleman?.code || 'Gentleman';

      const assignedAdmin = users.find(u => u.id === oldMatch.responsibleAdminId);
      const adminEmail = assignedAdmin?.email || currentUser?.email || 'admin@purematch.app';

      // 1. Check if both approved profile description (Phase 1 mutual text approval)
      const wasTextApproved = oldMatch.maleProfileApproved && oldMatch.femaleProfileApproved;
      const isMaleTextApproved = updates.maleProfileApproved !== undefined ? updates.maleProfileApproved : !!oldMatch.maleProfileApproved;
      const isFemaleTextApproved = updates.femaleProfileApproved !== undefined ? updates.femaleProfileApproved : !!oldMatch.femaleProfileApproved;
      const isTextApprovedNow = isMaleTextApproved && isFemaleTextApproved;

      if (!wasTextApproved && isTextApprovedNow) {
        triggerEmailFunction({
          event: 'mutual_text_approved',
          ladyEmail,
          gentlemanEmail,
          ladyCode,
          gentlemanCode,
          adminEmail,
          notes: updates.notes || oldMatch.notes || 'Descriptions approved.'
        });
      }

      // 2. Check if contact share details are mutually unlocked (Phase 3 match success)
      const wasMatchSuccess = (oldMatch.maleContactApproved && oldMatch.femaleContactApproved) || oldMatch.status === 'MATCH_ACTIVE';
      const isMaleContactApproved = updates.maleContactApproved !== undefined ? updates.maleContactApproved : !!oldMatch.maleContactApproved;
      const isFemaleContactApproved = updates.femaleContactApproved !== undefined ? updates.femaleContactApproved : !!oldMatch.femaleContactApproved;
      const isStatusActiveNow = updates.status === 'MATCH_ACTIVE';
      const isMatchSuccessNow = (isMaleContactApproved && isFemaleContactApproved) || isStatusActiveNow;

      if (!wasMatchSuccess && isMatchSuccessNow) {
        triggerEmailFunction({
          event: 'match_success',
          ladyEmail,
          gentlemanEmail,
          ladyCode,
          gentlemanCode,
          adminEmail,
          notes: updates.notes || oldMatch.notes || 'Match succeeded!'
        });
      }
    }
  };

  const deleteMatch = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
    } else {
      const currentList = baseMatches.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(currentList));
    }

    setBaseMatches(prev => prev.filter(m => m.id !== id));
    await addAuditLog('DELETE', 'PACKAGE_RECORD', id, `Deleted match transaction: ${id}`);
  };

  // CRUD Operations: COMMENTS & INTERACTIONS
  const addComment = async (clientId: string, text: string, author?: string) => {
    const newComment: CRMComment = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: new Date().toISOString(),
      author: author || currentUser?.name || 'Admin'
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('comments').insert({
        profile_id: clientId,
        text,
        author: newComment.author,
        created_at: newComment.date
      });
    }

    setComments(prev => {
      const current = prev[clientId] || [];
      const updated = { ...prev, [clientId]: [...current, newComment] };
      if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
      return updated;
    });
  };

  const addInteraction = async (clientId: string, interaction: Omit<InteractionLog, 'id' | 'author'>) => {
    const newLog: InteractionLog = {
      ...interaction,
      id: Math.random().toString(36).substr(2, 9),
      author: currentUser?.name || 'Admin'
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('interactions').insert({
        profile_id: clientId,
        type: newLog.type,
        outcome: newLog.outcome,
        notes: newLog.notes,
        next_follow_up: newLog.nextFollowUp || null,
        author: newLog.author
      });
    }

    setInteractions(prev => {
      const current = prev[clientId] || [];
      const updated = { ...prev, [clientId]: [...current, newLog] };
      if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  // CRUD Operations: TASKS
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'admin'
    };

    if (isSupabaseConfigured && supabase) {
      const dbObj = camelToSnake(newTask);
      const { error } = await supabase.from('tasks').insert(dbObj);
      if (error) throw error;
    } else {
      const currentList = [...tasks, newTask];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => [...prev, newTask]);
    await addAuditLog('CREATE', 'TASK', newId, `Added new task: ${newTask.title}`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').update(camelToSnake(updates)).eq('id', id);
      if (error) throw error;
    } else {
      const currentList = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } else {
      const currentList = tasks.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // User Management
  const updateUser = async (id: string, updates: Partial<User>) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').update(camelToSnake(updates)).eq('id', id);
    } else {
      const currentList = users.map(u => u.id === id ? { ...u, ...updates } : u);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentList));
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').delete().eq('id', id);
    } else {
      const currentList = users.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentList));
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const inviteUser = async (email: string, role: UserRole) => {
    const newId = 'invited-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newId,
      name: email.split('@')[0],
      email,
      role
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').insert(camelToSnake(newUser));
    } else {
      const currentList = [...users, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentList));
    }
    setUsers(prev => [...prev, newUser]);
  };

  // Import tracker stubs
  const addImportBatch = async (batch: Omit<ImportBatch, 'id'>): Promise<string> => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newBatch = { ...batch, id: newId };
    setImportBatches(prev => [newBatch, ...prev]);
    if (!isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([newBatch, ...importBatches]));
    }
    return newId;
  };

  const rollbackImport = async (batchId: string) => {
    // Delete all profiles matching batchId
    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').delete().eq('import_batch_id', batchId);
    }
    setBaseClients(prev => prev.filter(c => c.importBatchId !== batchId));
    setImportBatches(prev => prev.filter(b => b.id !== batchId));
    alert('Import rolled back successfully.');
  };

  // CRM Permissions helper variables
  const effectiveRole = useMemo(() => {
    if ((currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'crm_admin') && previewRole) {
      return previewRole;
    }
    return currentUser?.role;
  }, [currentUser, previewRole]);

  const isManagerOrAdmin = useMemo(() => {
    if (!currentUser) return false;
    const role = effectiveRole;
    return role === 'manager' || role === 'admin' || role === 'super_admin' || role === 'crm_admin';
  }, [currentUser, effectiveRole]);

  const isStrictManager = useMemo(() => {
    if (!currentUser) return false;
    const role = effectiveRole;
    return role === 'manager' || role === 'super_admin' || role === 'crm_admin';
  }, [currentUser, effectiveRole]);

  const canDeletePayments = useMemo(() => {
    const role = effectiveRole;
    return role === 'super_admin' || role === 'crm_admin' || role === 'manager' || role === 'admin';
  }, [effectiveRole]);

  const canAccessSettings = useMemo(() => {
    const role = effectiveRole;
    return role === 'super_admin' || role === 'crm_admin' || role === 'manager' || role === 'admin';
  }, [effectiveRole]);

  const canViewGlobalDashboard = useMemo(() => {
    const role = effectiveRole;
    return role === 'super_admin' || role === 'crm_admin' || role === 'manager' || role === 'admin';
  }, [effectiveRole]);

  const canDeleteRecords = useMemo(() => {
    const role = effectiveRole;
    return role === 'super_admin' || role === 'crm_admin' || role === 'manager' || role === 'admin';
  }, [effectiveRole]);

  const canAssignLeads = useMemo(() => {
    const role = effectiveRole;
    return role === 'super_admin' || role === 'crm_admin' || role === 'manager' || role === 'admin';
  }, [effectiveRole]);

  const wipeSystem = async () => {
    const confirm = window.confirm('DANGER: This will permanently wipe all local database states. Continue?');
    if (!confirm) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      localStorage.clear();
    }
    setBaseClients([]);
    setBaseMatches([]);
    setTasks([]);
    setAuditLogs([]);
    alert('System database wiped successfully.');
  };

  // Adapted implementations for modernized matchmaking functions
  const addPayment = async () => {};
  const updatePayment = async () => {};
  const deletePayment = async () => {};
  const bulkAddPayments = async () => {};
  const addPackage = async () => {};
  const updatePackage = async () => {};
  const deletePackage = async () => {};
  
  const addMatchmaker = async (matchmaker: Omit<Matchmaker, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newRecord = { ...matchmaker, id: newId };
    setMatchmakers(prev => [...prev, newRecord]);
    await addAuditLog('CREATE', 'MATCHMAKER', newId, `Added matchmaker: ${matchmaker.name}`);
  };
  const updateMatchmaker = async (id: string, updates: Partial<Matchmaker>) => {
    setMatchmakers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await addAuditLog('UPDATE', 'MATCHMAKER', id, `Updated matchmaker ID: ${id}`);
  };
  const deleteMatchmaker = async (id: string) => {
    setMatchmakers(prev => prev.filter(m => m.id !== id));
    await addAuditLog('DELETE', 'MATCHMAKER', id, `Deleted matchmaker ID: ${id}`);
  };

  // Legacy mappings for Coach
  const addCoach = addMatchmaker;
  const updateCoach = updateMatchmaker;
  const deleteCoach = deleteMatchmaker;

  const recordMatchMeeting = async (clientId: string, branch: Branch) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMeeting: MatchMeeting = {
      id: newId,
      clientId,
      branch,
      date: new Date().toISOString(),
      recordedBy: currentUser?.id || 'admin'
    };
    setMatchMeetings(prev => [...prev, newMeeting]);
    await addAuditLog('CREATE', 'MATCH_MEETING', newId, `Recorded check-in/meeting for profile ID: ${clientId}`);
  };

  // Legacy mapping for Attendance
  const recordAttendance = recordMatchMeeting;

  const recalculateAllPackages = async () => {};
  const updateSalesTarget = async () => {};
  const updateUserTarget = async (userId: string, month: string, total: number, privateTarget: number, groupTarget: number) => {
    const newTargetRecord: UserSalesTarget = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      sales_rep_id: userId,
      month,
      month_year: month,
      targetAmount: total,
      target_total_private: privateTarget,
      target_total_group: groupTarget,
      privateTarget,
      groupTarget,
      setBy: currentUser?.id || 'admin',
      createdAt: new Date().toISOString()
    };
    
    setUserTargets(prev => {
      const filtered = prev.filter(t => !(t.userId === userId && t.month === month));
      const updated = [...filtered, newTargetRecord];
      localStorage.setItem('dating_crm_targets', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('UPDATE', 'TARGET', userId, `Updated activity targets for rep ${userId} for ${month}`);
  };

  const addActivePairing = async (pairing: Omit<ActivePairing, 'id'>) => {
    await addMatch(pairing as any);
  };
  const updateActivePairing = async (id: string, updates: Partial<ActivePairing>) => {
    await updateMatch(id, updates as any);
  };

  // Legacy mapping for PTPackageRecord
  const addPTPackageRecord = addActivePairing;
  const updatePTPackageRecord = updateActivePairing;
  const selfCheckIn = async () => ({ success: false, message: 'Check-in not configured in matchmaking' });
  const mergeDuplicates = async () => {};
  const backfillMemberIds = async () => {};
  const updateCommissionRates = async () => {};
  const updateBranding = async (updates: Partial<BrandingSettings>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  };

  // Compile full context value
  const contextValue = useMemo(() => ({
    currentUser,
    users,
    login,
    logout,
    clients,
    rawClients,
    profiles,
    rawProfiles,
    salesTarget: { targetAmount: 100, currentAmount: 0, privatePackagesSold: 0, groupPackagesSold: 0, privateTarget: 50, groupTarget: 50 },
    payments,
    activePairings,
    ptPackageRecords,
    matches,
    auditLogs,
    tasks,
    packages,
    matchmakers,
    coaches,
    importBatches,
    userTargets,
    searchQuery,
    setSearchQuery,
    addClient,
    bulkAddClients,
    updateClient,
    deleteClient,
    deleteMultipleClients,
    updateUser,
    deleteUser,
    inviteUser,
    addComment,
    addInteraction,
    addPayment,
    updatePayment,
    updateSalesTarget,
    updateUserTarget,
    addActivePairing,
    updateActivePairing,
    addPTPackageRecord,
    updatePTPackageRecord,
    addMatch,
    updateMatch,
    deleteMatch,
    addTask,
    updateTask,
    deleteTask,
    addPackage,
    updatePackage,
    deletePackage,
    addMatchmaker,
    updateMatchmaker,
    deleteMatchmaker,
    addCoach,
    updateCoach,
    deleteCoach,
    addImportBatch,
    rollbackImport,
    isAuthReady,
    branding,
    updateBranding,
    previewRole,
    setPreviewRole,
    matchMeetings,
    recordMatchMeeting,
    attendances,
    recordAttendance,
    deletePayment,
    wipeSystem,
    bulkAddPayments,
    canDeletePayments,
    canAccessSettings,
    canViewGlobalDashboard,
    canDeleteRecords,
    canAssignLeads,
    recalculateAllPackages,
    selfCheckIn,
    mergeDuplicates,
    backfillMemberIds,
    commissionRates,
    updateCommissionRates,
    isManagerOrAdmin,
    isStrictManager
  }), [
    currentUser,
    users,
    clients,
    rawClients,
    profiles,
    rawProfiles,
    payments,
    activePairings,
    ptPackageRecords,
    matches,
    auditLogs,
    tasks,
    packages,
    matchmakers,
    coaches,
    importBatches,
    userTargets,
    searchQuery,
    isAuthReady,
    branding,
    previewRole,
    matchMeetings,
    attendances,
    canDeletePayments,
    canAccessSettings,
    canViewGlobalDashboard,
    canDeleteRecords,
    canAssignLeads,
    commissionRates,
    isManagerOrAdmin,
    isStrictManager
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
