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
    name: 'Grátis',
    price: 0,
    limit: 5,
    description: 'Comece a anunciar seus imóveis gratuitamente.',
    features: [
      'Até 5 anúncios de imóveis',
      'Suporte básico',
      'Visibilidade padrão'
    ]
  },
  {
    id: 'basic',
    name: 'Plano 1',
    price: 300,
    limit: 10,
    description: 'Para agentes individuais que precisam de mais espaço.',
    features: [
      'Até 10 anúncios de imóveis',
      'Suporte prioritário',
      'Visibilidade aumentada'
    ]
  },
  {
    id: 'professional',
    name: 'Plano 2',
    price: 700,
    limit: 20,
    description: 'Ideal para agentes em crescimento.',
    features: [
      'Até 20 anúncios de imóveis',
      'Suporte prioritário',
      'Selo de verificação',
      'Estatísticas detalhadas'
    ]
  },
  {
    id: 'business',
    name: 'Plano 3',
    price: 1200,
    limit: 30,
    description: 'Para agências que buscam resultados consistentes.',
    features: [
      'Até 30 anúncios de imóveis',
      'Suporte 24/7',
      'Destaque nos resultados de busca',
      'Gestão de equipe básica'
    ]
  },
  {
    id: 'unlimited',
    name: 'Plano Premium / Ilimitado',
    price: 2500,
    limit: 999999, // Unlimited
    description: 'A solução definitiva para grandes agências.',
    features: [
      'Anúncios ilimitados',
      'Acesso à secção Imobiliárias Premium',
      'Gerente de conta dedicado',
      'Máxima visibilidade em toda a plataforma',
      'Exportação de relatórios'
    ]
  }
];

export const DEFAULT_PLAN_LIMIT = 5;
