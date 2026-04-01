import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Privacy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().privacyContent) {
          setContent(docSnap.data().privacyContent);
        } else {
          setContent("Sua privacidade é importante para nós. Esta política explica como coletamos e usamos seus dados.\n\n1. Coleta de Dados\nColetamos informações como nome, email e telefone apenas quando você se cadastra ou entra em contato conosco.\n\n2. Uso de Cookies\nUtilizamos cookies para melhorar sua experiência de navegação e personalizar conteúdo.");
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
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
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
