import React, { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trash2, Edit2, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminProperties() {
  const { properties, loading, approveProperty, deleteProperty } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Carregando...</div>;
  }

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = async () => {
    if (propertyToDelete) {
      await deleteProperty(propertyToDelete);
      setPropertyToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Imóveis</h1>
        <Link to="/add-property">
          <Button className="bg-brand-green hover:bg-brand-green/90">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Imóvel
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-brand-green focus:border-brand-green block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Buscar imóveis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imóvel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aprovação
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-md object-cover" src={property.images[0]} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.price.toLocaleString()} {property.currency}</div>
                    <div className="text-sm text-gray-500">{property.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${property.status === 'Disponível' ? 'bg-green-100 text-green-800' : 
                        property.status === 'Vendido' ? 'bg-gray-100 text-gray-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {property.isApproved ? (
                      <span className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprovado
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-yellow-600">
                        <XCircle className="h-4 w-4 mr-1" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {!property.isApproved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => approveProperty(property.id)}
                          title="Aprovar Imóvel"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Link to={`/edit-property/${property.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => setPropertyToDelete(property.id)}
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProperties.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum imóvel encontrado.
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Imóvel</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropertyToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
