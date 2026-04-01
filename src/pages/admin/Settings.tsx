import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export function AdminSettings() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    headerLogo: 'https://i.ibb.co/yBVKb9hJ/Logotipo-para-corretora-de-im-veis-preto-e-bege-simples-Website.png',
    heroImage: 'https://i.ibb.co/9HtKhj7v/Chat-GPT-Image-Mar-5-2026-10-33-16-AM.png',
    heroTitle: 'O Maior Shopping de imóveis em Moçambique',
    heroSubtitle: 'A forma mais simples e segura de comprar, vender ou arrendar o teu place.',
    featuredAgentsTitle: 'Nossos Agentes em Destaque',
    featuredAgentsSubtitle: 'Profissionais experientes prontos para ajudar a encontrar o seu imóvel ideal.',
    contactEmail: 'contacto@desartstudio.com',
    contactPhone: '+258 84 123 4567',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    linkedinUrl: 'https://linkedin.com',
    maintenanceMode: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const path = 'settings/general';
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDocFromServer(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const path = 'settings/general';
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      addNotification({ title: 'Sucesso', message: 'Configurações salvas com sucesso.', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      addNotification({ title: 'Erro', message: 'Falha ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Site</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Cabeçalho (Header)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logotipo</label>
                <Input 
                  value={settings.headerLogo} 
                  onChange={e => setSettings({...settings, headerLogo: e.target.value})} 
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Página Inicial (Hero)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo (URL)</label>
                <Input 
                  value={settings.heroImage} 
                  onChange={e => setSettings({...settings, heroImage: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
                <Input 
                  value={settings.heroTitle} 
                  onChange={e => setSettings({...settings, heroTitle: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-brand-green focus:border-brand-green" 
                  rows={3}
                  value={settings.heroSubtitle} 
                  onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} 
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Secção de Agentes em Destaque</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <Input 
                  value={settings.featuredAgentsTitle} 
                  onChange={e => setSettings({...settings, featuredAgentsTitle: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-brand-green focus:border-brand-green" 
                  rows={2}
                  value={settings.featuredAgentsSubtitle} 
                  onChange={e => setSettings({...settings, featuredAgentsSubtitle: e.target.value})} 
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contactos e Redes Sociais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                <Input 
                  type="email"
                  value={settings.contactEmail} 
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contacto</label>
                <Input 
                  value={settings.contactPhone} 
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                <Input 
                  type="url"
                  value={settings.facebookUrl} 
                  onChange={e => setSettings({...settings, facebookUrl: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <Input 
                  type="url"
                  value={settings.instagramUrl} 
                  onChange={e => setSettings({...settings, instagramUrl: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <Input 
                  type="url"
                  value={settings.linkedinUrl} 
                  onChange={e => setSettings({...settings, linkedinUrl: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Sistema</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Modo de Manutenção</h3>
                  <p className="text-sm text-gray-500">Ative para bloquear o acesso público ao site. Apenas administradores poderão acessar.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-brand-green hover:bg-brand-green/90" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
