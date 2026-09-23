import { TestCase, StorageTestCase, TestAuth } from './types';

// Identidades fictícias de teste (Zero dados reais)
export const identities: Record<string, TestAuth> = {
  anonymous: { uid: '' },
  userA: { uid: 'userA', email: 'userA@test.local', role: 'user' },
  userB: { uid: 'userB', email: 'userB@test.local', role: 'user' },
  ownerA: { uid: 'ownerA', email: 'ownerA@test.local', role: 'agent' },
  ownerB: { uid: 'ownerB', email: 'ownerB@test.local', role: 'agent' },
  agentA: { uid: 'agentA', email: 'agentA@test.local', role: 'agent' },
  agentB: { uid: 'agentB', email: 'agentB@test.local', role: 'agent' },
  agencyAdminA: { uid: 'agencyAdminA', email: 'agencyAdminA@test.local', role: 'agent' },
  moderatorA: { uid: 'moderatorA', email: 'moderatorA@test.local', role: 'moderator' },
  adminA: { uid: 'adminA', email: 'adminA@test.local', role: 'admin' },
  admin: { uid: 'adminA', email: 'adminA@test.local', role: 'admin' },
  superAdminA: { uid: 'superAdminA', email: 'desartstudiopro@gmail.com', email_verified: true, role: 'admin' }
};

