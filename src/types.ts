export type ClientStatus = 'Lead' | 'Active' | 'Nearly Expired' | 'Expired' | 'Hold' | 'Pending' | 'Approved' | 'Rejected' | 'Pending Review';
export type LeadInterest = 'Interested' | 'Not Interested' | 'Pending';
export type LeadCategory = 'Location mismatch' | 'Social status mismatch' | 'Price' | 'No answer' | 'Age mismatch' | 'Religious denomination mismatch' | 'Other' | 'None';
export type LeadSource = 'Instagram' | 'WhatsApp' | 'Walk-in' | 'TikTok' | 'Other';
export type LeadStage = 'New' | 'Consultation Scheduled' | 'Follow Up' | 'Converted' | 'Lost';
export type PackageType = 'Private' | 'Group';
export type UserRole = 'manager' | 'rep' | 'admin' | 'super_admin' | 'crm_admin';
export type InteractionType = 'Call' | 'WhatsApp' | 'Email' | 'Visit';
export type InteractionOutcome = 'Interested' | 'Not Answered' | 'Scheduled Consultation' | 'Rejected' | 'Other';

export type Branch = 'CAIRO' | 'GIZA' | 'ONLINE';

export interface Package {
  id: string;
  name: string;
  price: number;
  sessions: number; // Keep field name for now but logic uses as packages
  expiryDays: number;
  branch: Branch | 'ALL';
  type: 'Private' | 'Group' | 'Other';
}

export interface Matchmaker {
  id: string;
  name: string;
  active: boolean;
}

export type Coach = Matchmaker; // Legacy compatibility mapping

export interface ImportBatch {
  id: string;
  date: string;
  fileName: string;
  importedCount: number;
  failedCount: number;
  errors: { row: number; reason: string }[];
  status: 'Completed' | 'Rolled Back';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  salesTarget?: number;
  can_delete_payments?: boolean;
  can_view_global_dashboard?: boolean;
  can_access_settings_and_history?: boolean;
}

export enum MatchStatus {
  PENDING_PROFILE_APPROVAL = 'PENDING_PROFILE_APPROVAL',
  PENDING_PHOTO_APPROVAL = 'PENDING_PHOTO_APPROVAL',
  PENDING_CONTACT_SHARE = 'PENDING_CONTACT_SHARE',
  MATCH_ACTIVE = 'MATCH_ACTIVE',
  PENDING_FEEDBACK = 'PENDING_FEEDBACK'
}

export interface Match {
  id: string;
  maleId: string;
  maleName: string;
  maleProfileApproved?: boolean;
  malePhotoApproved?: boolean;
  maleContactApproved?: boolean;
  femaleId: string;
  femaleName: string;
  femaleProfileApproved?: boolean;
  femalePhotoApproved?: boolean;
  femaleContactApproved?: boolean;
  status: MatchStatus;
  notes?: string;
  responsibleAdminId?: string;
  responsibleAdminName?: string;
  firstCheck?: string; // after a week
  secondCheck?: string; // after a month
  thirdCheck?: string; // after three months
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  gentlemanCode?: string;
  ladyCode?: string;

  // Legacy PTPackageRecord fields to maintain compatibility
  clientId?: string;
  date?: string; // ISO string
  trainerId?: string; // userId
  branch?: Branch;
}

export interface ActivePairing extends Match {}
export interface PTPackageRecord extends ActivePairing {} // Legacy compatibility mapping

export interface CRMComment {
  id: string;
  text: string;
  date: string; // ISO string
  author: string;
}

export interface InteractionLog {
  id: string;
  date: string; // ISO string
  type: InteractionType;
  outcome: InteractionOutcome;
  notes: string;
  nextFollowUp?: string; // ISO string
  author: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'CLIENT' | 'PAYMENT' | 'PACKAGE_RECORD' | 'LEAD' | 'TARGET' | 'ATTENDANCE' | 'COACH' | 'MATCHMAKER' | 'ACTIVE_PAIRING' | 'MATCH_MEETING';
  entityId: string;
  details: string;
  timestamp: string;
  branch?: Branch;
}

