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
  isActive: boolean;
  order?: number;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: any;
  favorites?: any;
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
  status: 'available' | 'sold' | 'rented' | 'Disponível' | 'Vendido' | 'Arrendado' | 'Pendente';
  agentId: string;
  agent?: Agent;
  images: string[];
  createdAt: any;
  isHighlighted?: boolean;
  isPromoted?: boolean;
  isApproved?: boolean;
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  features?: string[];
  requestedPackage?: string;
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