export const firestorePenetrationTests: TestCase[] = [
  // =========================================================================
  // 1. PRIVILEGE ESCALATION TESTS (AUTH-001 to AUTH-015)
  // =========================================================================
  {
    id: 'AUTH-001',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', planId: 'free', planLimit: 5 },
    incomingData: { uid: 'userA', role: 'admin' },
    expectedResult: 'DENIED',
    description: 'USER tenta alterar role para admin'
  },
  {
    id: 'AUTH-002',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', isAdmin: false },
    incomingData: { uid: 'userA', isAdmin: true },
    expectedResult: 'DENIED',
    description: 'USER tenta adicionar flag isAdmin: true'
  },
  {
    id: 'AUTH-003',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', isModerator: false },
    incomingData: { uid: 'userA', isModerator: true },
    expectedResult: 'DENIED',
    description: 'USER tenta adicionar flag isModerator: true'
  },
  {
    id: 'AUTH-004',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', isApproved: false },
    incomingData: { uid: 'userA', isApproved: true },
    expectedResult: 'DENIED',
    description: 'USER tenta auto-aprovar perfil (isApproved: true)'
  },
  {
    id: 'AUTH-005',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', kycStatus: 'none' },
    incomingData: { uid: 'userA', kycStatus: 'approved' },
    expectedResult: 'DENIED',
    description: 'USER tenta aprovar KYC por conta própria'
  },
  {
    id: 'AUTH-006',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', planId: 'free', planLimit: 5 },
    incomingData: { uid: 'userA', planId: 'unlimited', planLimit: 999999 },
    expectedResult: 'DENIED',
    description: 'USER tenta auto-atribuir plano unlimited sem pagamento'
  },
  {
    id: 'AUTH-007',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', planExpiration: '2026-09-30' },
    incomingData: { uid: 'userA', planExpiration: '2099-12-31' },
    expectedResult: 'DENIED',
    description: 'USER tenta estender planExpiration arbitrariamente'
  },
  {
    id: 'AUTH-008',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', verificationStatus: 'none' },
    incomingData: { uid: 'userA', verificationStatus: 'verified' },
    expectedResult: 'DENIED',
    description: 'USER tenta auto-definir verificationStatus: verified'
  },
  {
    id: 'AUTH-009',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', permissions: [] },
    incomingData: { uid: 'userA', permissions: ['all', 'admin'] },
    expectedResult: 'DENIED',
    description: 'USER tenta injetar array de permissões administrativas'
  },
  {
    id: 'AUTH-010',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', agencyRole: 'agent' },
    incomingData: { uid: 'userA', agencyRole: 'admin' },
    expectedResult: 'DENIED',
    description: 'USER tenta alterar agencyRole para admin'
  },
  {
    id: 'AUTH-011',
    category: 'Privilege Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'create',
    existingData: null,
    incomingData: { uid: 'userA', role: 'admin', planId: 'free', planLimit: 5, isApproved: true },
    expectedResult: 'DENIED',
    description: 'USER tenta registrar conta diretamente como admin'
  },

  // =========================================================================
  // 2. MASS ASSIGNMENT TESTS (MASS-001)
  // =========================================================================
  {
    id: 'MASS-001',
    category: 'Mass Assignment',
    role: 'user',
    auth: identities.userA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', planId: 'free', isApproved: false },
    incomingData: {
      displayName: 'Hacker',
      role: 'admin',
      isApproved: true,
      planId: 'premium',
      planLimit: 999999,
      isPromoted: true,
      boostedUntil: '2099-01-01',
      kycStatus: 'verified'
    },
    expectedResult: 'DENIED',
    description: 'Ataque de Mass Assignment contendo múltiplos campos protegidos'
  },

  // =========================================================================
  // 3. OWNER ID MANIPULATION TESTS (PROP-OWN-001 to PROP-OWN-005)
  // =========================================================================
  {
    id: 'PROP-OWN-001',
    category: 'Owner ID Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', ownerId: 'ownerA', isApproved: true },
    incomingData: { id: 'propertyA', agentId: 'ownerA', ownerId: 'ownerB' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta transferir ownerId da propriedade para ownerB'
  },
  {
    id: 'PROP-OWN-002',
    category: 'Owner ID Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', isApproved: true },
    incomingData: { id: 'propertyA', agentId: 'ownerB' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar agentId para ownerB'
  },
  {
    id: 'PROP-OWN-003',
    category: 'Owner ID Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', agencyId: 'agencyA', isApproved: true },
    incomingData: { id: 'propertyA', agentId: 'ownerA', agencyId: 'agencyB' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar agencyId arbitrariamente'
  },
  {
    id: 'PROP-OWN-004',
    category: 'Owner ID Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', createdBy: 'ownerA', isApproved: true },
    incomingData: { id: 'propertyA', agentId: 'ownerA', createdBy: 'ownerB' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar createdBy para ownerB'
  },
  {
    id: 'PROP-OWN-005',
    category: 'Owner ID Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', userId: 'ownerA', isApproved: true },
    incomingData: { id: 'propertyA', agentId: 'ownerA', userId: 'ownerB' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar userId para ownerB'
  },

  // =========================================================================
  // 4. PROPERTY TAKEOVER TESTS (PROP-TAKEOVER-001 to PROP-TAKEOVER-008)
  // =========================================================================
  {
    id: 'PROP-TAKEOVER-001',
    category: 'Property Takeover',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyB',
    operation: 'update',
    existingData: { id: 'propertyB', agentId: 'ownerB', price: 10000, isApproved: true },
    incomingData: { id: 'propertyB', agentId: 'ownerB', price: 5000 },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar o preço de imóvel de ownerB'
  },
  {
    id: 'PROP-TAKEOVER-002',
    category: 'Property Takeover',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyB',
    operation: 'delete',
    existingData: { id: 'propertyB', agentId: 'ownerB', isApproved: true },
    expectedResult: 'DENIED',
    description: 'ownerA tenta deletar imóvel de ownerB'
  },
  {
    id: 'PROP-TAKEOVER-003',
    category: 'Property Takeover',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyB',
    operation: 'update',
    existingData: { id: 'propertyB', agentId: 'ownerB', description: 'Original', isApproved: true },
    incomingData: { id: 'propertyB', agentId: 'ownerB', description: 'Defaced by Hacker' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta alterar a descrição de imóvel de ownerB'
  },
  {
    id: 'PROP-TAKEOVER-004',
    category: 'Property Takeover',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyB',
    operation: 'update',
    existingData: { id: 'propertyB', agentId: 'ownerB', images: ['img1.jpg'], isApproved: true },
    incomingData: { id: 'propertyB', agentId: 'ownerB', images: ['hacked.jpg'] },
    expectedResult: 'DENIED',
    description: 'ownerA tenta substituir as fotos de imóvel de ownerB'
  },

  // =========================================================================
  // 5. AUTO-APROVAÇÃO & VERIFICATION TESTS (PROP-AUTOAPP-001 to PROP-AUTOAPP-004)
  // =========================================================================
  {
    id: 'PROP-AUTOAPP-001',
    category: 'Auto Approval',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propNew',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'ownerA', title: 'Imóvel Hack', isApproved: true, status: 'Disponível', isPromoted: false },
    expectedResult: 'DENIED',
    description: 'ownerA tenta criar imóvel já marcado como isApproved: true'
  },
  {
    id: 'PROP-AUTOAPP-002',
    category: 'Auto Approval',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propNew',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'ownerA', title: 'Imóvel Hack', isApproved: false, status: 'published', isPromoted: false },
    expectedResult: 'DENIED',
    description: 'ownerA tenta criar imóvel com status publicado sem aprovação'
  },
  {
    id: 'PROP-AUTOAPP-003',
    category: 'Auto Approval',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyPending',
    operation: 'update',
    existingData: { id: 'propertyPending', agentId: 'ownerA', isApproved: false, status: 'Pendente' },
    incomingData: { id: 'propertyPending', agentId: 'ownerA', isApproved: true, status: 'Disponível' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta atualizar próprio imóvel pendente para isApproved: true'
  },
  {
    id: 'PROP-AUTOAPP-004',
    category: 'Auto Approval',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyPending',
    operation: 'update',
    existingData: { id: 'propertyPending', agentId: 'ownerA', verificationStatus: 'none' },
    incomingData: { id: 'propertyPending', agentId: 'ownerA', verificationStatus: 'verified' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta marcar seu imóvel como verificado (verificationStatus: verified)'
  },

  // =========================================================================
  // 6. MODERATION TESTS (MOD-001 to MOD-005)
  // =========================================================================
  {
    id: 'MOD-001',
    category: 'Moderation',
    role: 'moderator',
    auth: identities.moderatorA,
    target: 'properties/propertyPending',
    operation: 'update',
    existingData: { id: 'propertyPending', agentId: 'ownerA', isApproved: false, status: 'Pendente' },
    incomingData: { id: 'propertyPending', isApproved: true, status: 'Disponível' },
    expectedResult: 'ALLOWED',
    description: 'MODERATOR aprova imóvel pendente de revisão'
  },
  {
    id: 'MOD-002',
    category: 'Moderation',
    role: 'moderator',
    auth: identities.moderatorA,
    target: 'properties/propertyPending',
    operation: 'read',
    existingData: { id: 'propertyPending', agentId: 'ownerA', isApproved: false },
    expectedResult: 'ALLOWED',
    description: 'MODERATOR visualiza imóvel pendente para auditoria'
  },
  {
    id: 'MOD-003',
    category: 'Moderation',
    role: 'moderator',
    auth: identities.moderatorA,
    target: 'orders/orderA',
    operation: 'update',
    existingData: { id: 'orderA', amount: 500, status: 'pending' },
    incomingData: { id: 'orderA', amount: 0, status: 'paid' },
    expectedResult: 'DENIED',
    description: 'MODERATOR tenta alterar pedido de pagamento ou zerar valor (operações financeiras negadas)'
  },
  {
    id: 'MOD-004',
    category: 'Moderation',
    role: 'moderator',
    auth: identities.moderatorA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', planId: 'free', planLimit: 5 },
    incomingData: { uid: 'userA', planId: 'unlimited', planLimit: 999999 },
    expectedResult: 'DENIED',
    description: 'MODERATOR tenta conceder plano ilimitado (privilégio exclusivo de ADMIN)'
  },

  // =========================================================================
  // 7. ADMIN COMPREHENSIVE TESTS (ADMIN-001 to ADMIN-005)
  // =========================================================================
  {
    id: 'ADMIN-001',
    category: 'Admin Authorization',
    role: 'admin',
    auth: identities.adminA,
    target: 'users/userA',
    operation: 'update',
    existingData: { uid: 'userA', role: 'user', isApproved: false },
    incomingData: { uid: 'userA', role: 'agent', isApproved: true },
    expectedResult: 'ALLOWED',
    description: 'ADMIN gerencia e aprova perfil de corretor'
  },
  {
    id: 'ADMIN-002',
    category: 'Admin Authorization',
    role: 'admin',
    auth: identities.adminA,
    target: 'properties/propertyPending',
    operation: 'update',
    existingData: { id: 'propertyPending', isApproved: false },
    incomingData: { id: 'propertyPending', isApproved: true, status: 'Disponível' },
    expectedResult: 'ALLOWED',
    description: 'ADMIN aprova publicação de imóvel'
  },
  {
    id: 'ADMIN-003',
    category: 'Admin Authorization',
    role: 'admin',
    auth: identities.adminA,
    target: 'orders/orderA',
    operation: 'update',
    existingData: { id: 'orderA', status: 'pending' },
    incomingData: { id: 'orderA', status: 'completed' },
    expectedResult: 'ALLOWED',
    description: 'ADMIN confirma pagamento e ativação de plano'
  },
  {
    id: 'ADMIN-004',
    category: 'Admin Authorization',
    role: 'admin',
    auth: identities.adminA,
    target: 'settings/general',
    operation: 'update',
    existingData: { maintenanceMode: false },
    incomingData: { maintenanceMode: true },
    expectedResult: 'ALLOWED',
    description: 'ADMIN modifica configurações globais da plataforma'
  },
  {
    id: 'ADMIN-005',
    category: 'Admin Authorization',
    role: 'admin',
    auth: identities.adminA,
    target: 'audit_logs/log123',
    operation: 'read',
    existingData: { event: 'user_approval', admin: 'adminA' },
    expectedResult: 'ALLOWED',
    description: 'ADMIN consulta registros de auditoria'
  },

  // =========================================================================
  // 8. CHAT ISOLATION TESTS (CHAT-001 to CHAT-007)
  // =========================================================================
  {
    id: 'CHAT-001',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chatRooms/chatB',
    operation: 'read',
    existingData: { id: 'chatB', userId: 'userB', agentId: 'ownerB', participants: ['userB', 'ownerB'] },
    expectedResult: 'DENIED',
    description: 'userA tenta ler metadados da sala chatB de terceiros'
  },
  {
    id: 'CHAT-002',
    category: 'Chat Isolation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'chatRooms/chatB',
    operation: 'read',
    existingData: { id: 'chatB', userId: 'userB', agentId: 'ownerB', participants: ['userB', 'ownerB'] },
    expectedResult: 'DENIED',
    description: 'ownerA tenta ler sala chatB de concorrente'
  },
  {
    id: 'CHAT-003',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatB/messages/msg001',
    operation: 'read',
    existingData: { text: 'Conversa privada B', senderId: 'userB' },
    expectedResult: 'DENIED',
    description: 'userA tenta bisbilhotar mensagens privadas de chatB'
  },
  {
    id: 'CHAT-004',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatB/messages/msgNew',
    operation: 'create',
    existingData: null,
    incomingData: { text: 'Spam invasivo', senderId: 'userA' },
    expectedResult: 'DENIED',
    description: 'userA tenta injetar mensagem em sala de chat que não lhe pertence'
  },
  {
    id: 'CHAT-005',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatB/messages/msg001',
    operation: 'delete',
    existingData: { text: 'Conversa privada B', senderId: 'userB' },
    expectedResult: 'DENIED',
    description: 'userA tenta apagar mensagem em chat alheio'
  },
  {
    id: 'CHAT-006',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatA/messages/msg001',
    operation: 'read',
    existingData: { text: 'Olá corretor A', senderId: 'userA' },
    expectedResult: 'ALLOWED',
    description: 'userA lê legitimamente mensagens da sua própria sala chatA'
  },
  {
    id: 'CHAT-007',
    category: 'Chat Isolation',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatA/messages/msg002',
    operation: 'create',
    existingData: null,
    incomingData: { text: 'Gostaria de agendar visita', senderId: 'userA' },
    expectedResult: 'ALLOWED',
    description: 'userA envia legitimamente mensagem na sua sala chatA'
  },

  // =========================================================================
  // 9. SENDER ID SPOOFING & RECEIVER TAMPERING (MSG-SPOOF-001 & MSG-INJ-001)
  // =========================================================================
  {
    id: 'MSG-SPOOF-001',
    category: 'Sender Spoofing',
    role: 'user',
    auth: identities.userA,
    target: 'chats/chatA/messages/msgSpoof',
    operation: 'create',
    existingData: null,
    incomingData: { text: 'Mensagem forjada fingindo ser userB', senderId: 'userB' },
    expectedResult: 'DENIED',
    description: 'userA tenta enviar mensagem falsificando senderId para userB'
  },
  {
    id: 'MSG-INJ-001',
    category: 'Receiver Manipulation',
    role: 'user',
    auth: identities.userA,
    target: 'chatRooms/chatA',
    operation: 'update',
    existingData: { id: 'chatA', userId: 'userA', agentId: 'ownerA', participants: ['userA', 'ownerA'] },
    incomingData: { id: 'chatA', userId: 'userB', agentId: 'ownerA', participants: ['userB', 'ownerA'] },
    expectedResult: 'DENIED',
    description: 'userA tenta sequestrar a sala de chat alterando o proprietário userId para userB'
  },

  // =========================================================================
  // 10. EMAIL RELAY PREVENTION (/mail)
  // =========================================================================
  {
    id: 'MAIL-001',
    category: 'Email Relay',
    role: 'anonymous',
    auth: null,
    target: 'mail/mailSpam1',
    operation: 'create',
    existingData: null,
    incomingData: { to: 'victim@target.com', message: { subject: 'Spam', text: 'Clique aqui' } },
    expectedResult: 'DENIED',
    description: 'Atacante anônimo tenta injetar e-mail na coleção /mail'
  },
  {
    id: 'MAIL-002',
    category: 'Email Relay',
    role: 'user',
    auth: identities.userA,
    target: 'mail/mailSpam2',
    operation: 'create',
    existingData: null,
    incomingData: { to: 'alvo@empresa.com', message: { subject: 'Phishing', text: 'Atualize seus dados' } },
    expectedResult: 'DENIED',
    description: 'USER autenticado tenta usar /mail como relay aberto de spam'
  },
  {
    id: 'MAIL-003',
    category: 'Email Relay',
    role: 'user',
    auth: identities.userA,
    target: 'mail/mailList',
    operation: 'read',
    existingData: { to: 'cliente@teste.com' },
    expectedResult: 'DENIED',
    description: 'USER tenta ler logs e e-mails enviados na coleção /mail'
  },

  // =========================================================================
  // 11. REVIEW FRAUD TESTS (REV-001 to REV-004)
  // =========================================================================
  {
    id: 'REV-001',
    category: 'Review Fraud',
    role: 'user',
    auth: identities.userA,
    target: 'agent_reviews/rev001',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'agentB', userId: 'userB', rating: 5, comment: 'Excelente' },
    expectedResult: 'DENIED',
    description: 'userA tenta criar avaliação forjando userId de userB'
  },
  {
    id: 'REV-002',
    category: 'Review Fraud',
    role: 'user',
    auth: identities.userA,
    target: 'agent_reviews/rev002',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'agentB', userId: 'userA', rating: 0, comment: 'Nota 0 inválida' },
    expectedResult: 'DENIED',
    description: 'userA tenta submeter avaliação com nota 0 (abaixo do intervalo 1..5)'
  },
  {
    id: 'REV-003',
    category: 'Review Fraud',
    role: 'user',
    auth: identities.userA,
    target: 'agent_reviews/rev003',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'agentB', userId: 'userA', rating: 6, comment: 'Nota 6 inválida' },
    expectedResult: 'DENIED',
    description: 'userA tenta submeter avaliação com nota 6 (acima do intervalo 1..5)'
  },
  {
    id: 'REV-004',
    category: 'Review Fraud',
    role: 'user',
    auth: identities.userA,
    target: 'agent_reviews/rev004',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'agentB', userId: 'userA', rating: 999, comment: 'Nota absurda' },
    expectedResult: 'DENIED',
    description: 'userA tenta submeter avaliação com nota 999'
  },
  {
    id: 'REV-005',
    category: 'Review Fraud',
    role: 'user',
    auth: identities.userA,
    target: 'agent_reviews/rev005',
    operation: 'create',
    existingData: null,
    incomingData: { agentId: 'agentB', userId: 'userA', rating: 5, comment: 'Muito profissional' },
    expectedResult: 'ALLOWED',
    description: 'userA submete legitimamente avaliação autêntica com nota 5'
  },

  // =========================================================================
  // 12. PAYMENT & PROMOTION MANIPULATION (PAY-001 to PAY-004)
  // =========================================================================
  {
    id: 'PAY-001',
    category: 'Payment Manipulation',
    role: 'user',
    auth: identities.userA,
    target: 'orders/orderA',
    operation: 'update',
    existingData: { id: 'orderA', userId: 'userA', status: 'pending', amount: 500 },
    incomingData: { id: 'orderA', userId: 'userA', status: 'paid' },
    expectedResult: 'DENIED',
    description: 'USER tenta alterar status da própria ordem de pending para paid'
  },
  {
    id: 'PAY-002',
    category: 'Payment Manipulation',
    role: 'user',
    auth: identities.userA,
    target: 'orders/orderA',
    operation: 'update',
    existingData: { id: 'orderA', userId: 'userA', status: 'pending', amount: 500 },
    incomingData: { id: 'orderA', userId: 'userA', status: 'pending', amount: 0 },
    expectedResult: 'DENIED',
    description: 'USER tenta alterar valor do pedido para 0'
  },
  {
    id: 'PAY-003',
    category: 'Payment Manipulation',
    role: 'user',
    auth: identities.userA,
    target: 'orders/orderNew',
    operation: 'create',
    existingData: null,
    incomingData: { id: 'orderNew', userId: 'userA', status: 'paid', amount: 0 },
    expectedResult: 'DENIED',
    description: 'USER tenta criar ordem pré-aprovada como paid'
  },
  {
    id: 'PAY-004',
    category: 'Payment Manipulation',
    role: 'user',
    auth: identities.userA,
    target: 'orders/orderNew',
    operation: 'create',
    existingData: null,
    incomingData: { id: 'orderNew', userId: 'userA', status: 'pending', amount: 500 },
    expectedResult: 'ALLOWED',
    description: 'USER cria legitimamente pedido com status pendente de pagamento'
  },

  // =========================================================================
  // 13. PROMOTION BYPASS TESTS (PROM-001 & PROM-002)
  // =========================================================================
  {
    id: 'PROM-001',
    category: 'Promotion Bypass',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', isPromoted: false },
    incomingData: { id: 'propertyA', agentId: 'ownerA', isPromoted: true },
    expectedResult: 'DENIED',
    description: 'ownerA tenta ativar isPromoted: true sem confirmação de pagamento'
  },
  {
    id: 'PROM-002',
    category: 'Promotion Bypass',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', boostedUntil: null },
    incomingData: { id: 'propertyA', agentId: 'ownerA', boostedUntil: '2099-12-31' },
    expectedResult: 'DENIED',
    description: 'ownerA tenta estender boostedUntil arbitrariamente sem pagamento'
  },

  // =========================================================================
  // 14. METRICS MANIPULATION TESTS (MET-001 to MET-003)
  // =========================================================================
  {
    id: 'MET-001',
    category: 'Metrics Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', views: 10 },
    incomingData: { id: 'propertyA', agentId: 'ownerA', views: 50000 },
    expectedResult: 'DENIED',
    description: 'ownerA tenta inflar número de visualizações diretamente'
  },
  {
    id: 'MET-002',
    category: 'Metrics Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', impressions: 25 },
    incomingData: { id: 'propertyA', agentId: 'ownerA', impressions: 100000 },
    expectedResult: 'DENIED',
    description: 'ownerA tenta forjar impressões publicitárias no anúncio'
  },
  {
    id: 'MET-003',
    category: 'Metrics Manipulation',
    role: 'owner',
    auth: identities.ownerA,
    target: 'properties/propertyA',
    operation: 'update',
    existingData: { id: 'propertyA', agentId: 'ownerA', whatsappClicks: 2 },
    incomingData: { id: 'propertyA', agentId: 'ownerA', whatsappClicks: 500 },
    expectedResult: 'DENIED',
    description: 'ownerA tenta inflar cliques de conversão do WhatsApp'
  },

  // =========================================================================
  // 15. NOTIFICATIONS ISOLATION (NOTIF-001 to NOTIF-003)
  // =========================================================================
  {
    id: 'NOTIF-001',
    category: 'Notifications',
    role: 'user',
    auth: identities.userA,
    target: 'user_notifications/notifB',
    operation: 'read',
    existingData: { id: 'notifB', userId: 'userB', title: 'Aviso Confidencial B' },
    expectedResult: 'DENIED',
    description: 'userA tenta ler notificação privada pertencente a userB'
  },
  {
    id: 'NOTIF-002',
    category: 'Notifications',
    role: 'user',
    auth: identities.userA,
    target: 'user_notifications/notifB',
    operation: 'delete',
    existingData: { id: 'notifB', userId: 'userB' },
    expectedResult: 'DENIED',
    description: 'userA tenta deletar notificação de userB'
  },
  {
    id: 'NOTIF-003',
    category: 'Notifications',
    role: 'user',
    auth: identities.userA,
    target: 'user_notifications/notifFake',
    operation: 'create',
    existingData: null,
    incomingData: { userId: 'userB', title: 'Mensagem Falsa do Sistema', type: 'system' },
    expectedResult: 'DENIED',
    description: 'userA tenta forjar notificação falsa fingindo ser o sistema para userB'
  },

  // =========================================================================
  // 16. AGENCY ISOLATION (AGY-001 to AGY-002)
  // =========================================================================
  {
    id: 'AGY-001',
    category: 'Agency Isolation',
    role: 'agent',
    auth: identities.agentA,
    target: 'premium_agencies/agencyB',
    operation: 'update',
    existingData: { id: 'agencyB', agentId: 'agentB', name: 'Imobiliária B' },
    incomingData: { id: 'agencyB', agentId: 'agentB', name: 'Hacked Imobiliária' },
    expectedResult: 'DENIED',
    description: 'agentA tenta alterar dados de agência concorrente (agencyB)'
  },
  {
    id: 'AGY-002',
    category: 'Agency Isolation',
    role: 'agent',
    auth: identities.agentA,
    target: 'premium_agencies/agencyB',
    operation: 'delete',
    existingData: { id: 'agencyB', agentId: 'agentB' },
    expectedResult: 'DENIED',
    description: 'agentA tenta deletar perfil de agência concorrente'
  },

  // =========================================================================
  // 17. PUBLIC ACCESS & UNAPPROVED LEAKAGE (PUB-001 to PUB-003)
  // =========================================================================
  {
    id: 'PUB-001',
    category: 'Data Leakage',
    role: 'anonymous',
    auth: null,
    target: 'properties/propertyPending',
    operation: 'read',
    existingData: { id: 'propertyPending', agentId: 'ownerA', isApproved: false },
    expectedResult: 'DENIED',
    description: 'Visitante anônimo tenta ler anúncio pendente/não aprovado'
  },
  {
    id: 'PUB-002',
    category: 'Data Leakage',
    role: 'anonymous',
    auth: null,
    target: 'properties/propertyA',
    operation: 'read',
    existingData: { id: 'propertyA', isApproved: true },
    expectedResult: 'ALLOWED',
    description: 'Visitante anônimo consulta legitimamente imóvel aprovado'
  },
  {
    id: 'PUB-003',
    category: 'Data Leakage',
    role: 'anonymous',
    auth: null,
    target: 'audit_logs/log001',
    operation: 'read',
    existingData: { event: 'admin_login' },
    expectedResult: 'DENIED',
    description: 'Visitante anônimo tenta enumerar registros de auditoria interna'
  },

  // =========================================================================
  // 18. LEADS, VIEWINGS & PROPERTY REPORTS SECURITY (PHASE 4)
  // =========================================================================
  {
    id: 'LEAD-SEC-001',
    category: 'Lead Privacy & Isolation',
    role: 'user',
    auth: identities.userB,
    target: 'leads/lead001',
    operation: 'read',
    existingData: {
      id: 'lead001',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      customerId: 'userA',
      customerPhone: '+258841234567',
      status: 'new'
    },
    expectedResult: 'DENIED',
    description: 'userB tenta espionar dados de contacto e lead pertencente a userA e ownerA'
  },
  {
    id: 'LEAD-SEC-002',
    category: 'Lead Status Escalation',
    role: 'user',
    auth: identities.userA,
    target: 'leads/lead002',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      customerName: 'Atacante',
      customerPhone: '+258840000000',
      message: 'Mensagem com status forjado',
      status: 'won'
    },
    expectedResult: 'DENIED',
    description: 'Usuário tenta criar lead com status privilegiado "won" em vez de "new"'
  },
  {
    id: 'LEAD-SEC-003',
    category: 'Buffer Overflow / Lead Flooding',
    role: 'user',
    auth: identities.userA,
    target: 'leads/lead003',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      customerName: 'Atacante',
      customerPhone: '+258840000000',
      message: 'A'.repeat(2500),
      status: 'new'
    },
    expectedResult: 'DENIED',
    description: 'Tentativa de injeção de payload com mensagem acima do limite de 2000 caracteres'
  },
  {
    id: 'LEAD-SEC-004',
    category: 'Lead Hijacking',
    role: 'agent',
    auth: identities.ownerA,
    target: 'leads/lead004',
    operation: 'update',
    existingData: {
      id: 'lead004',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      agentId: 'ownerA',
      customerId: 'userA',
      status: 'new'
    },
    incomingData: {
      propertyOwnerId: 'ownerB', // Tentativa de transferir dono
      status: 'contacted'
    },
    expectedResult: 'DENIED',
    description: 'Tentativa de mutação de chave imutável propertyOwnerId durante update de lead'
  },
  {
    id: 'LEAD-SEC-005',
    category: 'Lead Lifecycle Legitimate',
    role: 'agent',
    auth: identities.ownerA,
    target: 'leads/lead005',
    operation: 'update',
    existingData: {
      id: 'lead005',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      agentId: 'ownerA',
      customerId: 'userA',
      status: 'new'
    },
    incomingData: {
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      agentId: 'ownerA',
      customerId: 'userA',
      status: 'contacted'
    },
    expectedResult: 'ALLOWED',
    description: 'Anunciante legítimo atualiza status do lead para "contacted"'
  },
  {
    id: 'VIEW-SEC-001',
    category: 'Viewing Self-Confirmation Bypass',
    role: 'user',
    auth: identities.userA,
    target: 'viewings/view001',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      requesterId: 'userA',
      requesterName: 'User A',
      requesterPhone: '+258841234567',
      preferredDate: '2026-10-01',
      preferredTime: '10:00 - 12:00',
      status: 'confirmed'
    },
    expectedResult: 'DENIED',
    description: 'Solicitante tenta auto-confirmar visita no momento da criação (status: confirmed)'
  },
  {
    id: 'VIEW-SEC-002',
    category: 'Viewing Privacy',
    role: 'user',
    auth: identities.userB,
    target: 'viewings/view002',
    operation: 'read',
    existingData: {
      id: 'view002',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      requesterId: 'userA',
      preferredDate: '2026-10-01'
    },
    expectedResult: 'DENIED',
    description: 'userB tenta bisbilhotar visita agendada entre userA e ownerA'
  },
  {
    id: 'VIEW-SEC-003',
    category: 'Viewing Requester Cancellation',
    role: 'user',
    auth: identities.userA,
    target: 'viewings/view003',
    operation: 'update',
    existingData: {
      id: 'view003',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      requesterId: 'userA',
      status: 'pending'
    },
    incomingData: {
      status: 'cancelled'
    },
    expectedResult: 'ALLOWED',
    description: 'Solicitante cancela legitimamente a sua própria visita pendente'
  },
  {
    id: 'VIEW-SEC-004',
    category: 'Viewing Owner Confirmation',
    role: 'agent',
    auth: identities.ownerA,
    target: 'viewings/view004',
    operation: 'update',
    existingData: {
      id: 'view004',
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      agentId: 'ownerA',
      requesterId: 'userA',
      status: 'pending'
    },
    incomingData: {
      propertyId: 'propertyA',
      propertyOwnerId: 'ownerA',
      agentId: 'ownerA',
      requesterId: 'userA',
      status: 'confirmed'
    },
    expectedResult: 'ALLOWED',
    description: 'Anunciante responsável confirma visita solicitada'
  },
  {
    id: 'REP-SEC-001',
    category: 'Property Report Creation',
    role: 'user',
    auth: identities.userA,
    target: 'property_reports/rep001',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      reporterId: 'userA',
      reason: 'fraud',
      description: 'Anúncio com fotos de outro imóvel em Maputo.',
      status: 'open'
    },
    expectedResult: 'ALLOWED',
    description: 'Usuário autenticado envia denúncia legítima de fraude com status "open"'
  },
  {
    id: 'REP-SEC-002',
    category: 'Property Report Privacy',
    role: 'user',
    auth: identities.userA,
    target: 'property_reports/rep001',
    operation: 'read',
    existingData: {
      id: 'rep001',
      propertyId: 'propertyA',
      reporterId: 'userB',
      status: 'open'
    },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta ler denúncias de terceiros'
  },
  {
    id: 'REP-SEC-003',
    category: 'Property Report Moderation Access',
    role: 'moderator',
    auth: identities.moderatorA,
    target: 'property_reports/rep001',
    operation: 'read',
    existingData: {
      id: 'rep001',
      propertyId: 'propertyA',
      reporterId: 'userB',
      status: 'open'
    },
    expectedResult: 'ALLOWED',
    description: 'Moderador autorizado consulta denúncia pendente para apuração'
  },
  {
    id: 'REP-SEC-004',
    category: 'Property Report Tampering',
    role: 'user',
    auth: identities.userA,
    target: 'property_reports/rep001',
    operation: 'update',
    existingData: {
      id: 'rep001',
      propertyId: 'propertyA',
      reporterId: 'userA',
      status: 'open'
    },
    incomingData: {
      status: 'resolved'
    },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta fechar ou auto-moderar denúncia'
  },

  // =========================================================================
  // LEAD EVENTS TELEMETRY TESTS (EVENT-SEC-001 to EVENT-SEC-005)
  // =========================================================================
  {
    id: 'EVENT-SEC-001',
    category: 'Lead Event Spoofing',
    role: 'user',
    auth: identities.userA,
    target: 'lead_events/ev001',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      sessionId: 'sess_123',
      eventType: 'property_view',
      userId: 'userB' // Spoofing userB identity
    },
    expectedResult: 'DENIED',
    description: 'userA tenta forjar telemetria com identidade de userB'
  },
  {
    id: 'EVENT-SEC-002',
    category: 'Lead Event Privacy',
    role: 'user',
    auth: identities.userA,
    target: 'lead_events/ev002',
    operation: 'read',
    existingData: {
      propertyId: 'propertyA',
      sessionId: 'sess_123',
      eventType: 'whatsapp_click'
    },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta consultar dados analíticos brutos de telemetria'
  },
  {
    id: 'EVENT-SEC-003',
    category: 'Lead Event Immutability',
    role: 'user',
    auth: identities.userA,
    target: 'lead_events/ev003',
    operation: 'update',
    existingData: {
      propertyId: 'propertyA',
      sessionId: 'sess_123',
      eventType: 'property_view'
    },
    incomingData: {
      eventType: 'lead_created'
    },
    expectedResult: 'DENIED',
    description: 'Tentativa de adulterar ou mutar registro de telemetria imutável'
  },
  {
    id: 'EVENT-SEC-004',
    category: 'Lead Event Invalid Type',
    role: 'user',
    auth: identities.userA,
    target: 'lead_events/ev004',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      sessionId: 'sess_123',
      eventType: 'fake_illegal_event'
    },
    expectedResult: 'DENIED',
    description: 'Injeção de evento de telemetria com tipo não catalogado'
  },
  {
    id: 'EVENT-SEC-005',
    category: 'Lead Event Legitimate',
    role: 'user',
    auth: identities.userA,
    target: 'lead_events/ev005',
    operation: 'create',
    incomingData: {
      propertyId: 'propertyA',
      sessionId: 'sess_123',
      eventType: 'property_view',
      userId: 'userA'
    },
    expectedResult: 'ALLOWED',
    description: 'Registro legítimo de visualização de imóvel pelo usuário'
  },

  // =========================================================================
  // USER NOTIFICATIONS ISOLATION TESTS (NOTIF-SEC-001 to NOTIF-SEC-003)
  // =========================================================================
  {
    id: 'NOTIF-SEC-001',
    category: 'Notification Privacy',
    role: 'user',
    auth: identities.userB,
    target: 'user_notifications/notif001',
    operation: 'read',
    existingData: {
      id: 'notif001',
      userId: 'userA',
      title: 'Nova mensagem de lead',
      type: 'lead_received'
    },
    expectedResult: 'DENIED',
    description: 'userB tenta ler notificação privada pertencente a userA'
  },
  {
    id: 'NOTIF-SEC-002',
    category: 'Notification Tampering',
    role: 'user',
    auth: identities.userB,
    target: 'user_notifications/notif001',
    operation: 'update',
    existingData: {
      id: 'notif001',
      userId: 'userA',
      isRead: false
    },
    incomingData: {
      isRead: true
    },
    expectedResult: 'DENIED',
    description: 'userB tenta marcar como lida ou adulterar notificação de userA'
  },
  {
    id: 'NOTIF-SEC-003',
    category: 'Notification Own Access',
    role: 'user',
    auth: identities.userA,
    target: 'user_notifications/notif001',
    operation: 'read',
    existingData: {
      id: 'notif001',
      userId: 'userA',
      title: 'Nova mensagem de lead'
    },
    expectedResult: 'ALLOWED',
    description: 'userA lê legitimamente a sua própria notificação'
  },

  // =========================================================================
  // 19. RESORTS, PLANS, FEEDBACKS, PAYMENTS, SYSTEM STATS & DEFAULT DENY
  // =========================================================================
  {
    id: 'RST-001',
    category: 'Resort Public Read',
    role: 'anonymous',
    auth: null,
    target: 'resorts/resort1',
    operation: 'read',
    existingData: { id: 'resort1', name: 'Bazaruto Island Resort' },
    expectedResult: 'ALLOWED',
    description: 'Visitante anônimo lê detalhes de resort aprovado'
  },
  {
    id: 'RST-002',
    category: 'Resort Tampering',
    role: 'user',
    auth: identities.userA,
    target: 'resorts/resort1',
    operation: 'update',
    existingData: { id: 'resort1', name: 'Bazaruto Island Resort' },
    incomingData: { name: 'Hacked Resort' },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta alterar dados cadastrais de resort'
  },
  {
    id: 'RST-003',
    category: 'Resort Admin Maintenance',
    role: 'admin',
    auth: identities.admin,
    target: 'resorts/resort1',
    operation: 'update',
    existingData: { id: 'resort1', name: 'Bazaruto Island Resort' },
    incomingData: { name: 'Bazaruto Luxury Resort' },
    expectedResult: 'ALLOWED',
    description: 'Administrador atualiza informações do resort'
  },
  {
    id: 'RST-REV-001',
    category: 'Resort Review Legitimate',
    role: 'user',
    auth: identities.userA,
    target: 'resorts/resort1/reviews/rev01',
    operation: 'create',
    incomingData: { userId: 'userA', rating: 5, comment: 'Excelente estadia!' },
    expectedResult: 'ALLOWED',
    description: 'userA envia avaliação legítima com seu próprio userId para o resort'
  },
  {
    id: 'RST-REV-002',
    category: 'Resort Review Spoofing',
    role: 'user',
    auth: identities.userA,
    target: 'resorts/resort1/reviews/rev02',
    operation: 'create',
    incomingData: { userId: 'userB', rating: 1, comment: 'Review forjada!' },
    expectedResult: 'DENIED',
    description: 'userA tenta forjar avaliação em nome de userB no resort'
  },
  {
    id: 'PLN-001',
    category: 'Plans Public Read',
    role: 'anonymous',
    auth: null,
    target: 'plans/plan_pro',
    operation: 'read',
    existingData: { id: 'plan_pro', price: 2500 },
    expectedResult: 'ALLOWED',
    description: 'Público consulta tabela de planos e preços'
  },
  {
    id: 'PLN-002',
    category: 'Plans Tampering',
    role: 'user',
    auth: identities.userA,
    target: 'plans/plan_pro',
    operation: 'update',
    existingData: { id: 'plan_pro', price: 2500 },
    incomingData: { price: 0 },
    expectedResult: 'DENIED',
    description: 'Usuário tenta alterar preço do plano para zero'
  },
  {
    id: 'FAG-001',
    category: 'Featured Agents Public Read',
    role: 'anonymous',
    auth: null,
    target: 'featured_agents/agentA',
    operation: 'read',
    existingData: { agentId: 'agentA', name: 'Corretor Destaque' },
    expectedResult: 'ALLOWED',
    description: 'Público visualiza lista de corretores em destaque'
  },
  {
    id: 'FAG-002',
    category: 'Featured Agents Tampering',
    role: 'agent',
    auth: identities.agentA,
    target: 'featured_agents/agentA',
    operation: 'create',
    incomingData: { agentId: 'agentA', name: 'Auto-Destaque Ilegítimo' },
    expectedResult: 'DENIED',
    description: 'Corretor tenta se auto-promover como featured_agent sem autorização de admin'
  },
  {
    id: 'FBK-001',
    category: 'Feedback Submission',
    role: 'anonymous',
    auth: null,
    target: 'feedbacks/fb001',
    operation: 'create',
    incomingData: { email: 'visitante@gmail.com', message: 'Ótima plataforma!' },
    expectedResult: 'ALLOWED',
    description: 'Visitante anônimo envia sugestão de feedback'
  },
  {
    id: 'FBK-002',
    category: 'Feedback Privacy',
    role: 'user',
    auth: identities.userA,
    target: 'feedbacks/fb001',
    operation: 'read',
    existingData: { email: 'visitante@gmail.com', message: 'Mensagem confidencial' },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta bisbilhotar feedbacks de outros usuários'
  },
  {
    id: 'PAY-001',
    category: 'Payment Creation Legitimate',
    role: 'user',
    auth: identities.userA,
    target: 'payments/pay001',
    operation: 'create',
    incomingData: { userId: 'userA', amount: 500, status: 'pending' },
    expectedResult: 'ALLOWED',
    description: 'userA cria registro de pagamento com status "pending"'
  },
  {
    id: 'PAY-002',
    category: 'Payment Self-Approval Bypass',
    role: 'user',
    auth: identities.userA,
    target: 'payments/pay002',
    operation: 'create',
    incomingData: { userId: 'userA', amount: 500, status: 'completed' },
    expectedResult: 'DENIED',
    description: 'userA tenta forjar status "completed" no momento da criação do pagamento'
  },
  {
    id: 'PAY-003',
    category: 'Payment Privacy',
    role: 'user',
    auth: identities.userB,
    target: 'payments/pay001',
    operation: 'read',
    existingData: { userId: 'userA', amount: 500, status: 'pending' },
    expectedResult: 'DENIED',
    description: 'userB tenta espionar comprovante ou fatura de pagamento de userA'
  },
  {
    id: 'SYS-001',
    category: 'System Stats Public Read',
    role: 'anonymous',
    auth: null,
    target: 'system_stats/overview',
    operation: 'read',
    existingData: { totalProperties: 1500, verifiedAgents: 42 },
    expectedResult: 'ALLOWED',
    description: 'Visitante anônimo lê estatísticas públicas agregadas da plataforma'
  },
  {
    id: 'SYS-002',
    category: 'System Stats Tampering',
    role: 'user',
    auth: identities.userA,
    target: 'system_stats/overview',
    operation: 'update',
    existingData: { totalProperties: 1500 },
    incomingData: { totalProperties: 999999 },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta falsificar contadores globais de estatísticas'
  },
  {
    id: 'DEF-001',
    category: 'Default Deny Catch-all',
    role: 'user',
    auth: identities.userA,
    target: 'internal_secrets/master_key',
    operation: 'read',
    existingData: { key: 'secret_123' },
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta acessar coleção não mapeada capturada pelo default deny'
  },
  {
    id: 'DEF-002',
    category: 'Default Deny Admin Access',
    role: 'admin',
    auth: identities.admin,
    target: 'internal_secrets/master_key',
    operation: 'read',
    existingData: { key: 'secret_123' },
    expectedResult: 'ALLOWED',
    description: 'Administrador mestre acessa metadados internos cobertos pela regra global'
  }
];

