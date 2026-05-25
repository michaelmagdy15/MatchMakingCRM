import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const isSupabaseConfigured = false;
const supabase: any = null;
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

    try {
      await setDoc(doc(db, 'match_audit_logs', newLog.id), camelToSnake(newLog));
    } catch (e) {
      console.error('Audit logger failed to save to Firestore:', e);
    }

    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Load Initial Database State
  const fetchAllData = useCallback(async (userId: string) => {
    try {
      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, 'match_users'));
      const firestoreUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...snakeToCamel(data)
        } as User;
      });
      setUsers(firestoreUsers);

      // Fetch Profiles
      const profilesSnapshot = await getDocs(collection(db, 'match_profiles'));
      const firestoreProfiles = profilesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...snakeToCamel(data)
        } as Client;
      });
      setBaseClients(firestoreProfiles);

      // Fetch Matches
      const matchesSnapshot = await getDocs(collection(db, 'match_matches'));
      const firestoreMatches = matchesSnapshot.docs.map(doc => {
        const data = doc.data();
        const camel = snakeToCamel(data);
        return {
          id: doc.id,
          ...camel,
          clientId: camel.clientId || camel.maleId || '',
          date: camel.date || camel.createdAt || new Date().toISOString()
        } as Match;
      });
      setBaseMatches(firestoreMatches);

      // Fetch Tasks
      const tasksSnapshot = await getDocs(collection(db, 'match_tasks'));
      const firestoreTasks = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...snakeToCamel(data)
        } as Task;
      });
      setTasks(firestoreTasks);

      // Fetch Audit Logs
      const logsSnapshot = await getDocs(collection(db, 'match_audit_logs'));
      const firestoreLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...snakeToCamel(data)
        } as AuditLog;
      });
      firestoreLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAuditLogs(firestoreLogs);

      // Fetch Comments
      const commentsSnapshot = await getDocs(collection(db, 'match_comments'));
      const commMap: Record<string, CRMComment[]> = {};
      commentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const camelData = snakeToCamel(data);
        const profId = camelData.profileId;
        const camel = {
          id: doc.id,
          text: camelData.text,
          date: camelData.date,
          author: camelData.author
        } as CRMComment;
        if (profId) {
          if (!commMap[profId]) commMap[profId] = [];
          commMap[profId].push(camel);
        }
      });
      setComments(commMap);

      // Fetch Interactions
      const interactionsSnapshot = await getDocs(collection(db, 'match_interactions'));
      const intMap: Record<string, InteractionLog[]> = {};
      interactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const camelData = snakeToCamel(data);
        const profId = camelData.profileId;
        const camel = {
          id: doc.id,
          date: camelData.date,
          type: camelData.type,
          outcome: camelData.outcome,
          notes: camelData.notes,
          nextFollowUp: camelData.nextFollowUp,
          author: camelData.author
        } as InteractionLog;
        if (profId) {
          if (!intMap[profId]) intMap[profId] = [];
          intMap[profId].push(camel);
        }
      });
      setInteractions(intMap);

    } catch (error) {
      console.error('Error fetching Firestore data:', error);
      // Fallback to local storage
      const loadedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      setUsers(loadedUsers ? JSON.parse(loadedUsers) : []);

      const loadedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const parsedProfiles = loadedProfiles ? JSON.parse(loadedProfiles) : [];
      setBaseClients(parsedProfiles);

      const loadedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
      const parsedMatches = loadedMatches ? JSON.parse(loadedMatches) : [];
      setBaseMatches(parsedMatches);

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      let savedUser: User | null = null;
      
      if (firebaseUser) {
        try {
          // Query Firestore match_users collection by UID
          const userDocRef = doc(db, 'match_users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            savedUser = {
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: data.role || 'rep'
            };
          } else {
            // Also try query by email to see if user exists with different ID
            const usersRef = collection(db, 'match_users');
            const q = query(usersRef, where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const matchedDoc = querySnapshot.docs[0];
              const data = matchedDoc.data();
              savedUser = {
                id: matchedDoc.id,
                name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: data.role || 'rep'
              };
            } else {
              // Create user profile in Firestore
              savedUser = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: 'rep'
              };
              await setDoc(userDocRef, camelToSnake(savedUser));
            }
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          savedUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: 'rep'
          };
        }
      } else {
        const localUser = localStorage.getItem(STORAGE_KEYS.USER);
        savedUser = localUser ? JSON.parse(localUser) : null;
      }
      
      if (savedUser) {
        setCurrentUser(savedUser);
        await fetchAllData(savedUser.id);
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [fetchAllData]);

  // Login handler
  const login = async (email?: string, name?: string, role?: UserRole) => {
    const targetEmail = email || 'sarah@datingcrm.com';
    const targetName = name || 'Sarah';
    const targetRole = role || 'crm_admin';

    let userObj: User = {
      id: targetEmail.replace(/[^a-zA-Z0-9]/g, '-'),
      name: targetName,
      email: targetEmail,
      role: targetRole
    };

    try {
      // Query by email in Firestore match_users collection
      const usersRef = collection(db, 'match_users');
      const q = query(usersRef, where('email', '==', targetEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const matchedDoc = querySnapshot.docs[0];
        const data = matchedDoc.data();
        userObj = {
          id: matchedDoc.id,
          name: data.name || targetName,
          email: targetEmail,
          role: data.role || targetRole
        };
      } else {
        const docId = (auth.currentUser && auth.currentUser.email === targetEmail) 
          ? auth.currentUser.uid 
          : targetEmail.replace(/[^a-zA-Z0-9]/g, '-');
        
        userObj = {
          id: docId,
          name: targetName,
          email: targetEmail,
          role: targetRole
        };
        
        const userDocRef = doc(db, 'match_users', docId);
        await setDoc(userDocRef, camelToSnake(userObj));
      }
    } catch (error) {
      console.error("Firestore login update failed:", error);
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
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out from Firebase Auth:", error);
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

    try {
      const dbObj = camelToSnake(newClient);
      delete dbObj.comments;
      delete dbObj.interactions;
      await setDoc(doc(db, 'match_profiles', newId), dbObj);
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
      // Fallback
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
        const dbObj = camelToSnake(newClient);
        delete dbObj.comments;
        delete dbObj.interactions;
        
        await setDoc(doc(db, 'match_profiles', newId), dbObj);
        successList.push(newClient);
      } catch (e: any) {
        errors.push({ row: i + 1, reason: e.message || String(e) });
      }
    }

    if (successList.length > 0) {
      setBaseClients(prev => [...prev, ...successList]);
      await addAuditLog('CREATE', 'CLIENT', 'bulk', `Bulk imported ${successList.length} profiles successfully.`);
    }
    return { success: successList.length, failed: errors.length, errors };
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.comments;
    delete cleanUpdates.interactions;

    try {
      const dbObj = camelToSnake(cleanUpdates);
      await updateDoc(doc(db, 'match_profiles', id), dbObj);
    } catch (error) {
      console.error("Error updating client in Firestore:", error);
      const currentList = baseClients.map(c => c.id === id ? { ...c, ...cleanUpdates } : c);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => prev.map(c => c.id === id ? { ...c, ...cleanUpdates } : c));
    await addAuditLog('UPDATE', 'CLIENT', id, `Updated profile details for ID: ${id}`);
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'match_profiles', id));
    } catch (error) {
      console.error("Error deleting client from Firestore:", error);
      const currentList = baseClients.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(currentList));
    }

    setBaseClients(prev => prev.filter(c => c.id !== id));
    await addAuditLog('DELETE', 'CLIENT', id, `Deleted profile: ${id}`);
  };

  const deleteMultipleClients = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, 'match_profiles', id));
      }
    } catch (error) {
      console.error("Error batch deleting clients from Firestore:", error);
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
        const getEnvVar = (name: string, buildTimeValue: string): string => {
          const runtimeValue = (window as any).__ENV__?.[name];
          if (runtimeValue && runtimeValue !== `__${name}__`) return runtimeValue;
          return buildTimeValue;
        };
        const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL || '');
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
    let newMatch: Match = {
      ...match,
      id: newId,
      responsibleAdminId: match.responsibleAdminId || currentUser?.id || 'admin-sarah',
      responsibleAdminName: match.responsibleAdminName || currentUser?.name || 'Sarah',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const dbMatch = camelToSnake(newMatch);
      await setDoc(doc(db, 'match_matches', newId), dbMatch);
    } catch (error) {
      console.error("Error adding match to Firestore:", error);
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

    try {
      await updateDoc(doc(db, 'match_matches', id), camelToSnake(timeUpdates));
    } catch (error) {
      console.error("Error updating match in Firestore:", error);
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

      // 3. Trigger 1-Week Follow-up task when match becomes active
      const wasActive = oldMatch.status === 'MATCH_ACTIVE';
      const isActiveNow = updates.status === 'MATCH_ACTIVE';
      if (!wasActive && isActiveNow) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const assignedAdminId = oldMatch.responsibleAdminId || currentUser?.id || 'admin-sarah';
        
        await addTask({
          title: `[Matchmaker Follow-up] 1-Week Check for Match #${id} (${ladyCode} & ${gentlemanCode})`,
          description: `Conduct a 1-Week follow-up call with Gentleman ${gentlemanCode} (${oldMatch.maleName}) and Lady ${ladyCode} (${oldMatch.femaleName}) to see how their direct connection is going.`,
          dueDate: dueDate.toISOString(),
          status: 'Pending',
          priority: 'High',
          clientId: oldMatch.maleId,
          assignedTo: assignedAdminId
        });
      }

      // 4. Trigger 1-Month Follow-up when 1-Week check is completed
      if (updates.firstCheck && oldMatch.firstCheck === 'Pending' && updates.firstCheck !== 'Pending') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await addTask({
          title: `[Matchmaker Follow-up] 1-Month Check for Match #${id} (${ladyCode} & ${gentlemanCode})`,
          description: `Conduct a 1-Month check-in with the couple to track their mutual match progress. Current 1-Week status: ${updates.firstCheck}`,
          dueDate: dueDate.toISOString(),
          status: 'Pending',
          priority: 'Medium',
          clientId: oldMatch.maleId,
          assignedTo: oldMatch.responsibleAdminId || currentUser?.id || 'admin-sarah'
        });
      }

      // 5. Trigger 3-Month Follow-up when 1-Month check is completed
      if (updates.secondCheck && oldMatch.secondCheck === 'Pending' && updates.secondCheck !== 'Pending') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 90);
        await addTask({
          title: `[Matchmaker Follow-up] 3-Month Check for Match #${id} (${ladyCode} & ${gentlemanCode})`,
          description: `Conduct a 3-Month relationship review with the couple. Current 1-Month status: ${updates.secondCheck}`,
          dueDate: dueDate.toISOString(),
          status: 'Pending',
          priority: 'Medium',
          clientId: oldMatch.maleId,
          assignedTo: oldMatch.responsibleAdminId || currentUser?.id || 'admin-sarah'
        });
      }
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'match_matches', id));
    } catch (error) {
      console.error("Error deleting match from Firestore:", error);
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

    try {
      await setDoc(doc(db, 'match_comments', newComment.id), camelToSnake({
        ...newComment,
        profileId: clientId
      }));
    } catch (error) {
      console.error("Error adding comment to Firestore:", error);
    }

    setComments(prev => {
      const current = prev[clientId] || [];
      const updated = { ...prev, [clientId]: [...current, newComment] };
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
      return updated;
    });
  };

  const addInteraction = async (clientId: string, interaction: Omit<InteractionLog, 'id' | 'author'>) => {
    const newLog: InteractionLog = {
      ...interaction,
      id: Math.random().toString(36).substr(2, 9),
      author: currentUser?.name || 'Admin'
    };

    try {
      await setDoc(doc(db, 'match_interactions', newLog.id), camelToSnake({
        ...newLog,
        profileId: clientId
      }));
    } catch (error) {
      console.error("Error adding interaction to Firestore:", error);
    }

    setInteractions(prev => {
      const current = prev[clientId] || [];
      const updated = { ...prev, [clientId]: [...current, newLog] };
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(updated));
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

    try {
      const dbObj = camelToSnake(newTask);
      await setDoc(doc(db, 'match_tasks', newId), dbObj);
    } catch (error) {
      console.error("Error adding task to Firestore:", error);
      const currentList = [...tasks, newTask];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => [...prev, newTask]);
    await addAuditLog('CREATE', 'TASK', newId, `Added new task: ${newTask.title}`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'match_tasks', id), camelToSnake(updates));
    } catch (error) {
      console.error("Error updating task in Firestore:", error);
      const currentList = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'match_tasks', id));
    } catch (error) {
      console.error("Error deleting task from Firestore:", error);
      const currentList = tasks.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(currentList));
    }

    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // User Management
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'match_users', id), camelToSnake(updates));
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
      const currentList = users.map(u => u.id === id ? { ...u, ...updates } : u);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentList));
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'match_users', id));
    } catch (error) {
      console.error("Error deleting user from Firestore:", error);
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

    try {
      await setDoc(doc(db, 'match_users', newId), camelToSnake(newUser));
    } catch (error) {
      console.error("Error inviting user to Firestore:", error);
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
    try {
      const q = query(collection(db, 'match_profiles'), where('import_batch_id', '==', batchId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'match_profiles', d.id));
      }
    } catch (error) {
      console.error("Error rolling back import batch in Firestore:", error);
    }
    
    const updatedClients = baseClients.filter(c => c.importBatchId !== batchId);
    const updatedBatches = importBatches.filter(b => b.id !== batchId);

    setBaseClients(updatedClients);
    setImportBatches(updatedBatches);

    if (!isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedClients));
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updatedBatches));
    }
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
    try {
      const collectionsToWipe = ['match_matches', 'match_profiles', 'match_tasks', 'match_audit_logs', 'match_comments', 'match_interactions'];
      for (const colName of collectionsToWipe) {
        const snapshot = await getDocs(collection(db, colName));
        for (const docItem of snapshot.docs) {
          await deleteDoc(doc(db, colName, docItem.id));
        }
      }
    } catch (error) {
      console.error("Error wiping system in Firestore:", error);
    }
    localStorage.clear();
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
