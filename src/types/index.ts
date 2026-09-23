import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'agent' | 'user' | 'resort';

export interface Agent {
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  avatar?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  rating?: number;
  reviews?: number;
  propertiesSold?: number;
  agency?: string;
  yearsOfExperience?: number;
  isVerified?: boolean;
  isResponsible?: boolean;
  role?: string;
}

export interface Resort {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  price: string;
  description: string;
  amenities: string[];
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  gallery: string[];
  createdAt?: any;
  coordinates?: { lat: number; lng: number };
}

export interface PremiumAgency {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isActive: boolean;
  order?: number;
  agentId?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: any;
  planId?: string;
  planLimit?: number;
  planExpiration?: string;
  favorites?: any;
  agencyName?: string;
  isApproved?: boolean;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  nuit?: string;
  alvaraUrl?: string;
  resortName?: string;
  resortDescription?: string;
  resortLocation?: string;
  resortAmenities?: string[] | string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

export interface UserProfile extends User {}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'MZN' | 'USD';
  location: any;
  coordinates?: { lat: number; lng: number };
  type: 'sale' | 'rent' | 'Venda' | 'Arrendamento';
  status: 'available' | 'sold' | 'rented' | 'Disponível' | 'Vendido' | 'Arrendado' | 'Pendente' | 'Inativo';
  agentId: string;
  agent?: Agent;
  images: string[];
  createdAt: any;
  isHighlighted?: boolean;
  isPromoted?: boolean;
  isApproved?: boolean;
  views?: number;
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  features?: string[];
  detailedLocation?: string;
  requestedPackage?: string;
  videoUrl?: string;
  virtualTourUrl?: string;
  roiPercentage?: number;
  condominiumFee?: number;
  propertyTax?: number;
  impressions?: number;
  whatsappClicks?: number;
  messagesCount?: number;
  boostedUntil?: any; // Firestore Timestamp
  documentUrls?: string[]; // Para verificação de propriedades
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

export interface Favorite {
  id?: string;
  userId: string;
  propertyId: string;
}

export interface Analytics {
  id?: string;
  agentId: string;
  propertyId: string;
  views: number;
  clicks: number;
  updatedAt: Timestamp;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'message' | 'payment' | 'system';
  title: string;
  read: boolean;
  createdAt: any;
}

export interface Payment {
  id?: string;
  userId: string;
  type: 'highlight_property';
  propertyId: string;
  status: 'pending' | 'paid';
  expiresAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
}

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export type LeadSource = 'whatsapp' | 'phone' | 'contact_form' | 'viewing_request';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'archived';

export const LEAD_STATUS_VOCABULARY: readonly LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'negotiating',
  'won',
  'lost',
  'archived'
] as const;

export const ALLOWED_LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ['contacted', 'archived'],
  contacted: ['qualified', 'lost', 'archived'],
  qualified: ['negotiating', 'lost', 'archived'],
  negotiating: ['won', 'lost', 'archived'],
  lost: ['contacted', 'archived'],
  won: ['archived'],
  archived: ['new', 'contacted', 'qualified']
};

