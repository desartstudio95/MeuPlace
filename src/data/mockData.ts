import { Property } from '@/types';

export const FEATURED_RESORTS = [
  {
    id: 'r1',
    name: 'White Pearl Resorts',
    location: 'Ponta do Ouro, Maputo',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
    rating: 4.9,
    price: '45,000 MZN',
    description: 'Experimente o luxo puro no White Pearl Resorts. Localizado nas dunas intocadas da Ponta do Ouro, oferecemos vilas exclusivas com piscinas privativas, vistas panorâmicas do Oceano Índico e serviço de classe mundial.',
    amenities: ['Piscina Privativa', 'Spa', 'Restaurante Gourmet', 'Wi-Fi Grátis', 'Acesso à Praia', 'Mergulho'],
    contact: {
      phone: '+258 84 123 4567',
      email: 'reservas@whitepearl.co.mz',
      website: 'www.whitepearlresorts.com'
    },
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80'
    ]
  },
  {
    id: 'r2',
    name: 'Polana Serena Hotel',
    location: 'Maputo, Cidade',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
    rating: 4.8,
    price: '15,000 MZN',
    description: 'O histórico Polana Serena Hotel, conhecido como a "Grande Dama" de África, oferece um oásis de luxo e tranquilidade no coração de Maputo, combinando elegância clássica com comodidades modernas.',
    amenities: ['Piscina Exterior', 'Spa Maisha', 'Ginásio', 'Salas de Conferência', 'Restaurante', 'Bar'],
    contact: {
      phone: '+258 21 241 700',
      email: 'reservations@polana.serena.co.mz',
      website: 'www.serenahotels.com/polana'
    },
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80'
    ]
  },
  {
    id: 'r3',
    name: 'Anantara Bazaruto',
    location: 'Arquipélago de Bazaruto, Inhambane',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
    rating: 5.0,
    price: '60,000 MZN',
    description: 'Descubra um paraíso intocado no Anantara Bazaruto Island Resort. Rodeado por águas cristalinas e praias de areia branca, é o refúgio perfeito para relaxamento e aventura.',
    amenities: ['Vilas sobre a água', 'Mergulho com cilindro', 'Passeios de barco', 'Spa Anantara', 'Ténis', 'Piscina de borda infinita'],
    contact: {
      phone: '+258 84 304 6000',
      email: 'bazaruto@anantara.com',
      website: 'www.anantara.com/bazaruto'
    },
    gallery: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2340&q=80'
    ]
  }
];

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Apartamento T3 com Vista Mar',
    description: 'Luxuoso apartamento T3 localizado na Polana Cimento, com vista deslumbrante para o Oceano Índico. Acabamentos modernos, cozinha equipada e segurança 24h.',
    price: 15000000,
    currency: 'MZN',
    location: 'Polana Cimento, Maputo',
    type: 'Venda',
    category: 'Apartamento',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'],
    features: ['Vista Mar', 'Piscina', 'Ginásio', 'Estacionamento'],
    coordinates: { lat: -25.9692, lng: 32.5858 }, // Polana Cimento
    agent: { 
      name: 'Carlos Macuácua', 
      phone: '+258 84 123 4567', 
      whatsapp: '+258 84 123 4567',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      rating: 5.0,
      reviews: 124,
      propertiesSold: 45,
      agency: 'Remax Moçambique',
      yearsOfExperience: 8,
      isVerified: true
    },
    createdAt: '2023-10-25T10:00:00Z',
    isPromoted: true,
  },
  {
    id: '2',
    title: 'Vivenda V4 na Matola Rio',
    description: 'Espaçosa vivenda V4 com jardim e piscina. Ideal para famílias grandes. Zona calma e segura.',
    price: 85000,
    currency: 'MZN',
    location: 'Matola Rio, Matola',
    type: 'Arrendamento',
    category: 'Vivenda',
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    images: ['https://images.unsplash.com/photo-1600596542815-22b8c153bd30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80'],
    features: ['Jardim', 'Piscina', 'Garagem', 'Anexo'],
    coordinates: { lat: -25.9653, lng: 32.4589 }, // Matola Rio
    agent: { 
      name: 'Ana Langa', 
      phone: '+258 82 987 6543', 
      whatsapp: '+258 82 987 6543',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      rating: 4.9,
      reviews: 89,
      propertiesSold: 32,
      agency: 'Century 21',
      yearsOfExperience: 5,
      isVerified: true
    },
    createdAt: '2023-10-26T14:30:00Z',
  },
  {
    id: '3',
    title: 'Escritório Moderno no Centro',
    description: 'Escritório open-space no coração de Maputo. Perfeito para startups e pequenas empresas.',
    price: 45000,
    currency: 'MZN',
    location: 'Baixa, Maputo',
    type: 'Arrendamento',
    category: 'Escritório',
    bedrooms: 0,
    bathrooms: 1,
    area: 80,
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2301&q=80'],
    features: ['Ar Condicionado', 'Segurança', 'Elevador'],
    coordinates: { lat: -25.9725, lng: 32.5716 }, // Baixa Maputo
    agent: { 
      name: 'Imobiliária Maputo', 
      phone: '+258 21 123 456', 
      whatsapp: '+258 84 000 0000',
      rating: 4.5,
      reviews: 45,
      propertiesSold: 120,
      agency: 'Imobiliária Maputo',
      yearsOfExperience: 15
    },
    createdAt: '2023-10-27T09:15:00Z',
    isPromoted: true,
  },
  {
    id: '4',
    title: 'Terreno para Construção',
    description: 'Terreno de 20x40m em zona de expansão.',
    price: 1200000,
    currency: 'MZN',
    location: 'Marracuene, Maputo',
    type: 'Venda',
    category: 'Terreno',
    bedrooms: 0,
    bathrooms: 0,
    area: 800,
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2664&q=80'],
    features: ['Murado', 'Documentação em dia'],
    coordinates: { lat: -25.7333, lng: 32.6833 }, // Marracuene
    agent: { 
      name: 'João Sitoe', 
      phone: '845555555', 
      whatsapp: '845555555',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      rating: 4.8,
      reviews: 56,
      propertiesSold: 28,
      agency: 'ERA Imobiliária',
      yearsOfExperience: 4
    },
    createdAt: '2023-10-28T11:00:00Z',
  },
  {
    id: '5',
    title: 'Loja Comercial',
    description: 'Loja com excelente visibilidade em avenida principal.',
    price: 60000,
    currency: 'MZN',
    location: 'Alto Maé, Maputo',
    type: 'Arrendamento',
    category: 'Loja',
    bedrooms: 0,
    bathrooms: 1,
    area: 120,
    images: ['https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'],
    features: ['Vitrine', 'Estacionamento'],
    coordinates: { lat: -25.9622, lng: 32.5694 }, // Alto Maé
    agent: { 
      name: 'Maria Silva', 
      phone: '841111111', 
      whatsapp: '841111111',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      rating: 5.0,
      reviews: 112,
      propertiesSold: 50,
      agency: 'Pam Golding',
      yearsOfExperience: 10
    },
    createdAt: '2023-10-29T15:00:00Z',
    isPromoted: true,
  },
  {
    id: '6',
    title: 'Armazém Industrial',
    description: 'Armazém com pé direito alto e acesso para caminhões.',
    price: 150000,
    currency: 'MZN',
    location: 'Matola Gare, Matola',
    type: 'Arrendamento',
    category: 'Armazém',
    bedrooms: 0,
    bathrooms: 2,
    area: 1000,
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'],
    features: ['Pé direito alto', 'Segurança 24h', 'Balança'],
    coordinates: { lat: -25.9411, lng: 32.4278 }, // Matola Gare
    agent: { 
      name: 'Logística MZ', 
      phone: '822222222', 
      whatsapp: '822222222',
      rating: 4.7,
      reviews: 34,
      propertiesSold: 80,
      agency: 'Logística MZ',
      yearsOfExperience: 12
    },
    createdAt: '2023-10-30T08:00:00Z',
  }
];
