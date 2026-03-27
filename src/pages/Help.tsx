import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, FileText, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([
    {
      question: "Como posso anunciar um imóvel no MeuPlace?",
      answer: "Para anunciar um imóvel, primeiro você precisa criar uma conta como Agente ou Agência. Após fazer o login e ter a sua conta aprovada, clique no botão 'Anunciar Imóvel' no menu superior. Preencha todos os detalhes do imóvel, adicione fotos de boa qualidade e publique o seu anúncio."
    },
    {
      question: "Quais são os planos de divulgação disponíveis?",
      answer: "Oferecemos diferentes planos para atender às suas necessidades:\n\n• Plano Gratuito: Permite a publicação de um número limitado de anúncios básicos.\n• Plano Premium: Oferece maior destaque nos resultados de pesquisa, selo de 'Imóvel Promovido' e estatísticas detalhadas de visualizações.\n• Plano Agência: Ideal para empresas com grande volume de imóveis, inclui gestão de múltiplos agentes e suporte prioritário."
    },
    {
      question: "Como funciona o processo de compra ou arrendamento?",
      answer: "O MeuPlace atua como uma plataforma de conexão entre quem procura e quem oferece imóveis. Ao encontrar um imóvel do seu interesse, você deve entrar em contacto diretamente com o agente responsável através do WhatsApp, telefone ou formulário de mensagem na página do imóvel. Todo o processo de negociação, visitas e fecho de contrato é feito diretamente entre você e o agente/proprietário."
    },
    {
      question: "É seguro negociar os imóveis listados na plataforma?",
      answer: "Trabalhamos arduamente para verificar todos os agentes e agências registados na nossa plataforma (procure pelo selo de 'Agente Verificado'). No entanto, recomendamos sempre que visite o imóvel pessoalmente, não faça pagamentos antecipados sem assinar um contrato válido e verifique toda a documentação antes de fechar qualquer negócio."
    },
    {
      question: "Como posso editar ou remover o meu anúncio?",
      answer: "Acesse o seu 'Painel do Agente' (Dashboard), vá até a aba 'Meus Imóveis', encontre o imóvel que deseja alterar e clique nos botões de editar ou excluir correspondentes."
    }
  ]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().helpFaqs) {
          setFaqs(docSnap.data().helpFaqs);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-brand-green text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Como podemos ajudar?</h1>
          <p className="text-brand-green-light text-lg mb-8">
            Pesquise na nossa base de conhecimento ou explore as perguntas frequentes abaixo.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Ex: Como anunciar um imóvel..." 
              className="w-full pl-12 pr-4 py-6 rounded-full text-gray-900 text-lg shadow-lg focus-visible:ring-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 -mt-20 relative z-10">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 p-3 rounded-full mb-4 text-blue-600">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Para Compradores</h3>
            <p className="text-sm text-gray-500 mb-4">Dicas para encontrar e negociar o seu novo lar.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="bg-brand-green/10 p-3 rounded-full mb-4 text-brand-green">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Para Agentes</h3>
            <p className="text-sm text-gray-500 mb-4">Como gerir os seus anúncios e destacar-se.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 p-3 rounded-full mb-4 text-brand-purple">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Fale Connosco</h3>
            <p className="text-sm text-gray-500 mb-4">Precisa de ajuda adicional? Entre em contacto.</p>
            <Link to="/contact" className="text-brand-green font-medium text-sm hover:underline mt-auto">
              Enviar Mensagem
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-900">Perguntas Frequentes (FAQ)</h2>
            <p className="text-gray-500 mt-2">Respostas rápidas para as dúvidas mais comuns dos nossos utilizadores.</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div key={index} className="p-2">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-50 rounded-xl transition-colors focus:outline-none"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-brand-green flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {openFaq === index && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 text-gray-600 leading-relaxed whitespace-pre-line animate-in slide-in-from-top-2 duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhuma pergunta encontrada para "{searchQuery}".
              </div>
            )}
          </div>
        </div>
        
        {/* Still need help */}
        <div className="mt-12 text-center bg-brand-green/5 rounded-2xl p-8 border border-brand-green/10">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ainda tem dúvidas?</h3>
          <p className="text-gray-600 mb-6">A nossa equipa de suporte está pronta para ajudar com qualquer questão adicional.</p>
          <Link to="/contact">
            <Button className="bg-brand-green hover:bg-brand-green-hover text-white px-8">
              Contactar Suporte
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
