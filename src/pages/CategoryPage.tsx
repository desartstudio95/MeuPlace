import { useParams } from 'react-router-dom';
import { PropertyCard } from '@/components/PropertyCard';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';

export function CategoryPage() {
  const { type } = useParams<{ type: string }>();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Normalize the type from URL to match category in data
  // e.g. "apartamento" -> "Apartamento"
  const categoryName = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '';
  
  // Handle special cases if needed (e.g. "armazem" -> "Armazém")
  const getCategoryFilter = (urlType: string) => {
    const normalized = urlType.toLowerCase();
    if (normalized === 'armazem') return 'Armazém';
    if (normalized === 'escritorio') return 'Escritório';
    return urlType.charAt(0).toUpperCase() + urlType.slice(1).toLowerCase();
  };

  const filterCategory = type ? getCategoryFilter(type) : '';

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'properties'), where('category', '==', filterCategory));
        const querySnapshot = await getDocs(q);
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });
        setFilteredProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    if (filterCategory) {
      fetchProperties();
    }
  }, [filterCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{filterCategory}s</h1>
        <p className="text-gray-600">
          Encontre {filterCategory.toLowerCase()}s disponíveis para venda e arrendamento.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">Carregando...</div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {filteredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum imóvel encontrado</h3>
          <p className="text-gray-500">
            Não encontramos imóveis nesta categoria no momento. Tente novamente mais tarde.
          </p>
        </div>
      )}
    </div>
  );
}
