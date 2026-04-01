import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/context/NotificationContext';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AdminPages() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [pages, setPages] = useState({
    helpFaqs: [
      {
        question: "Como posso anunciar um imóvel no MeuPlace?",
        answer: "Para anunciar um imóvel, primeiro você precisa criar uma conta como Agente ou Agência. Após fazer o login e ter a sua conta aprovada, clique no botão 'Anunciar Imóvel' no menu superior. Preencha todos os detalhes do imóvel, adicione fotos de boa qualidade e publique o seu anúncio."
      }
    ],
    termsContent: "Bem-vindo ao MeuPlace. Ao utilizar nosso site, você concorda com os seguintes termos e condições:\n\n1. Uso do Serviço\nO MeuPlace é uma plataforma que conecta anunciantes e interessados em imóveis. Não somos responsáveis pelas transações realizadas.\n\n2. Responsabilidade do Anunciante\nOs anunciantes são responsáveis pela veracidade das informações e imagens publicadas.",
    privacyContent: "A sua privacidade é importante para nós. Esta Política de Privacidade explica como recolhemos, usamos e protegemos as suas informações pessoais.\n\n1. Informações que Recolhemos\nRecolhemos informações que você nos fornece diretamente, como nome, email e telefone ao criar uma conta ou contactar um agente.\n\n2. Como Usamos as Informações\nUsamos as suas informações para fornecer, manter e melhorar os nossos serviços, bem como para comunicar consigo.",
    contactPhone: "+258 84 123 4567",
    contactEmail: "contacto@meuplace.co.mz",
    contactAddress: "Maputo, Moçambique",
    contactHours: "Segunda a Sexta, 8h às 18h"
  });

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPages(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pages'), pages);
      addNotification({ title: 'Sucesso', message: 'Páginas salvas com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error saving pages:", error);
      addNotification({ title: 'Erro', message: 'Falha ao salvar páginas.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = () => {
    setPages(prev => ({
      ...prev,
      helpFaqs: [...prev.helpFaqs, { question: '', answer: '' }]
    }));
  };

  const handleRemoveFaq = (index: number) => {
    setPages(prev => ({
      ...prev,
      helpFaqs: prev.helpFaqs.filter((_, i) => i !== index)
    }));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setPages(prev => {
      const newFaqs = [...prev.helpFaqs];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, helpFaqs: newFaqs };
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Páginas Estáticas</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Help (FAQ) */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Página de Ajuda (FAQ)</h2>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
            <div className="space-y-4">
              {pages.helpFaqs.map((faq, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveFaq(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-3 pr-10">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta</label>
                      <Input 
                        value={faq.question} 
                        onChange={e => handleFaqChange(index, 'question', e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resposta</label>
                      <textarea 
                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green"
                        value={faq.answer} 
                        onChange={e => handleFaqChange(index, 'answer', e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Termos de Uso</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (Texto ou Markdown)</label>
              <textarea 
                className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green"
                value={pages.termsContent} 
                onChange={e => setPages({...pages, termsContent: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Política de Privacidade</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (Texto ou Markdown)</label>
              <textarea 
                className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green"
                value={pages.privacyContent} 
                onChange={e => setPages({...pages, privacyContent: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Página de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <Input 
                  value={pages.contactPhone} 
                  onChange={e => setPages({...pages, contactPhone: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input 
                  value={pages.contactEmail} 
                  onChange={e => setPages({...pages, contactEmail: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <Input 
                  value={pages.contactAddress} 
                  onChange={e => setPages({...pages, contactAddress: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Funcionamento</label>
                <Input 
                  value={pages.contactHours} 
                  onChange={e => setPages({...pages, contactHours: e.target.value})} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover" disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
