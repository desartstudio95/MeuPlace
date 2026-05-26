import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import { Database, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const mockProperties = [
  {
    title: 'Mansão Contemporânea Sommerschield II',
    description: 'Espetacular mansão de arquitetura contemporânea com acabamentos importados de Itália. Sala de estar com pé direito duplo, piscina de borda infinita aquecida, ginásio privativo e sala de cinema. Sistema de automação total (Smart Home).',
    price: 150000000,
    currency: 'MZN',
    location: 'Maputo',
    type: 'Venda',
    status: 'Disponível',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop'
    ],
    category: 'Vivenda',
    bedrooms: 6,
    bathrooms: 8,
    area: 950,
    features: ['Piscina Borda Infinita', 'Smart Home', 'Ginásio', 'Cinema', 'Adega', 'Garagem p/ 5 Carros', 'Segurança 24h'],
    isApproved: true,
  },
  {
    title: 'Cobertura Triplex de Luxo na Polana',
    description: 'Penthouse exclusiva no coração da Polana, oferecendo vista panorâmica de 360 graus para a Baía de Maputo. Inclui terraço privado com jacuzzi, área gourmet e elevador de acesso direto aos três pisos.',
    price: 250000,
    currency: 'MZN',
    location: 'Maputo',
    type: 'Arrendamento',
    status: 'Disponível',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1f5523a54a?q=80&w=1980&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'
    ],
    category: 'Apartamento',
    bedrooms: 4,
    bathrooms: 5,
    area: 420,
    features: ['Vista Mar 360º', 'Jacuzzi Privado', 'Elevador Exclusivo', 'Área Gourmet', 'Cozinha de Chef'],
    isApproved: true,
  },
  {
    title: 'Eco-Villa Frente ao Mar em Ponta do Ouro',
    description: 'Refúgio sustentável desenhado para integração perfeita com a natureza. Acesso privado direto a uma das praias mais exclusivas, energia 100% solar, deck de madeira de lei e chuveiros ao ar livre nas suítes.',
    price: 85000000,
    currency: 'MZN',
    location: 'Ponta do Ouro',
    type: 'Venda',
    status: 'Disponível',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop'
    ],
    category: 'Vivenda',
    bedrooms: 5,
    bathrooms: 5,
    area: 600,
    features: ['Acesso Privado à Praia', '100% Energia Solar', 'Deck Panorâmico', 'Design Ecológico', 'Zonas Verdes Privadas'],
    isApproved: true,
  },
  {
    title: 'Propriedade Equestre Premium Matola Rio',
    description: 'Extraordinária herdade com estábulos profissionais, picadeiro coberto, campos verdes extensos e uma casa principal estilo quinta rústica europeia. Ideal para amantes da equitação e natureza.',
    price: 120000000,
    currency: 'MZN',
    location: 'Matola Rio',
    type: 'Venda',
    status: 'Disponível',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588656108151-53696fbabe5a?q=80&w=2080&auto=format&fit=crop'
    ],
    category: 'Quinta',
    bedrooms: 5,
    bathrooms: 6,
    area: 15000,
    features: ['Estábulos', 'Picadeiro Coberto', 'Arborização Abundante', 'Trilhos Privados', 'Casa de Hóspedes'],
    isApproved: true,
  }
];

const mockResorts = [
  {
    name: 'Coral Reef Sanctuary Resort',
    location: 'Bazaruto',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop',
    rating: 5.0,
    price: 'Sob Consulta',
    description: 'Um santuário costeiro inigualável, oferecendo villas erguidas sobre palafitas nas águas turquesas. Refeições Michelin preparadas com o catch-of-the-day e mordomo privado 24/7.',
    amenities: ['Villas sobre a Água', 'Heliporto', 'Mordomo Privado', 'Mergulho de Profundidade', 'Spa Holístico'],
    contact: {
      phone: '+258 84 999 9999',
      email: 'concierge@coralreef.co.mz',
      website: 'www.coralreef.co.mz'
    },
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop'
    ]
  },
  {
    name: 'The Crown Imperial Hotel',
    location: 'Maputo',
    image: 'https://images.unsplash.com/photo-1542314831-c6a4a15a81e9?q=80&w=2025&auto=format&fit=crop',
    rating: 4.9,
    price: 'A partir de 18.000 MZN/noite',
    description: 'O ícone máximo de sofisticação executiva na capital. O The Crown abriga o salão de baile mais majestoso do país e uma adega subterrânea premiada. Foco extremo em privacidade.',
    amenities: ['Centro de Conferências', 'Piscina Panorâmica', 'Adega Premiada', 'Serviço de Limousine', 'Ginásio Premium'],
    contact: {
      phone: '+258 82 000 8888',
      email: 'reservations@thecrown.co.mz',
      website: 'www.thecrown.co.mz'
    },
    gallery: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=1974&auto=format&fit=crop'
    ]
  },
  {
    name: 'Baobab Wilderness Lodge',
    location: 'Vilanculos',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop',
    rating: 4.8,
    price: 'Pacotes All-Inclusive Ouro',
    description: 'Lodge sustentável e selvagem, concebido à volta de baobás milenares. Safáris exclusivos, cruzeiros num dhow tradicional e pernoitas sob um céu estrelado espetacular.',
    amenities: ['Safári Exclusivo', 'Cruzeiro em Dhow', 'Cozinha de Fogo Aberto', 'Guia Especializado', 'Zero Plastic Certaided'],
    contact: {
      phone: '+258 86 123 4567',
      email: 'wild@baobablodge.co.mz',
      website: 'www.baobablodge.co.mz'
    },
    gallery: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2187&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=2074&auto=format&fit=crop'
    ]
  }
];

export function MockDataAdmin() {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateMockData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const defaultAgentInfo = {
        name: 'Mock Agent',
        email: currentUser.email || 'mock@agent.com',
        phone: '+258 80 000 0000',
        whatsapp: '+258 80 000 0000',
      };

      // Add properties
      for (const property of mockProperties) {
        await addDoc(collection(db, 'properties'), {
          ...property,
          agentId: currentUser.uid,
          agent: defaultAgentInfo,
          createdAt: serverTimestamp()
        });
      }

      // Add resorts/hotels
      for (const resort of mockResorts) {
        await addDoc(collection(db, 'resorts'), {
          ...resort,
          createdAt: serverTimestamp()
        });
      }

      addNotification({
        title: 'Sucesso',
        message: 'Foram gerados imóveis, resorts e hotéis de teste.',
        type: 'success'
      });
      
    } catch (error) {
      console.error("Error generating mock data", error);
      addNotification({
        title: 'Erro',
        message: 'Falha ao gerar dados de teste.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-brand-purple" />
        <h2 className="text-xl font-semibold text-gray-900">Gerador de Dados (Mock)</h2>
      </div>
      <p className="text-gray-600 mb-6">
        Utilize esta ferramenta para injetar imóveis, resorts e hotéis de demonstração na plataforma. Ideal para apresentações a investidores e parceiros.
      </p>
      
      <Button 
        onClick={generateMockData} 
        disabled={loading}
        className="bg-brand-purple hover:bg-brand-purple-hover text-white flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
        <span>{loading ? 'A injetar dados...' : 'Gerar Imóveis e Resorts de Demonstração'}</span>
      </Button>
    </div>
  );
}