export interface Payment {
  id: string;
  clientId: string;
  client_name: string;
  amount: number;
  amount_paid: number;
  date: string; // ISO string
  method: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Instapay' | 'Other';
  instapayRef?: string; // 12 digits
  packageType: string;
  package_category_type: 'Private Training' | 'Group Training';
  coachName?: string; // Optional coach name for PT packages
  coach_name?: string; // Aligning with requested schema
  notes?: string;
  recordedBy?: string; // userId
  sales_rep_id: string;
  salesName?: string;
  discountType?: 'percentage' | 'amount'; // Type of discount
  discountValue?: number; // Discount percentage (0-100) or fixed amount
  discountedAmount?: number; // Final amount after discount
  created_at: string; // ISO string
  deleted_at?: string | null; // ISO string (soft delete)
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  status: ClientStatus;
  assignedTo?: string; // userId
  branch?: Branch;
  memberId?: string; // Sequential ID for matchmaking candidates/profiles
  code?: string; // Sequential ID for matchmaking (L101, G101)
  importBatchId?: string; // ID of the import batch this client was created in
  createdAt?: string;

  // Dating fields from CSV
  timestamp?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  areYouGucian?: string;
  gucId?: string;
  recentPhoto?: string;
  age?: number;
  locationOfResidence?: string;
  height?: string;
  universityFieldOfStudy?: string;
  currentJob?: string;
  maritalStatus?: string;
  haveChildren?: string;
  childrenDetails?: string;
  gender?: 'Male' | 'Female' | string;
  religion?: string;
  believeDutyToProvide?: string;
  areOkayWithWifeWorking?: string;
  currentFinancialStatus?: string;
  religiousDenomination?: string;
  preferredReligiousDenomination?: string;
  hijabPreference?: string;
  prayRegularly?: string;
  religiousCommitmentLevel?: string;
  preferredAgeRange?: string;
  openToLongDistance?: string;
  willingToRelocate?: string;
  partnerPreferences?: string;
  selfIntroduction?: string;
  smokeOrDrink?: string;
  facebookLink?: string;
  preferOlderOrYounger?: string;
  processed?: string;
  helperDate?: string;
  finalAge?: number;
  rejectionReason?: string;

  // Lead specific
  interest?: LeadInterest;
  category?: LeadCategory;
  source?: LeadSource;
  stage?: LeadStage;
  expectedVisitDate?: string; // ISO string
  trialDate?: string; // ISO string
  
  // Matchmaking Profile specific
  packageType?: string; // e.g., "Standard", "Premium" matchmaking plans
  sessionsRemaining?: number | string; // e.g., remaining introductions/matches or "no attend"
  startDate?: string; // ISO string of contract start
  membershipExpiry?: string; // ISO string of contract end/expiry
  dateOfBirth?: string; // ISO string
  points?: number;
  typeOfClient?: string;
  salesName?: string;
  
  comments?: CRMComment[];
  interactions?: InteractionLog[];
  lastContactDate?: string; // ISO string
  nextReminderDate?: string; // ISO string
  paid?: boolean;
  hasDiscount?: boolean; // Flag to indicate if member has received a discount
}

export interface Client extends Profile {}

export interface MatchMeeting {
  id: string;
  clientId: string;
  branch: Branch;
  date: string; // ISO string
  recordedBy: string; // userId
  packageName?: string;
}

export type Attendance = MatchMeeting; // Legacy compatibility mapping

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  status: TaskStatus;
  priority: TaskPriority;
  clientId?: string;
  assignedTo: string; // userId
  createdBy: string; // userId
  createdAt: string; // ISO string
}

export interface SalesTarget {
  targetAmount: number;
  currentAmount: number;
  privatePackagesSold: number;
  groupPackagesSold: number;
  privateTarget: number;
  groupTarget: number;
}

export interface CommissionRates {
  ptRate: number;
  groupRate: number;
}

export interface UserSalesTarget {
  id: string;
  userId: string;
  sales_rep_id: string;
  month: string; // 'YYYY-MM'
  month_year: string; // 'YYYY-MM'
  targetAmount: number;
  target_total_private: number;
  target_total_group: number;
  privateTarget: number;
  groupTarget: number;
  setBy: string; // manager userId
  createdAt: string; // ISO string
}

export interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  kioskPin?: string;
  dailyCheckinPin?: string;
}

