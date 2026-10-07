import { Timestamp } from 'firebase/firestore';
import { Property, PropertyReport } from './index';

// ===============================================================
// 6.1 Listing Freshness Types
// ===============================================================

export type AvailabilityStatus = 
  | 'available' 
  | 'reserved' 
  | 'sold' 
  | 'rented' 
  | 'unavailable' 
  | 'expired' 
  | 'pending_confirmation';

export type AvailabilityConfirmationMethod = 
  | 'manual_confirmation' 
  | 'whatsapp_verified' 
  | 'agent_inspection' 
  | 'commercial_activity' 
  | 'system_check';

export type FreshnessState = 
  | 'fresh'              // Confirmado recentemente (< 15 dias)
  | 'expiring_soon'      // A expirar brevemente (15 a 30 dias)
  | 'stale_pending'      // Pendente de confirmação (> 30 dias)
  | 'expired';           // Expirado (> 37 dias sem confirmação)

export interface PropertyFreshnessInfo {
  availabilityStatus: AvailabilityStatus;
  freshnessState: FreshnessState;
  daysSinceConfirmation: number;
  daysUntilExpiration: number;
  lastConfirmedAt: string | null;
  nextCheckAt: string | null;
  expirationAt: string | null;
  confirmedBy: string | null;
  confirmationMethod: AvailabilityConfirmationMethod | null;
  needsConfirmation: boolean;
  isAvailable: boolean;
  badgeLabel: string;
  badgeVariant: 'emerald' | 'amber' | 'rose' | 'slate';
  reason: string;
}

// ===============================================================
// 6.2 Property Quality Score Types
// ===============================================================

export type QualityTier = 'excellent' | 'good' | 'fair' | 'poor';

export interface QualityScoreFactorItem {
  id: string;
  name: string;
  category: 'media' | 'description' | 'specs' | 'location' | 'features' | 'finance';
  points: number;
  maxPoints: number;
  achieved: boolean;
  description: string;
}

export interface PropertyQualityScoreResult {
  score: number; // 0 a 100 garantido
  tier: QualityTier;
  label: string;
  breakdown: QualityScoreFactorItem[];
  penaltyItems: { name: string; penalty: number; description: string }[];
  suggestions: string[];
  completenessPercentage: number;
}

// ===============================================================
// 6.3 Duplicate Listing Detection Types
// ===============================================================

export type DuplicateMatchFactor = 
  | 'exact_coordinates'
  | 'nearby_coordinates'
  | 'same_neighborhood'
  | 'same_category'
  | 'matching_specs'
  | 'matching_price'
  | 'text_similarity'
  | 'image_similarity';

export interface DuplicateSimilarityResult {
  similarityScore: number; // 0 a 100%
  matchingFactors: {
    factor: DuplicateMatchFactor;
    weight: number;
    description: string;
  }[];
  isCandidate: boolean; // true se similarityScore >= 65
}

export type DuplicateCandidateStatus = 
  | 'pending_review' 
  | 'confirmed_duplicate' 
  | 'false_positive' 
  | 'merged'
  | 'dismissed';

export interface DuplicateCandidate {
  id: string;
  primaryPropertyId: string;
  primaryPropertyTitle: string;
  primaryPropertyAgentId: string;
  primaryPropertyPrice: number;
  primaryPropertyLocation: string;
  
  comparedPropertyId: string;
  comparedPropertyTitle: string;
  comparedPropertyAgentId: string;
  comparedPropertyPrice: number;
  comparedPropertyLocation: string;

  similarityScore: number;
  matchingFactors: string[];
  status: DuplicateCandidateStatus;
  detectedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

// ===============================================================
// 6.4 Verification Center Types
// ===============================================================

export type VerificationType = 
  | 'agent_identity'        // Documento de identificação (BI, DIRE, Passaporte)
  | 'agent_license'         // Registo Comercial / Carteira profissional
  | 'agent_phone'           // Contacto telefónico / WhatsApp validado
  | 'property_document'     // Certidão Predial / DUAT / Escritura
  | 'in_person_inspection'; // Vistoria presencial por equipa MeuPlace

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationRecord {
  id: string;
  entityType: 'property' | 'agent' | 'user';
  entityId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  documentUrls?: string[];
  evidenceNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  expirationDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ===============================================================
// 6.5 Marketplace Moderation Queue Types
// ===============================================================

export type ModerationTriggerReason = 
  | 'new_listing' 
  | 'price_anomaly' 
  | 'user_report' 
  | 'duplicate_suspect' 
  | 'low_quality_score' 
  | 'content_edit';

export type ModerationPriority = 'urgent' | 'high' | 'normal' | 'low';

export type ModerationStatus = 
  | 'pending' 
  | 'in_review' 
  | 'approved' 
  | 'rejected' 
  | 'changes_requested';

export interface ModerationQueueItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  agentId: string;
  agentName?: string;
  price: number;
  location: string;
  reason: ModerationTriggerReason;
  priority: ModerationPriority;
  status: ModerationStatus;
  qualityScore?: number;
  reportCount?: number;
  duplicateScore?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  decisionNotes?: string;
}

// ===============================================================
// 6.6 Property Health Types
// ===============================================================

export type PropertyHealthStatus = 'optimal' | 'healthy' | 'attention' | 'critical';

export interface PropertyHealthIssue {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  actionRequired: string;
}

export interface PropertyHealthInfo {
  healthScore: number; // 0 a 100
  healthStatus: PropertyHealthStatus;
  badgeLabel: string;
  badgeVariant: 'emerald' | 'blue' | 'amber' | 'rose';
  issues: PropertyHealthIssue[];
  recommendations: string[];
  lastAssessedAt: string;
}

// ===============================================================
// 6.7 Marketplace Health Metrics Types
// ===============================================================

export interface MarketplaceHealthMetrics {
  totalListings: number;
  approvedListings: number;
  pendingModerationCount: number;
  rejectedCount: number;

  freshness: {
    freshCount: number;
    freshPercentage: number;
    expiringSoonCount: number;
    pendingConfirmationCount: number;
    expiredCount: number;
  };

  quality: {
    averageQualityScore: number;
    excellentCount: number;
    goodCount: number;
    fairCount: number;
    poorCount: number;
  };

  verifications: {
    verifiedPropertiesCount: number;
    verificationRate: number; // 0 a 100%
  };

  duplicates: {
    openCandidatesCount: number;
    confirmedDuplicatesCount: number;
  };

  moderationQueue: {
    totalOpenItems: number;
    urgentItemsCount: number;
  };

  marketplaceTrustIndex: number; // 0 a 100 índice determinístico
  trustTier: 'excellent' | 'strong' | 'moderate' | 'needs_attention';
  calculatedAt: string;
}
