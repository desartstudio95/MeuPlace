export interface Agent {
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  avatar?: string;
  bio?: string;
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
  agent: Agent;
  createdAt: string;
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
