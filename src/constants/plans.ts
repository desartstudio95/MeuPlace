export interface Plan {
  id: string;
  name: string;
  price: number;
  limit: number;
  description: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Básico (Grátis)',
    price: 0,
    limit: 5,
    description: 'Para quem está a começar no mercado imobiliário.',
    features: [
      'Até 5 anúncios de imóveis',
      '0 Imóveis em Destaque (Spotlight)',
      'Suporte via email'
    ]
  },
  {
    id: 'pro-10',
    name: 'Pro 10',
    price: 800,
    limit: 10,
    description: 'Para agentes individuais que procuram mais resultados.',
    features: [
      'Até 10 anúncios de imóveis',
      '2 Imóveis em Destaque (Spotlight)',
      'Suporte prioritário',
      'Análise de Estatísticas Básicas'
    ]
  },
  {
    id: 'pro-25',
    name: 'Pro 25',
    price: 1500,
    limit: 25,
    description: 'Ideal para agentes estabelecidos e pequenas equipas.',
    features: [
      'Até 25 anúncios de imóveis',
      '5 Imóveis em Destaque (Spotlight)',
      'Selo de Agente Verificado',
      'Estatísticas Detalhadas de Retorno (ROI)'
    ]
  },
  {
    id: 'agency',
    name: 'Agência (100 Anúncios)',
    price: 4500,
    limit: 100,
    description: 'Para agências médias com portfólio robusto.',
    features: [
      'Até 100 anúncios de imóveis',
      '20 Imóveis em Destaque (Spotlight)',
      'Gestão Centralizada de Agentes',
      'Rede de Imobiliárias',
      'Tours 360 Matterport Suportados'
    ]
  },
  {
    id: 'unlimited',
    name: 'Enterprise Premium',
    price: 9500,
    limit: 999999, // Unlimited
    description: 'Solução sem limites com posicionamento garantido.',
    features: [
      'Anúncios Ilimitados',
      '50 Imóveis em Destaque (Spotlight)',
      'Presença Exclusiva na secção Imobiliárias Premium',
      'Apoio Jurídico e Documental',
      'Gestor de Conta Dedicado'
    ]
  }
];

export const DEFAULT_PLAN_LIMIT = 5;

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
