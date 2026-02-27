import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LOCATIONS, CATEGORIES, Property } from '@/types';
import { PROPERTIES } from '@/data/mockData';
import { Upload, Save, ArrowLeft, Trash2 } from 'lucide-react';

export function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Property>>({});

  useEffect(() => {
    // Simulate fetching data
    const property = PROPERTIES.find(p => p.id === id);
    if (property) {
      setFormData(property);
    } else {
      // Handle not found
      alert('Imóvel não encontrado');
      navigate('/dashboard');
    }
    setIsLoading(false);
  }, [id, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simulate API call
    alert('Imóvel atualizado com sucesso!');
    navigate('/dashboard');
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) {
      alert('Imóvel excluído com sucesso!');
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Imóvel</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Imóvel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Basic Info */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Anúncio</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negócio</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option>Venda</option>
                <option>Arrendamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as any})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço ({formData.currency})</label>
              <Input 
                type="number" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea 
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </section>

        {/* Location & Details */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Localização e Detalhes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.location?.split(',')[1]?.trim() || ''} // Simple heuristic for demo
                onChange={(e) => {
                  // Complex logic to update location string would go here
                  // For demo, just updating the state loosely
                }}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <Input 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
              <Input 
                type="number" 
                min="0" 
                value={formData.bedrooms} 
                onChange={(e) => setFormData({...formData, bedrooms: Number(e.target.value)})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
              <Input 
                type="number" 
                min="0" 
                value={formData.bathrooms} 
                onChange={(e) => setFormData({...formData, bathrooms: Number(e.target.value)})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
              <Input 
                type="number" 
                min="0" 
                value={formData.area} 
                onChange={(e) => setFormData({...formData, area: Number(e.target.value)})} 
              />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Fotos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images?.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newImages = formData.images?.filter((_, i) => i !== idx);
                    setFormData({...formData, images: newImages});
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-xs">Adicionar Foto</span>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-6 border-t border-gray-100 gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
