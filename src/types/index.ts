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
  role?: string;
}

export interface PremiumAgency {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
  order?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'MZN' | 'USD';
  location: string;
  type: 'Venda' | 'Arrendamento';
  category: 'Apartamento' | 'Vivenda' | 'Terreno' | 'Escritório' | 'Loja' | 'Armazém';
  bedrooms: number;
  bathrooms: number;
  area: number; // m²
  images: string[];
  features: string[];
  coordinates?: { lat: number; lng: number };
  agent?: Agent; // Optional for backward compatibility with mock data
  agentId?: string; // Stored in Firebase
  createdAt: string;
  isPromoted?: boolean;
  isApproved?: boolean;
  requestedPackage?: string;
  status?: 'Disponível' | 'Vendido' | 'Arrendado' | 'Pendente';
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