export function isValidLeadTransition(currentStatus: LeadStatus, nextStatus: LeadStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_LEAD_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  propertyOwnerId: string;
  agentId?: string;
  agencyId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message: string;
  contactPreference?: 'whatsapp' | 'phone' | 'email';
  source: LeadSource;
  status: LeadStatus;
  priority?: LeadPriority;
  score?: number;
  statusNote?: string;
  createdAt: any;
  updatedAt: any;
  lastContactAt?: any;
  qualifiedAt?: any;
  convertedAt?: any;
  lostAt?: any;
  archivedAt?: any;
  metadata?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// CRM V1: LEAD ACTIVITY / TIMELINE
// -----------------------------------------------------------------------------
export type LeadActivityType = 
  | 'lead_created'
  | 'lead_contacted'
  | 'status_changed'
  | 'note_added'
  | 'call_logged'
  | 'whatsapp_sent'
  | 'email_sent'
  | 'viewing_requested'
  | 'viewing_confirmed'
  | 'viewing_completed'
  | 'viewing_cancelled'
  | 'task_created'
  | 'task_completed'
  | 'assigned'
  | 'reassigned'
  | 'priority_changed'
  | 'converted'
  | 'lost';

export type LeadActivityActorRole = 'agent' | 'owner' | 'buyer' | 'admin' | 'system';

export interface LeadActivity {
  id?: string;
  leadId: string;
  propertyId: string;
  type: LeadActivityType;
  actorId: string;
  actorName?: string;
  actorRole: LeadActivityActorRole;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: any;
}

// -----------------------------------------------------------------------------
// CRM V1: LEAD TASKS / FOLLOW-UPS
// -----------------------------------------------------------------------------
export type LeadTaskStatus = 'pending' | 'completed' | 'cancelled';
export type LeadTaskPriority = 'low' | 'medium' | 'high';

export interface LeadTask {
  id?: string;
  leadId: string;
  propertyId: string;
  assignedTo: string;
  createdBy: string;
  title: string;
  description?: string;
  status: LeadTaskStatus;
  priority: LeadTaskPriority;
  dueAt: any;
  completedAt?: any;
  completedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export type LeadEventType = 
  | 'property_view' 
  | 'whatsapp_click' 
  | 'phone_click' 
  | 'contact_form_started' 
  | 'lead_created' 
  | 'viewing_requested'
  | 'lead_status_changed'
  | 'viewing_status_changed';

export const TELEMETRY_EVENT_TYPES: readonly LeadEventType[] = [
  'property_view',
  'whatsapp_click',
  'phone_click',
  'contact_form_started'
] as const;

export const BUSINESS_EVENT_TYPES: readonly LeadEventType[] = [
  'lead_created',
  'viewing_requested',
  'lead_status_changed',
  'viewing_status_changed'
] as const;

export function isTelemetryEvent(type: LeadEventType): boolean {
  return (TELEMETRY_EVENT_TYPES as readonly string[]).includes(type);
}

export function isBusinessEvent(type: LeadEventType): boolean {
  return (BUSINESS_EVENT_TYPES as readonly string[]).includes(type);
}

export interface LeadEvent {
  id?: string;
  propertyId: string;
  leadId?: string;
  viewingId?: string;
  eventType: LeadEventType;
  userId?: string;
  sessionId: string;
  source: string;
  metadata?: Record<string, any>;
  createdAt: any;
}

export type ViewingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';

export const VIEWING_STATUS_VOCABULARY: readonly ViewingStatus[] = [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
  'no_show'
] as const;

export const ALLOWED_VIEWING_TRANSITIONS: Record<ViewingStatus, readonly ViewingStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  rejected: ['pending'], // Permite nova solicitação / reagendamento
  cancelled: ['pending'],
  completed: [],
  no_show: ['pending', 'cancelled']
};

export function isValidViewingTransition(currentStatus: ViewingStatus, nextStatus: ViewingStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_VIEWING_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

export interface Viewing {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  leadId?: string; // FASE 2: Relação Viewing -> Lead (Opcional, com validação de integridade)
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  propertyOwnerId: string;
  agentId?: string;
  agencyId?: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate?: string;
  alternativeTime?: string;
  status: ViewingStatus;
  notes?: string;
  rejectionReason?: string;
  createdAt: any;
  updatedAt: any;
}

export type NotificationType = 
  | 'lead_received' 
  | 'lead_assigned'
  | 'viewing_requested' 
  | 'viewing_status_changed' 
  | 'lead_status_changed' 
  | 'task_due'
  | 'property_approved'
  | 'property_rejected'
  | 'saved_search_alert'
  | 'price_drop'
  | 'system' 
  | 'message'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface UserNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  category?: 'lead' | 'viewing' | 'property' | 'system' | 'chat';
  entityType?: 'lead' | 'viewing' | 'property' | 'system';
  entityId?: string;
  propertyId?: string;
  leadId?: string;
  viewingId?: string;
  taskId?: string;
  link?: string;
  read: boolean;
  priority?: 'low' | 'normal' | 'high';
  createdAt: any;
}

export type PropertyReportReason = 
  | 'inexistent' 
  | 'wrong_price' 
  | 'wrong_location' 
  | 'inappropriate' 
  | 'duplicate' 
  | 'fraud' 
  | 'other';

export type PropertyReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface PropertyReport {
  id?: string;
  propertyId: string;
  reporterId: string;
  reporterEmail?: string;
  reason: PropertyReportReason;
  description: string;
  status: PropertyReportStatus;
  createdAt: any;
}

export interface FCMToken {
  id?: string;
  userId: string;
  token: string;
  createdAt: any;
}

export const LOCATIONS = [
  'Maputo Cidade',
  'Matola',
  'Beira',
  'Nampula',
  'Pemba',
  'Inhambane',
  'Xai-Xai',
  'Tete',
  'Quelimane',
  'Lichinga',
  'Chimoio'
];

export const CATEGORIES = [
  'Apartamento',
  'Vivenda',
  'Terreno',
  'Escritório',
  'Loja',
  'Armazém'
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
