import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNotifications } from '@/context/NotificationContext';
import { Trash2, Edit2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export interface FeaturedAgent {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
  propertiesSold: number;
  agency: string;
  order?: number;
}

export function FeaturedAgentsAdmin() {
  const { addNotification } = useNotifications();
  const [agents, setAgents] = useState<FeaturedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [rating, setRating] = useState<number>(5.0);
  const [reviews, setReviews] = useState<number>(0);
  const [propertiesSold, setPropertiesSold] = useState<number>(0);
  const [agency, setAgency] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete confirmation state
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const q = query(collection(db, 'featured_agents'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedAgents: FeaturedAgent[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAgents.push({ id: doc.id, ...doc.data() } as FeaturedAgent);
      });
      setAgents(fetchedAgents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      try {
        const q2 = query(collection(db, 'featured_agents'));
        const qs2 = await getDocs(q2);
        const fetched2: FeaturedAgent[] = [];
        qs2.forEach((doc) => {
          fetched2.push({ id: doc.id, ...doc.data() } as FeaturedAgent);
        });
        setAgents(fetched2);
      } catch (e) {
        console.error("Fallback fetch failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `agent_avatars/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          addNotification({ title: 'Erro', message: 'Falha ao carregar a imagem.', type: 'error' });
          setUploadingImage(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setAvatar(downloadURL);
          setUploadingImage(false);
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAvatar('');
    setRating(5.0);
    setReviews(0);
    setPropertiesSold(0);
    setAgency('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !avatar) {
      addNotification({ title: 'Aviso', message: 'Nome e Imagem são obrigatórios.', type: 'info' });
      return;
    }

    try {
      if (editingId) {
        const agentRef = doc(db, 'featured_agents', editingId);
        await updateDoc(agentRef, { name, avatar, rating, reviews, propertiesSold, agency });
        addNotification({ title: 'Sucesso', message: 'Agente atualizado com sucesso.', type: 'success' });
      } else {
        await addDoc(collection(db, 'featured_agents'), {
          name,
          avatar,
          rating,
          reviews,
          propertiesSold,
          agency,
          order: agents.length
        });
        addNotification({ title: 'Sucesso', message: 'Agente adicionado com sucesso.', type: 'success' });
      }
      fetchAgents();
      resetForm();
    } catch (error) {
      console.error("Error saving agent:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível salvar o agente.', type: 'error' });
    }
  };

  const handleEdit = (agent: FeaturedAgent) => {
    setName(agent.name);
    setAvatar(agent.avatar);
    setRating(agent.rating);
    setReviews(agent.reviews);
    setPropertiesSold(agent.propertiesSold);
    setAgency(agent.agency);
    setEditingId(agent.id);
    setIsAdding(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    try {
      await deleteDoc(doc(db, 'featured_agents', agentToDelete));
      setAgents(agents.filter(a => a.id !== agentToDelete));
      addNotification({ title: 'Sucesso', message: 'Agente excluído com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error deleting agent:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível excluir o agente.', type: 'error' });
    } finally {
      setAgentToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setAgentToDelete(id);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Agentes em Destaque</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-brand-green hover:bg-brand-green/90">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Agente
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Editar Agente' : 'Novo Agente'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Agente</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                <Input value={agency} onChange={(e) => setAgency(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação (Estrelas)</label>
                <Input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Avaliações</label>
                <Input type="number" min="0" value={reviews} onChange={(e) => setReviews(parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imóveis Vendidos</label>
                <Input type="number" min="0" value={propertiesSold} onChange={(e) => setPropertiesSold(parseInt(e.target.value))} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem (Avatar)</label>
              <div className="flex items-center gap-4">
                {avatar ? (
                  <div className="h-16 w-16 bg-white border rounded-full flex items-center justify-center overflow-hidden p-1">
                    <img src={avatar} alt="Avatar preview" className="max-h-full max-w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-100 border border-dashed rounded-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} disabled={uploadingImage} />
                  {uploadingImage && <p className="text-sm text-blue-600 mt-1">Carregando imagem...</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-brand-green hover:bg-brand-green/90" disabled={uploadingImage}>
                {editingId ? 'Salvar Alterações' : 'Adicionar Agente'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {agents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum agente em destaque cadastrado.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <li key={agent.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white border rounded-full flex items-center justify-center overflow-hidden p-1">
                    <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{agent.name}</h4>
                    <span className="text-sm text-gray-500">{agent.agency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(agent)} className="text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(agent.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este agente em destaque? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAgentToDelete(null)}>
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
