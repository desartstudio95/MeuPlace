import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Terms() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().termsContent) {
          setContent(docSnap.data().termsContent);
        } else {
          setContent("Bem-vindo ao MeuPlace. Ao utilizar nosso site, você concorda com os seguintes termos e condições:\n\n1. Uso do Serviço\nO MeuPlace é uma plataforma que conecta anunciantes e interessados em imóveis. Não somos responsáveis pelas transações realizadas.\n\n2. Responsabilidade do Anunciante\nOs anunciantes são responsáveis pela veracidade das informações e imagens publicadas.");
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
