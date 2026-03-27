import React, { useState } from 'react';
import { useResorts } from '@/hooks/useResorts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Plus, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resort } from '@/types';

export function AdminResorts() {
  const { resorts, loading, createResort, updateResort, deleteResort } = useResorts();
  const [searchTerm, setSearchTerm] = useState('');
  const [resortToDelete, setResortToDelete] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Resort, 'id'>>({
    name: '',
    location: '',
    image: '',
    rating: 5,
    price: '',
    description: '',
    amenities: [],
    contact: { phone: '', email: '', website: '' },
    gallery: []
  });

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>;
  }

  const filteredResorts = resorts.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = async () => {
    if (resortToDelete) {
      await deleteResort(resortToDelete);
      setResortToDelete(null);
    }
  };

  const handleEdit = (resort: Resort) => {
    setFormData({
      name: resort.name,
      location: resort.location,
      image: resort.image,
      rating: resort.rating,
      price: resort.price,
      description: resort.description,
      amenities: resort.amenities || [],
      contact: resort.contact || { phone: '', email: '', website: '' },
      gallery: resort.gallery || []
    });
    setEditingId(resort.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      image: '',
      rating: 5,
      price: '',
      description: '',
      amenities: [],
      contact: { phone: '', email: '', website: '' },
      gallery: []
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateResort(editingId, formData);
    } else {
      await createResort(formData);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Resorts e Hotéis</h1>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar Resort' : 'Novo Resort'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (ex: 15,000 MZN)</label>
                <Input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem Principal (URL)</label>
                <Input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-brand-green focus:border-brand-green" 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <Input value={formData.contact.phone} onChange={e => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" value={formData.contact.email} onChange={e => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <Input value={formData.contact.website} onChange={e => setFormData({...formData, contact: {...formData.contact, website: e.target.value}})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comodidades (separadas por vírgula)</label>
                <Input 
                  value={formData.amenities.join(', ')} 
                  onChange={e => setFormData({...formData, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                  placeholder="Piscina, Spa, Wi-Fi"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Galeria de Imagens (URLs separadas por vírgula)</label>
                <Input 
                  value={formData.gallery.join(', ')} 
                  onChange={e => setFormData({...formData, gallery: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                  placeholder="https://img1.jpg, https://img2.jpg"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-brand-green hover:bg-brand-green/90">
                {editingId ? 'Salvar Alterações' : 'Criar Resort'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-brand-green focus:border-brand-green block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Buscar resorts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resort</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResorts.map((resort) => (
                <tr key={resort.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-md object-cover" src={resort.image} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{resort.name}</div>
                        <div className="text-sm text-gray-500">{resort.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{resort.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 hover:bg-blue-50" onClick={() => handleEdit(resort)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900 hover:bg-red-50" onClick={() => setResortToDelete(resort.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredResorts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum resort encontrado.
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!resortToDelete} onOpenChange={(open) => !open && setResortToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Resort</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este resort? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResortToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
