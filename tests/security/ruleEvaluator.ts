import { TestAuth, OperationType, TestCase, StorageTestCase } from './types';

/**
 * High-Fidelity Evaluator for MeuPlace Firestore Security Rules
 * Faithfully mirrors the logic in firestore.rules
 */
export class FirestoreRulesEvaluator {
  private usersDb: Map<string, Record<string, any>> = new Map();
  private chatRoomsDb: Map<string, Record<string, any>> = new Map();
  private propertiesDb: Map<string, Record<string, any>> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    this.usersDb.clear();
    this.chatRoomsDb.clear();
    this.propertiesDb.clear();

    // Standard test users
    this.usersDb.set('adminA', { uid: 'adminA', role: 'admin', email: 'admin@meuplace.com' });
    this.usersDb.set('superAdminA', { uid: 'superAdminA', role: 'admin', email: 'desartstudiopro@gmail.com' });
    this.usersDb.set('moderatorA', { uid: 'moderatorA', role: 'moderator', email: 'mod@meuplace.com' });
    this.usersDb.set('userA', { uid: 'userA', role: 'user', planId: 'free', planLimit: 5, isApproved: false });
    this.usersDb.set('userB', { uid: 'userB', role: 'user', planId: 'free', planLimit: 5, isApproved: false });
    this.usersDb.set('ownerA', { uid: 'ownerA', role: 'agent', planId: 'free', planLimit: 5, isApproved: true });
    this.usersDb.set('ownerB', { uid: 'ownerB', role: 'agent', planId: 'free', planLimit: 5, isApproved: true });
    this.usersDb.set('agentA', { uid: 'agentA', role: 'agent', planId: 'pro', planLimit: 20, isApproved: true });
    this.usersDb.set('agentB', { uid: 'agentB', role: 'agent', planId: 'free', planLimit: 5, isApproved: true });
    this.usersDb.set('agencyAdminA', { uid: 'agencyAdminA', role: 'agent', planId: 'unlimited', planLimit: 999999, isApproved: true });

    // Seed chat rooms
    this.chatRoomsDb.set('chatA', {
      id: 'chatA',
      userId: 'userA',
      agentId: 'ownerA',
      participants: ['userA', 'ownerA']
    });

    this.chatRoomsDb.set('chatB', {
      id: 'chatB',
      userId: 'userB',
      agentId: 'ownerB',
      participants: ['userB', 'ownerB']
    });

    // Seed properties
    this.propertiesDb.set('propertyA', {
      id: 'propertyA',
      agentId: 'ownerA',
      ownerId: 'ownerA',
      title: 'Casa Maputo A',
      isApproved: true,
      isPromoted: false,
      status: 'Disponível',
      views: 10,
      impressions: 25,
      whatsappClicks: 2
    });

    this.propertiesDb.set('propertyB', {
      id: 'propertyB',
      agentId: 'ownerB',
      ownerId: 'ownerB',
      title: 'Apartamento Matola B',
      isApproved: true,
      isPromoted: false,
      status: 'Disponível',
      views: 5,
      impressions: 12,
      whatsappClicks: 1
    });

