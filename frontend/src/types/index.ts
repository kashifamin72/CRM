export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  phoneNumber?: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  role: string;
}

export enum LeadStatus {
  New = 0,
  Contacted = 1,
  Qualified = 2,
  Proposal = 3,
  ClosedWon = 4,
  ClosedLost = 5,
}

export const LeadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'New',
  [LeadStatus.Contacted]: 'Contacted',
  [LeadStatus.Qualified]: 'Qualified',
  [LeadStatus.Proposal]: 'Proposal',
  [LeadStatus.ClosedWon]: 'Closed Won',
  [LeadStatus.ClosedLost]: 'Closed Lost',
};

export const LeadStatusColors: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'bg-amber-100 text-amber-800',
  [LeadStatus.Contacted]: 'bg-cyan-100 text-cyan-800',
  [LeadStatus.Qualified]: 'bg-blue-100 text-blue-800',
  [LeadStatus.Proposal]: 'bg-slate-100 text-slate-800',
  [LeadStatus.ClosedWon]: 'bg-green-100 text-green-800',
  [LeadStatus.ClosedLost]: 'bg-red-100 text-red-800',
};

export interface Lead {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactPerson?: string;
  contactDesignation?: string;
  contactMobile?: string;
  address?: string;
  city?: string;
  cityId?: number;
  cityName?: string;
  status: LeadStatus;
  estimatedValue?: number;
  notes?: string;
  leadSourceId?: number;
  leadSourceName?: string;
  leadSourceColor?: string;
  leadSourceIcon?: string;
  businessTypeId?: number;
  businessTypeName?: string;
  businessTypeColor?: string;
  leadDate: string;
  createdById: string;
  createdByName: string;
  createdByPicture?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToPicture?: string;
  createdAt: string;
  updatedAt: string;
  followUpCount: number;
  pendingFollowUpCount?: number;
  messageCount?: number;
}

export interface LeadSource {
  id: number;
  name: string;
  icon?: string;
  color: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface BusinessType {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface FollowUp {
  id: number;
  leadId: number;
  leadTitle?: string;
  title: string;
  description?: string;
  followUpDate: string;
  isCompleted: boolean;
  isOverdue?: boolean;
  createdById: string;
  createdByName: string;
  createdByPicture?: string;
  createdAt: string;
  completedAt?: string;
}

export interface MessageLog {
  id: number;
  leadId: number;
  leadTitle?: string;
  toPhoneNumber: string;
  messageBody: string;
  status: string;
  response?: string;
  sentById: string;
  sentByName: string;
  sentByPicture?: string;
  sentAt: string;
}

export enum LeadActivityType {
  Created = 0,
  StatusChanged = 1,
  Forwarded = 2,
  Updated = 3,
}

export interface LeadActivity {
  id: number;
  leadId: number;
  type: LeadActivityType;
  fromStatus?: LeadStatus;
  toStatus?: LeadStatus;
  fromUserId?: string;
  fromUserName?: string;
  fromUserPicture?: string;
  toUserId?: string;
  toUserName?: string;
  toUserPicture?: string;
  performedById: string;
  performedByName: string;
  performedByPicture?: string;
  notes?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  role: string;
  profilePicture?: string;
}

export interface PipelineStage {
  status: LeadStatus;
  count: number;
}

export interface SourceBreakdown {
  sourceName: string;
  sourceColor: string;
  count: number;
  estValue: number;
  percentage?: number;
}

export interface DashboardData {
  totalLeads: number;
  newLeads: number;
  closedWon: number;
  estimatedValue: number;
  pipeline: PipelineStage[];
  sourceBreakdown: SourceBreakdown[];
  todaysFollowUps: FollowUp[];
  tomorrowsFollowUps: FollowUp[];
  recentLeads: Lead[];
  openLeadsByOfficer: OfficerOpenLeads[];
}

export interface OfficerOpenLeads {
  officerId: string | null;
  officerName: string;
  officerPicture?: string;
  leadCount: number;
  totalEstimatedValue: number;
  leads: OpenLeadItem[];
}

export interface OpenLeadItem {
  id: number;
  title: string;
  customerName: string;
  customerPhone: string;
  status: LeadStatus;
  estimatedValue?: number;
  leadSourceName?: string;
  leadSourceColor?: string;
  leadSourceIcon?: string;
  updatedAt: string;
}

export interface ReportData {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  proposalLeads: number;
  closedWon: number;
  closedLost: number;
  estimatedValue: number;
  statusDistribution: { status: string; count: number }[];
  sourceBreakdown: SourceBreakdown[];
  leads: Lead[];
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}
