import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property, LOCATIONS, CATEGORIES } from '@/types';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Link } from 'react-router-dom';
import { Bed, Bath, Square } from 'lucide-react';

// Fix Leaflet's default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const DEFAULT_CENTER: [number, number] = [-25.9692, 32.5732]; // Maputo

export function MapSearch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    fetchProperties();
  }, [activeCategory]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, 'properties'));
      
      if (activeCategory) {
        q = query(collection(db, 'properties'), where('category', '==', activeCategory));
      }

      const querySnapshot = await getDocs(q);
      const fetchedProps: Property[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isApproved && data.coordinates && data.coordinates.lat && data.coordinates.lng) {
          fetchedProps.push({ id: doc.id, ...data } as Property);
        }
      });
      setProperties(fetchedProps);
    } catch (error) {
      console.error("Error fetching properties for map:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && properties.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Map Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-4 overflow-x-auto">
        <select 
          className="p-2 border border-gray-300 rounded-md text-sm min-w-[150px]"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center text-sm text-gray-500">
          Mostrando {properties.length} imóveis com geolocalização no mapa.
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <ChangeView center={mapCenter} zoom={12} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {properties.map(property => (
            <Marker 
              key={property.id} 
              position={[property.coordinates!.lat, property.coordinates!.lng]}
            >
              <Popup className="property-popup">
                <div className="w-48">
                  <div className="h-32 mb-2 overflow-hidden rounded-md">
                    <img 
                      src={property.images && property.images[0] ? property.images[0] : 'https://placehold.co/400x300'} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate" title={property.title}>
                    {property.title}
                  </h3>
                  <p className="text-brand-purple font-bold mt-1 text-sm">
                    {property.price.toLocaleString()} {property.currency}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {property.bedrooms !== undefined && (
                      <div className="flex items-center gap-1"><Bed className="w-3 h-3"/> {property.bedrooms}</div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div className="flex items-center gap-1"><Bath className="w-3 h-3"/> {property.bathrooms}</div>
                    )}
                  </div>
                  
                  <Link 
                    to={`/properties/${property.id}`}
                    className="mt-3 block w-full text-center bg-brand-green hover:bg-brand-green-hover text-white py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    Ver Imóvel
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
