export interface Plan {
  id: string;
  name: string;
  price: number;
  limit: number;
  description: string;
  features: string[];
  originalPrice?: number;
  isPromo?: boolean;
  badge?: string;
  order?: number;
}

export const PLANS: Plan[] = [
  {
    id: 'launch-promo',
    name: 'Especial Pré-Lançamento',
    price: 500,
    originalPrice: 1500,
    limit: 15,
    description: 'Promoção exclusiva de pré-lançamento para agentes pioneiros anunciarem seus imóveis.',
    features: [
      'Até 15 anúncios de imóveis ativos',
      '2 Imóveis em Destaque na Página Inicial (Spotlight)',
      'Selo exclusivo de Agente Pioneiro / Verificado',
      'Recebimento direto de contactos via WhatsApp',
      'Painel de Estatísticas e Métricas em tempo real',
      'Suporte prioritário e direto da equipa MeuPlace'
    ],
    isPromo: true,
    badge: '🚀 Pré-Lançamento • 500 MT',
    order: 1
  },
  {
    id: 'free',
    name: 'Plano Experimental',
    price: 0,
    limit: 2,
    description: 'Para quem está a começar no mercado imobiliário.',
    features: [
      'Até 2 anúncios de imóveis',
      '0 Imóveis em Destaque (Spotlight)',
      'Suporte via email'
    ],
    order: 0
  },
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 1500,
    limit: 10,
    description: 'Para agentes individuais que procuram mais resultados.',
    features: [
      'Até 10 anúncios de imóveis',
      '2 Imóveis em Destaque (Spotlight)',
      'Suporte prioritário',
      'Análise de Estatísticas Básicas'
    ],
    order: 2
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    price: 4500,
    limit: 25,
    description: 'Ideal para agentes estabelecidos e pequenas equipas.',
    features: [
      'Até 25 anúncios de imóveis',
      '5 Imóveis em Destaque (Spotlight)',
      'Selo de Agente Verificado',
      'Estatísticas Detalhadas de Retorno (ROI)'
    ],
    order: 3
  },
  {
    id: 'enterprise',
    name: 'Enterprise Premium',
    price: 12500,
    limit: 100,
    description: 'Solução premium com posicionamento selecionado.',
    features: [
      'Até 100 anúncios de imóveis',
      '20 Imóveis em Destaque (Spotlight)',
      'Presença Exclusiva na secção Imobiliárias Premium',
      'Apoio Jurídico e Documental',
      'Gestor de Conta Dedicado'
    ],
    order: 4
  }
];

export const DEFAULT_PLAN_LIMIT = 2;

export const RESORT_PLANS: Plan[] = [
  {
    id: 'resort-basic',
    name: 'Essencial',
    price: 3500,
    limit: 10,
    description: 'Para pequenos resorts, guesthouses e lodges boutique.',
    features: [
      'Até 10 Quartos / Unidades listadas',
      'Galeria de Fotos Premium',
      'Recebimento de Contactos Diretos',
      'Suporte Básico'
    ]
  },
  {
    id: 'resort-pro',
    name: 'Resort Pro',
    price: 8000,
    limit: 50,
    description: 'Para resorts de médio porte com múltiplas acomodações.',
    features: [
      'Até 50 Quartos / Unidades listadas',
      'Apresentação em Vídeo',
      'Estatísticas de Visualizações e Cliques',
      'Suporte Prioritário',
      'Destaque na secção de Resorts'
    ]
  },
  {
    id: 'resort-elite',
    name: 'Elite / Cadeia Hoteleira',
    price: 25000,
    limit: 999999, // Unlimited
    description: 'A solução definitiva para grandes resorts e hotéis de luxo.',
    features: [
      'Unidades e Quartos Ilimitados',
      'Tours 360º Matterport',
      'Integração com Motor de Reservas (Link direto)',
      'Gestor de Conta Dedicado',
      'Campanhas de Marketing Exclusivas'
    ]
  }
];