export const storagePenetrationTests: StorageTestCase[] = [
  // =========================================================================
  // 18. STORAGE OWNERSHIP & ISOLATION (STG-OWN-001 to STG-OWN-006)
  // =========================================================================
  {
    id: 'STG-OWN-001',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userB/foto01.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 1024 * 1024,
    expectedResult: 'DENIED',
    description: 'userA tenta fazer upload/sobrescrever foto de imóvel no namespace de userB'
  },
  {
    id: 'STG-OWN-002',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userB/foto01.jpg',
    operation: 'delete',
    expectedResult: 'DENIED',
    description: 'userA tenta apagar foto de imóvel pertencente a userB'
  },
  {
    id: 'STG-OWN-003',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'kyc_documents/userB/bi_frente.pdf',
    operation: 'read',
    expectedResult: 'DENIED',
    description: 'userA tenta baixar documento confidencial de identidade de userB'
  },
  {
    id: 'STG-OWN-004',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'kyc_documents/userB/alvara.pdf',
    operation: 'delete',
    expectedResult: 'DENIED',
    description: 'userA tenta apagar documento KYC de userB'
  },
  {
    id: 'STG-OWN-005',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'property_documents/userB/titulo_propriedade.pdf',
    operation: 'read',
    expectedResult: 'DENIED',
    description: 'userA tenta baixar título de propriedade confidencial de userB'
  },
  {
    id: 'STG-OWN-006',
    category: 'Storage Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'kyc_documents/userA/bi_proprio.pdf',
    operation: 'write',
    contentType: 'application/pdf',
    sizeBytes: 2 * 1024 * 1024,
    expectedResult: 'ALLOWED',
    description: 'userA faz upload legítimo do seu próprio documento de identidade'
  },

  // =========================================================================
  // 19. MALICIOUS UPLOAD TESTS (STG-MAL-001 to STG-MAL-005)
  // =========================================================================
  {
    id: 'STG-MAL-001',
    category: 'Malicious Upload',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/malicious.js',
    operation: 'write',
    contentType: 'application/javascript',
    sizeBytes: 500,
    expectedResult: 'DENIED',
    description: 'userA tenta upload de script JavaScript executável (.js) no bucket de propriedades'
  },
  {
    id: 'STG-MAL-002',
    category: 'Malicious Upload',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/shell.sh',
    operation: 'write',
    contentType: 'application/x-sh',
    sizeBytes: 800,
    expectedResult: 'DENIED',
    description: 'userA tenta upload de shell script executável (.sh)'
  },
  {
    id: 'STG-MAL-003',
    category: 'Malicious Upload',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/payload.php',
    operation: 'write',
    contentType: 'application/octet-stream',
    sizeBytes: 1200,
    expectedResult: 'DENIED',
    description: 'userA tenta upload de payload binário / PHP (.php)'
  },
  {
    id: 'STG-MAL-004',
    category: 'Malicious Upload',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/giant_file.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 25 * 1024 * 1024, // 25MB > 10MB
    expectedResult: 'DENIED',
    description: 'userA tenta upload de imagem excedendo o limite de 10MB (25MB)'
  },
  {
    id: 'STG-MAL-005',
    category: 'Malicious Upload',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/foto_valida.webp',
    operation: 'write',
    contentType: 'image/webp',
    sizeBytes: 2 * 1024 * 1024,
    expectedResult: 'ALLOWED',
    description: 'userA faz upload legítimo de imagem webp de 2MB'
  },

  // =========================================================================
  // 20. PATH TRAVERSAL TESTS (STG-TRAV-001 & STG-TRAV-002)
  // =========================================================================
  {
    id: 'STG-TRAV-001',
    category: 'Path Traversal',
    role: 'user',
    auth: identities.userA,
    path: 'properties/userA/../../userB/secret.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
    expectedResult: 'DENIED',
    description: 'userA tenta escapar do diretório usando ../../ para sobrescrever arquivo de userB'
  },
  {
    id: 'STG-TRAV-002',
    category: 'Path Traversal',
    role: 'user',
    auth: identities.userA,
    path: 'kyc_documents/userA/..%2f..%2fuserB/alvara.pdf',
    operation: 'read',
    expectedResult: 'DENIED',
    description: 'userA tenta ler documento confidencial usando URL-encoded path traversal (%2e%2e)'
  },

  // =========================================================================
  // 21. STORAGE EXTENDED PATHS & DEFAULT DENY
  // =========================================================================
  {
    id: 'STG-ROOT-001',
    category: 'Storage Root Legacy',
    role: 'anonymous',
    auth: null,
    path: 'properties/root_file.jpg',
    operation: 'read',
    expectedResult: 'ALLOWED',
    description: 'Leitura pública de arquivos de raiz legados'
  },
  {
    id: 'STG-ROOT-002',
    category: 'Storage Root Legacy',
    role: 'user',
    auth: identities.userA,
    path: 'properties/root_file.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
    expectedResult: 'DENIED',
    description: 'Usuário comum tenta gravar na raiz não particionada de properties'
  },
  {
    id: 'STG-ROOT-003',
    category: 'Storage Root Legacy Admin',
    role: 'admin',
    auth: identities.admin,
    path: 'properties/root_file.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
    expectedResult: 'ALLOWED',
    description: 'Administrador grava na raiz de properties'
  },
  {
    id: 'STG-LOGO-001',
    category: 'Agency Logo Partition',
    role: 'agent',
    auth: identities.agentA,
    path: 'agency_logos/agentA/logo.png',
    operation: 'write',
    contentType: 'image/png',
    sizeBytes: 500 * 1024,
    expectedResult: 'ALLOWED',
    description: 'agentA faz upload de logotipo próprio para agency_logos'
  },
  {
    id: 'STG-LOGO-002',
    category: 'Agency Logo Isolation',
    role: 'agent',
    auth: identities.agentA,
    path: 'agency_logos/agentB/logo.png',
    operation: 'write',
    contentType: 'image/png',
    sizeBytes: 500 * 1024,
    expectedResult: 'DENIED',
    description: 'agentA tenta sobrescrever o logotipo de agency_logos de agentB'
  },
  {
    id: 'STG-AVT-001',
    category: 'Avatar Partition',
    role: 'user',
    auth: identities.userA,
    path: 'avatars/userA/photo.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 200 * 1024,
    expectedResult: 'ALLOWED',
    description: 'userA envia avatar para a sua própria pasta'
  },
  {
    id: 'STG-AVT-002',
    category: 'Avatar Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'avatars/userB/photo.jpg',
    operation: 'write',
    contentType: 'image/jpeg',
    sizeBytes: 200 * 1024,
    expectedResult: 'DENIED',
    description: 'userA tenta alterar avatar de userB'
  },
  {
    id: 'STG-UPL-001',
    category: 'User Uploads Isolation',
    role: 'user',
    auth: identities.userA,
    path: 'user_uploads/userA/comprovativo.pdf',
    operation: 'read',
    expectedResult: 'ALLOWED',
    description: 'userA lê o seu próprio documento enviado'
  },
  {
    id: 'STG-UPL-002',
    category: 'User Uploads Isolation',
    role: 'user',
    auth: identities.userB,
    path: 'user_uploads/userA/comprovativo.pdf',
    operation: 'read',
    expectedResult: 'DENIED',
    description: 'userB tenta ler documento privado de userA'
  },
  {
    id: 'STG-UPL-003',
    category: 'User Uploads Limit',
    role: 'user',
    auth: identities.userA,
    path: 'user_uploads/userA/backup_gigante.zip',
    operation: 'write',
    contentType: 'application/zip',
    sizeBytes: 25 * 1024 * 1024, // 25MB > 10MB
    expectedResult: 'DENIED',
    description: 'userA tenta upload de arquivo acima de 10MB em user_uploads'
  },
  {
    id: 'STG-DEF-001',
    category: 'Storage Default Deny',
    role: 'user',
    auth: identities.userA,
    path: 'system_backups/database.tar.gz',
    operation: 'read',
    expectedResult: 'DENIED',
    description: 'userA tenta ler pasta interna capturada pelo default deny do Storage'
  },
  {
    id: 'STG-DEF-002',
    category: 'Storage Default Deny',
    role: 'user',
    auth: identities.userA,
    path: 'system_backups/database.tar.gz',
    operation: 'write',
    contentType: 'application/octet-stream',
    sizeBytes: 1024,
    expectedResult: 'DENIED',
    description: 'userA tenta gravar em pasta não mapeada capturada pelo default deny'
  }
];
