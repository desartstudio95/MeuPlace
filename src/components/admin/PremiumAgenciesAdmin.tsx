import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNotifications } from '@/context/NotificationContext';
import { PremiumAgency } from '@/types';
import { Building2, Trash2, Edit2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

export function PremiumAgenciesAdmin() {
  const { addNotification } = useNotifications();
  const [agencies, setAgencies] = useState<PremiumAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Delete confirmation state
  const [agencyToDelete, setAgencyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const q = query(collection(db, 'premium_agencies'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedAgencies: PremiumAgency[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAgencies.push({ id: doc.id, ...doc.data() } as PremiumAgency);
      });
      setAgencies(fetchedAgencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      // Fallback if index doesn't exist yet
      try {
        const q2 = query(collection(db, 'premium_agencies'));
        const qs2 = await getDocs(q2);
        const fetched2: PremiumAgency[] = [];
        qs2.forEach((doc) => {
          fetched2.push({ id: doc.id, ...doc.data() } as PremiumAgency);
        });
        setAgencies(fetched2);
      } catch (e) {
        console.error("Fallback fetch failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `agency_logos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          addNotification({ title: 'Erro', message: 'Falha ao carregar o logotipo.', type: 'error' });
          setUploadingLogo(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setLogoUrl(downloadURL);
          setUploadingLogo(false);
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      setUploadingLogo(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLogoUrl('');
    setIsActive(true);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !logoUrl) {
      addNotification({ title: 'Aviso', message: 'Nome e Logotipo são obrigatórios.', type: 'info' });
      return;
    }

    try {
      if (editingId) {
        const agencyRef = doc(db, 'premium_agencies', editingId);
        await updateDoc(agencyRef, { name, logoUrl, isActive });
        addNotification({ title: 'Sucesso', message: 'Agência atualizada com sucesso.', type: 'success' });
      } else {
        await addDoc(collection(db, 'premium_agencies'), {
          name,
          logoUrl,
          isActive,
          order: agencies.length
        });
        addNotification({ title: 'Sucesso', message: 'Agência adicionada com sucesso.', type: 'success' });
      }
      fetchAgencies();
      resetForm();
    } catch (error) {
      console.error("Error saving agency:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível salvar a agência.', type: 'error' });
    }
  };

  const handleEdit = (agency: PremiumAgency) => {
    setName(agency.name);
    setLogoUrl(agency.logoUrl);
    setIsActive(agency.isActive);
    setEditingId(agency.id);
    setIsAdding(true);
  };

  const confirmDelete = async () => {
    if (!agencyToDelete) return;
    try {
      await deleteDoc(doc(db, 'premium_agencies', agencyToDelete));
      setAgencies(agencies.filter(a => a.id !== agencyToDelete));
      addNotification({ title: 'Sucesso', message: 'Agência excluída com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error deleting agency:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível excluir a agência.', type: 'error' });
    } finally {
      setAgencyToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setAgencyToDelete(id);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'premium_agencies', id), { isActive: !currentStatus });
      setAgencies(agencies.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-green" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Agências Premium</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-brand-green hover:bg-brand-green/90">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Agência
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Editar Agência' : 'Nova Agência'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Agência</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Remax Moçambique" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="h-16 w-32 bg-white border rounded flex items-center justify-center overflow-hidden p-2">
                    <img src={logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-16 w-32 bg-gray-100 border border-dashed rounded flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  {uploadingLogo && <p className="text-sm text-blue-600 mt-1">Carregando imagem...</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Agência Ativa (exibir na página inicial)</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-brand-green hover:bg-brand-green/90" disabled={uploadingLogo}>
                {editingId ? 'Salvar Alterações' : 'Adicionar Agência'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {agencies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma agência premium cadastrada.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {agencies.map((agency) => (
              <li key={agency.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-24 bg-white border rounded flex items-center justify-center overflow-hidden p-1">
                    <img src={agency.logoUrl} alt={agency.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{agency.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${agency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {agency.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(agency.id, agency.isActive)} title={agency.isActive ? "Desativar" : "Ativar"}>
                    {agency.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(agency)} className="text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(agency.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!agencyToDelete} onOpenChange={(open) => !open && setAgencyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta agência premium? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAgencyToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