    this.propertiesDb.set('propertyPending', {
      id: 'propertyPending',
      agentId: 'ownerA',
      ownerId: 'ownerA',
      title: 'Imóvel em Análise',
      isApproved: false,
      isPromoted: false,
      status: 'Pendente',
      views: 0,
      impressions: 0,
      whatsappClicks: 0
    });
  }

  private isAuthenticated(auth: TestAuth | null | undefined): boolean {
    return !!auth && !!auth.uid;
  }

  private isOwner(auth: TestAuth | null | undefined, userId: string): boolean {
    return this.isAuthenticated(auth) && auth?.uid === userId;
  }

  private isAdmin(auth: TestAuth | null | undefined): boolean {
    if (!this.isAuthenticated(auth) || !auth) return false;
    if (auth.token?.role === 'admin' || auth.role === 'admin') return true;
    if (auth.email_verified === true && 
       (auth.email === 'desartstudiopro@gmail.com' || auth.email === 'ruiisacmugabe@gmail.com')) {
      return true;
    }
    const userDoc = this.usersDb.get(auth.uid);
    return userDoc?.role === 'admin';
  }

  private isModerator(auth: TestAuth | null | undefined): boolean {
    if (!this.isAuthenticated(auth) || !auth) return false;
    if (auth.token?.role === 'moderator' || auth.role === 'moderator') return true;
    const userDoc = this.usersDb.get(auth.uid);
    return userDoc?.role === 'moderator';
  }

  public evaluate(test: TestCase): 'ALLOWED' | 'DENIED' {
    const { auth, target, operation, existingData, incomingData } = test;
    const segments = target.split('/').filter(Boolean);
    const collection = segments[0];
    const docId = segments[1];
    const subCollection = segments[2];
    const subDocId = segments[3];

    // Default Deny Rule at root: match /{document=**} { allow read, write: if isAdmin(); }
    
    // 1. Settings Collection
    if (collection === 'settings') {
      if (operation === 'read') return 'ALLOWED'; // Public read
      if (['create', 'update', 'delete'].includes(operation)) {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 2. Properties Collection
    if (collection === 'properties') {
      const currentDoc = existingData || this.propertiesDb.get(docId) || null;

      if (operation === 'read') {
        if (currentDoc?.isApproved === true) return 'ALLOWED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (this.isModerator(auth)) return 'ALLOWED';
        if (this.isAuthenticated(auth) && currentDoc?.agentId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }

      if (operation === 'create') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!incomingData) return 'DENIED';
        if (incomingData.agentId !== auth!.uid) return 'DENIED';

        if (this.isAdmin(auth)) return 'ALLOWED';

        // Creation constraints for non-admins
        const isApprovedCheck = incomingData.isApproved === false;
        const isPromotedCheck = incomingData.isPromoted === false;
        const statusCheck = incomingData.status === 'Pendente' || incomingData.status === 'pending';

        // Check for creation-time metric/boost/verification tampering
        const hasForgedVerification = incomingData.verificationStatus && incomingData.verificationStatus !== 'none' && incomingData.verificationStatus !== 'pending';
        const hasForgedMetrics = (incomingData.views && incomingData.views > 0) || 
                                 (incomingData.impressions && incomingData.impressions > 0) || 
                                 (incomingData.whatsappClicks && incomingData.whatsappClicks > 0);
        const hasForgedBoost = !!incomingData.boostedUntil;

        if (hasForgedVerification || hasForgedMetrics || hasForgedBoost) {
          return 'DENIED';
        }

        if (isApprovedCheck && isPromotedCheck && statusCheck) {
          return 'ALLOWED';
        }
        return 'DENIED';
      }

      if (operation === 'update') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (this.isModerator(auth)) {
          // Moderator can update approval status, but NOT payments or financial fields
          if (incomingData && !incomingData.amount && !incomingData.price) {
            return 'ALLOWED';
          }
          return 'DENIED';
        }
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!currentDoc) return 'DENIED';

        // Must be the owner agent
        if (currentDoc.agentId !== auth!.uid) return 'DENIED';
        if (incomingData?.agentId && incomingData.agentId !== auth!.uid) return 'DENIED';

        // Check protected fields on update
        if (incomingData && currentDoc) {
          const protectedKeys = [
            'isApproved', 'isPromoted', 'boostedUntil', 'verificationStatus',
            'agentId', 'views', 'impressions', 'whatsappClicks',
            'ownerId', 'createdBy', 'userId', 'agencyId'
          ];
          for (const key of protectedKeys) {
            if (key in incomingData && incomingData[key] !== currentDoc[key]) {
              return 'DENIED'; // Mutation of protected field attempted
            }
          }
        }
        return 'ALLOWED';
      }

      if (operation === 'delete') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (this.isAuthenticated(auth) && currentDoc?.agentId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 3. Users Collection
    if (collection === 'users') {
      const currentDoc = existingData || this.usersDb.get(docId) || null;

      if (subCollection === 'files') {
        if (this.isOwner(auth, docId) || this.isAdmin(auth)) return 'ALLOWED';
        return 'DENIED';
      }

      if (operation === 'read') {
        return 'ALLOWED'; // Public profiles
      }

      if (operation === 'create') {
        if (!this.isOwner(auth, docId)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';

        if (!incomingData) return 'DENIED';
        const role = incomingData.role;
        const isAllowedRole = ['user', 'agent', 'resort'].includes(role) && role !== 'admin';
        const isFreePlan = incomingData.planId === 'free' && incomingData.planLimit <= 5;
        const approvalCheck = role === 'user' || incomingData.isApproved === false;
        const uidMatches = incomingData.uid === docId;

        // Privilege escalation checks on creation
        const hasTamperedFields = incomingData.isAdmin === true || 
                                  incomingData.isModerator === true || 
                                  incomingData.kycStatus === 'approved' ||
                                  incomingData.verificationStatus === 'verified' ||
                                  !!incomingData.permissions;

        if (hasTamperedFields) return 'DENIED';

        if (isAllowedRole && isFreePlan && approvalCheck && uidMatches) {
          return 'ALLOWED';
        }
        return 'DENIED';
      }

      if (operation === 'update') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!this.isOwner(auth, docId)) return 'DENIED';
        if (!currentDoc || !incomingData) return 'DENIED';

        // Prohibited fields list (strict)
        const forbiddenKeys = [
          'role', 'isAdmin', 'isModerator', 'isApproved', 'planId', 'planLimit', 
          'planExpiration', 'kycStatus', 'verificationStatus', 'permissions', 
          'agencyRole', 'isPromoted', 'boostedUntil', 'isResponsible', 'rating', 
          'reviews', 'uid', 'email'
        ];

        for (const key of forbiddenKeys) {
          if (key in incomingData && incomingData[key] !== currentDoc[key]) {
            return 'DENIED'; // Privilege escalation or tampering blocked
          }
        }
        return 'ALLOWED';
      }

      if (operation === 'delete') {
        if (this.isAdmin(auth) || this.isOwner(auth, docId)) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 4. Chat Rooms & Messages
    if (collection === 'chatRooms') {
      const currentDoc = existingData || this.chatRoomsDb.get(docId) || null;

      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (currentDoc?.agentId === auth!.uid || currentDoc?.userId === auth!.uid) return 'ALLOWED';
        if (Array.isArray(currentDoc?.participants) && currentDoc.participants.includes(auth!.uid)) return 'ALLOWED';
        return 'DENIED';
      }

      if (operation === 'create') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!incomingData) return 'DENIED';
        const isUser = incomingData.userId === auth!.uid;
        const isAgent = incomingData.agentId === auth!.uid;
        const isParticipant = Array.isArray(incomingData.participants) && incomingData.participants.includes(auth!.uid);
        if (isUser || isAgent || isParticipant) return 'ALLOWED';
        return 'DENIED';
      }

      if (operation === 'update') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!currentDoc) return 'DENIED';

        // Must be a room participant
        const isParticipant = currentDoc.agentId === auth!.uid || 
                              currentDoc.userId === auth!.uid || 
                              (Array.isArray(currentDoc.participants) && currentDoc.participants.includes(auth!.uid));
        if (!isParticipant) return 'DENIED';

        // Cannot tamper with participants, userId or agentId
        if (incomingData) {
          if ('userId' in incomingData && incomingData.userId !== currentDoc.userId) return 'DENIED';
          if ('agentId' in incomingData && incomingData.agentId !== currentDoc.agentId) return 'DENIED';
          if ('participants' in incomingData) {
            // Cannot remove legitimate parties or inject arbitrary users
            const p = incomingData.participants;
            if (!Array.isArray(p) || !p.includes(currentDoc.userId) || !p.includes(currentDoc.agentId)) {
              return 'DENIED';
            }
          }
        }
        return 'ALLOWED';
      }

      if (operation === 'delete') {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // Chat Messages Subcollection (/chats/{roomId}/messages/{messageId})
    if (collection === 'chats' && subCollection === 'messages') {
      const room = this.chatRoomsDb.get(docId);

      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!room) return 'DENIED';
        const inRoom = room.userId === auth!.uid || 
                       room.agentId === auth!.uid || 
                       (Array.isArray(room.participants) && room.participants.includes(auth!.uid));
        return inRoom ? 'ALLOWED' : 'DENIED';
      }

      if (operation === 'create') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!incomingData) return 'DENIED';
        // SenderId spoofing prevention
        if (incomingData.senderId !== auth!.uid) return 'DENIED';
        if (typeof incomingData.text !== 'string' || incomingData.text.length > 5000) return 'DENIED';

        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!room) return 'DENIED';
        const inRoom = room.userId === auth!.uid || 
                       room.agentId === auth!.uid || 
                       (Array.isArray(room.participants) && room.participants.includes(auth!.uid));
        return inRoom ? 'ALLOWED' : 'DENIED';
      }

      if (['update', 'delete'].includes(operation)) {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 5. Orders & Payments Collection
    if (collection === 'orders' || collection === 'payments') {
      const currentDoc = existingData || null;

      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (currentDoc?.userId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }

      if (operation === 'create') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!incomingData) return 'DENIED';
        // User can only create order for themselves with status = 'pending'
        if (incomingData.userId === auth!.uid && incomingData.status === 'pending') {
          return 'ALLOWED';
        }
        return 'DENIED';
      }

      if (['update', 'delete'].includes(operation)) {
        // Users cannot update payment status or amount directly!
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 6. Agent Reviews
    if (collection === 'agent_reviews') {
      const currentDoc = existingData || null;

      if (operation === 'read') return 'ALLOWED';
      if (operation === 'create') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (!incomingData) return 'DENIED';
        // authorId spoofing prevention
        if (incomingData.userId !== auth!.uid) return 'DENIED';
        // rating range validation (1..5)
        if (typeof incomingData.rating !== 'number' || incomingData.rating < 1 || incomingData.rating > 5) {
          return 'DENIED';
        }
        return 'ALLOWED';
      }
      if (['update', 'delete'].includes(operation)) {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (this.isAuthenticated(auth) && currentDoc?.userId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 7. Mail Collection (Strict Admin/Cloud Functions only)
    if (collection === 'mail') {
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // 8. Notifications Collection
    if (collection === 'user_notifications') {
      const currentDoc = existingData || null;
      if (['read', 'update', 'delete'].includes(operation)) {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (currentDoc?.userId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }
      if (operation === 'create') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        // User cannot forge system notification for other users
        if (this.isAuthenticated(auth) && incomingData?.userId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 9. Premium Agencies
    if (collection === 'premium_agencies') {
      const currentDoc = existingData || null;
      if (operation === 'read') return 'ALLOWED';
      if (operation === 'create') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!this.isAuthenticated(auth)) return 'DENIED';
        const userDoc = this.usersDb.get(auth!.uid);
        if (incomingData?.agentId === auth!.uid && userDoc?.planId === 'unlimited') {
          return 'ALLOWED';
        }
        return 'DENIED';
      }
      if (['update', 'delete'].includes(operation)) {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (this.isAuthenticated(auth) && currentDoc?.agentId === auth!.uid) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 10. Audit Logs
    if (collection === 'audit_logs') {
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // 11. Leads Collection (Phase 4)
    if (collection === 'leads') {
      const currentDoc = existingData || null;

      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (currentDoc) {
          if (currentDoc.propertyOwnerId === auth!.uid) return 'ALLOWED';
          if (currentDoc.agentId === auth!.uid) return 'ALLOWED';
          if (currentDoc.customerId === auth!.uid) return 'ALLOWED';
        }
        return 'DENIED';
      }

      if (operation === 'create') {
        if (!incomingData) return 'DENIED';
        // Required fields
        if (typeof incomingData.propertyId !== 'string' || !incomingData.propertyId) return 'DENIED';
        if (typeof incomingData.propertyOwnerId !== 'string' || !incomingData.propertyOwnerId) return 'DENIED';
        if (typeof incomingData.customerName !== 'string' || !incomingData.customerName) return 'DENIED';
        if (typeof incomingData.customerPhone !== 'string' || !incomingData.customerPhone) return 'DENIED';
        if (typeof incomingData.message !== 'string' || incomingData.message.length > 2000) return 'DENIED';
        // Status must be strictly 'new'
        if (incomingData.status !== 'new') return 'DENIED';
        // Customer ID spoofing prevention
        if (incomingData.customerId && this.isAuthenticated(auth) && incomingData.customerId !== auth!.uid) {
          return 'DENIED';
        }
        return 'ALLOWED';
      }

      if (operation === 'update') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!this.isAuthenticated(auth) || !currentDoc || !incomingData) return 'DENIED';

        const isOwnerOrAgent = currentDoc.propertyOwnerId === auth!.uid || currentDoc.agentId === auth!.uid;
        const isCustomer = currentDoc.customerId === auth!.uid;

        if (isOwnerOrAgent) {
          // Cannot mutate ownership keys
          const protectedKeys = ['propertyId', 'propertyOwnerId', 'agentId', 'agencyId', 'customerId', 'createdAt'];
          for (const key of protectedKeys) {
            if (key in incomingData && incomingData[key] !== currentDoc[key]) {
              return 'DENIED';
            }
          }
          return 'ALLOWED';
        }

        if (isCustomer) {
          // Customer can only update message or timestamps for deduplication
          const allowedCustomerKeys = ['message', 'lastContactAt', 'updatedAt'];
          for (const key of Object.keys(incomingData)) {
            if (!allowedCustomerKeys.includes(key) && incomingData[key] !== currentDoc[key]) {
              return 'DENIED';
            }
          }
          return 'ALLOWED';
        }

        return 'DENIED';
      }

      if (operation === 'delete') {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 12. Lead Events (Phase 4)
    if (collection === 'lead_events') {
      if (operation === 'read') return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      if (operation === 'create') {
        if (!incomingData) return 'DENIED';
        if (typeof incomingData.propertyId !== 'string' || !incomingData.propertyId) return 'DENIED';
        if (typeof incomingData.sessionId !== 'string' || !incomingData.sessionId) return 'DENIED';
        const validTypes = ['property_view', 'whatsapp_click', 'phone_click', 'contact_form_started', 'lead_created', 'viewing_requested'];
        if (!validTypes.includes(incomingData.eventType)) return 'DENIED';
        if (incomingData.userId && this.isAuthenticated(auth) && incomingData.userId !== auth!.uid) {
          return 'DENIED';
        }
        return 'ALLOWED';
      }
      if (['update', 'delete'].includes(operation)) {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 13. Viewings (Phase 4)
    if (collection === 'viewings') {
      const currentDoc = existingData || null;

      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (currentDoc) {
          if (currentDoc.requesterId === auth!.uid) return 'ALLOWED';
          if (currentDoc.propertyOwnerId === auth!.uid) return 'ALLOWED';
          if (currentDoc.agentId === auth!.uid) return 'ALLOWED';
        }
        return 'DENIED';
      }

      if (operation === 'create') {
        if (!incomingData) return 'DENIED';
        if (typeof incomingData.propertyId !== 'string') return 'DENIED';
        if (typeof incomingData.propertyOwnerId !== 'string') return 'DENIED';
        if (typeof incomingData.requesterName !== 'string') return 'DENIED';
        if (typeof incomingData.requesterPhone !== 'string') return 'DENIED';
        if (typeof incomingData.preferredDate !== 'string') return 'DENIED';
        if (typeof incomingData.preferredTime !== 'string') return 'DENIED';
        // Status must start strictly as 'pending'
        if (incomingData.status !== 'pending') return 'DENIED';
        // Requester verification
        if (incomingData.requesterId && this.isAuthenticated(auth)) {
          if (incomingData.requesterId !== auth!.uid && !incomingData.requesterId.startsWith('guest_')) {
            return 'DENIED';
          }
        }
        return 'ALLOWED';
      }

      if (operation === 'update') {
        if (this.isAdmin(auth)) return 'ALLOWED';
        if (!this.isAuthenticated(auth) || !currentDoc || !incomingData) return 'DENIED';

        const isOwnerOrAgent = currentDoc.propertyOwnerId === auth!.uid || currentDoc.agentId === auth!.uid;
        const isRequester = currentDoc.requesterId === auth!.uid;

        if (isOwnerOrAgent) {
          const protectedKeys = ['propertyId', 'propertyOwnerId', 'agentId', 'agencyId', 'requesterId', 'createdAt'];
          for (const key of protectedKeys) {
            if (key in incomingData && incomingData[key] !== currentDoc[key]) {
              return 'DENIED';
            }
          }
          const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show'];
          if (incomingData.status && !validStatuses.includes(incomingData.status)) return 'DENIED';
          return 'ALLOWED';
        }

        if (isRequester) {
          // Requester can only cancel their own viewing
          if (incomingData.status !== 'cancelled') return 'DENIED';
          const allowedRequesterKeys = ['status', 'updatedAt', 'notes'];
          for (const key of Object.keys(incomingData)) {
            if (!allowedRequesterKeys.includes(key) && incomingData[key] !== currentDoc[key]) {
              return 'DENIED';
            }
          }
          return 'ALLOWED';
        }

        return 'DENIED';
      }

      if (operation === 'delete') {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 14. Property Reports (Phase 4)
    if (collection === 'property_reports') {
      if (operation === 'read') {
        return (this.isAdmin(auth) || this.isModerator(auth)) ? 'ALLOWED' : 'DENIED';
      }
      if (operation === 'create') {
        if (!incomingData) return 'DENIED';
        if (typeof incomingData.propertyId !== 'string') return 'DENIED';
        const validReasons = ['inexistent', 'wrong_price', 'wrong_location', 'inappropriate', 'duplicate', 'fraud', 'other'];
        if (!validReasons.includes(incomingData.reason)) return 'DENIED';
        if (typeof incomingData.description !== 'string' || incomingData.description.length > 2000) return 'DENIED';
        if (incomingData.status !== 'open') return 'DENIED'; // Must start as open
        return 'ALLOWED';
      }
      if (['update', 'delete'].includes(operation)) {
        return (this.isAdmin(auth) || this.isModerator(auth)) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 15. Resorts & Resort Reviews
    if (collection === 'resorts') {
      if (!subCollection) {
        if (operation === 'read') return 'ALLOWED'; // Public
        if (['create', 'update', 'delete'].includes(operation)) {
          return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
        }
      } else if (subCollection === 'reviews') {
        if (operation === 'read') return 'ALLOWED'; // Public
        if (operation === 'create') {
          if (!this.isAuthenticated(auth) || !incomingData) return 'DENIED';
          return incomingData.userId === auth!.uid ? 'ALLOWED' : 'DENIED';
        }
        if (['update', 'delete'].includes(operation)) {
          if (this.isAdmin(auth)) return 'ALLOWED';
          return (this.isAuthenticated(auth) && existingData?.userId === auth!.uid) ? 'ALLOWED' : 'DENIED';
        }
      }
    }

    // 16. Plans & Subscription Plans
    if (collection === 'plans' || collection === 'subscription_plans') {
      if (operation === 'read') return 'ALLOWED'; // Public
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // 17. Featured Agents
    if (collection === 'featured_agents') {
      if (operation === 'read') return 'ALLOWED'; // Public
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // 18. Feedbacks
    if (collection === 'feedbacks') {
      if (operation === 'create') return 'ALLOWED'; // Anyone can submit feedback
      if (operation === 'read') return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // 19. Payments
    if (collection === 'payments') {
      const currentDoc = existingData || null;
      if (operation === 'read') {
        if (!this.isAuthenticated(auth)) return 'DENIED';
        if (this.isAdmin(auth)) return 'ALLOWED';
        return currentDoc?.userId === auth!.uid ? 'ALLOWED' : 'DENIED';
      }
      if (operation === 'create') {
        if (!this.isAuthenticated(auth) || !incomingData) return 'DENIED';
        if (incomingData.userId !== auth!.uid) return 'DENIED';
        if (incomingData.status !== 'pending') return 'DENIED'; // Cannot self-approve payment
        return 'ALLOWED';
      }
      if (['update', 'delete'].includes(operation)) {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 20. System Stats
    if (collection === 'system_stats') {
      if (operation === 'read') return 'ALLOWED'; // Public read
      return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
    }

    // Default Fallback (match /{document=**} { allow read, write: if isAdmin(); })
    return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
  }
}

/**
 * High-Fidelity Evaluator for Storage Rules
 */
export class StorageRulesEvaluator {
  private isAdmin(auth: TestAuth | null | undefined): boolean {
    if (!auth || !auth.uid) return false;
    if (auth.token?.role === 'admin' || auth.role === 'admin') return true;
    if (auth.email_verified === true && 
       (auth.email === 'desartstudiopro@gmail.com' || auth.email === 'ruiisacmugabe@gmail.com')) {
      return true;
    }
    return false;
  }

  public evaluate(test: StorageTestCase): 'ALLOWED' | 'DENIED' {
    const { auth, path, operation, contentType, sizeBytes } = test;
    const segments = path.split('/').filter(Boolean);
    const rootFolder = segments[0];
    const userOrFileName = segments[1];
    const subFolder = segments[2];

    const isAuth = !!auth && !!auth.uid;
    const isImage = contentType?.startsWith('image/') || false;
    const isPDF = contentType === 'application/pdf';
    const isUnder10MB = sizeBytes !== undefined ? sizeBytes <= 10 * 1024 * 1024 : true;

    // Check for malicious path traversal
    if (path.includes('..') || path.includes('//') || path.includes('%2e%2e')) {
      return 'DENIED';
    }

    // 1. Partitioned properties (/properties/{userId}/...)
    if (rootFolder === 'properties') {
      if (segments.length >= 3) {
        // Partitioned: /properties/{userId}/{fileName}
        const targetUserId = userOrFileName;
        if (operation === 'read') return 'ALLOWED';
        if (['write'].includes(operation)) {
          if (!isAuth) return 'DENIED';
          if (!isImage) return 'DENIED';
          if (!isUnder10MB) return 'DENIED';
          if (auth!.uid === targetUserId || this.isAdmin(auth)) return 'ALLOWED';
          return 'DENIED';
        }
        if (operation === 'delete') {
          if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) return 'ALLOWED';
          return 'DENIED';
        }
      } else {
        // Legacy root: /properties/{fileName}
        if (operation === 'read') return 'ALLOWED';
        if (operation === 'write') {
          // If unpartitioned, writing is restricted to admin
          return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
        }
        if (operation === 'delete') {
          return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
        }
      }
    }

    // 2. KYC Documents (/kyc_documents/{userId}/{fileName})
    if (rootFolder === 'kyc_documents' || rootFolder === 'documents') {
      const targetUserId = userOrFileName;
      if (operation === 'read') {
        if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) return 'ALLOWED';
        return 'DENIED';
      }
      if (operation === 'write') {
        if (!isAuth) return 'DENIED';
        if (auth!.uid !== targetUserId) return 'DENIED';
        if (!isUnder10MB) return 'DENIED';
        if (!isImage && !isPDF) return 'DENIED';
        return 'ALLOWED';
      }
      if (operation === 'delete') {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 3. Property Documents (/property_documents/{userId}/{fileName})
    if (rootFolder === 'property_documents') {
      const targetUserId = userOrFileName;
      if (operation === 'read') {
        if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) return 'ALLOWED';
        return 'DENIED';
      }
      if (operation === 'write') {
        if (!isAuth) return 'DENIED';
        if (auth!.uid !== targetUserId && !this.isAdmin(auth)) return 'DENIED';
        if (!isUnder10MB) return 'DENIED';
        return 'ALLOWED';
      }
      if (operation === 'delete') {
        return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
      }
    }

    // 4. Avatars (/avatars/{userId}/{fileName} and /users/{userId}/{fileName})
    if (rootFolder === 'avatars' || rootFolder === 'users') {
      const targetUserId = userOrFileName;
      if (operation === 'read') return 'ALLOWED';
      if (operation === 'write') {
        if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth)) && isImage && isUnder10MB) return 'ALLOWED';
        return 'DENIED';
      }
      if (operation === 'delete') {
        if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) return 'ALLOWED';
        return 'DENIED';
      }
    }

    // 5. Agency Logos (/agency_logos/{fileName} or /agency_logos/{userId}/{fileName})
    if (rootFolder === 'agency_logos') {
      if (segments.length >= 3) {
        const targetUserId = userOrFileName;
        if (operation === 'read') return 'ALLOWED';
        if (operation === 'write') {
          if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth)) && isImage && isUnder10MB) return 'ALLOWED';
          return 'DENIED';
        }
        if (operation === 'delete') {
          return (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) ? 'ALLOWED' : 'DENIED';
        }
      } else {
        if (operation === 'read') return 'ALLOWED';
        if (operation === 'write' || operation === 'delete') {
          return this.isAdmin(auth) ? 'ALLOWED' : 'DENIED';
        }
      }
    }

    // 6. Agent Avatars (/agent_avatars/{fileName})
    if (rootFolder === 'agent_avatars') {
      if (operation === 'read') return 'ALLOWED';
      if (operation === 'write') {
        return (this.isAdmin(auth) && isImage && isUnder10MB) ? 'ALLOWED' : 'DENIED';
      }
      return 'DENIED';
    }

    // 7. Settings (/settings/{fileName})
    if (rootFolder === 'settings') {
      if (operation === 'read') return 'ALLOWED';
      if (operation === 'write') {
        return (this.isAdmin(auth) && isImage && isUnder10MB) ? 'ALLOWED' : 'DENIED';
      }
      return 'DENIED';
    }

    // 8. User Uploads (/user_uploads/{userId}/{fileName})
    if (rootFolder === 'user_uploads') {
      const targetUserId = userOrFileName;
      if (operation === 'read') {
        return (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) ? 'ALLOWED' : 'DENIED';
      }
      if (operation === 'write') {
        if (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth)) && isUnder10MB) return 'ALLOWED';
        return 'DENIED';
      }
      if (operation === 'delete') {
        return (isAuth && (auth!.uid === targetUserId || this.isAdmin(auth))) ? 'ALLOWED' : 'DENIED';
      }
    }

    // Default Deny (match /{allPaths=**} { allow read, write: if false; })
    return 'DENIED';
  }
}
