import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Property } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Fix for default marker icon missing in React-Leaflet
// We use a CDN for the icons to avoid bundler issues with the default assets
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when coordinates change
function RecenterAutomatically({ lat, lng, properties }: { lat: number, lng: number, properties?: Property[] }) {
  const map = useMap();
  useEffect(() => {
    // Keep the current zoom level, just pan to the new center
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, properties, map]);
  return null;
}

interface PropertyMapProps {
  properties?: Property[];
  height?: string;
  zoom?: number;
  onMarkerClick?: (propertyId: string) => void;
  highlightedPropertyId?: string;
}

export function PropertyMap({ properties, height = "500px", zoom = 5, onMarkerClick, highlightedPropertyId }: PropertyMapProps) {
  // Center of Mozambique
  const position: [number, number] = [-18.665695, 35.529562];

  // Calculate the center based on the average of all provided properties
  let center = position;
  if (properties && properties.length > 0) {
    const validProps = properties.filter(p => p.coordinates);
    if (validProps.length > 0) {
      const avgLat = validProps.reduce((sum, p) => sum + p.coordinates!.lat, 0) / validProps.length;
      const avgLng = validProps.reduce((sum, p) => sum + p.coordinates!.lng, 0) / validProps.length;
      center = [avgLat, avgLng];
    }
  }

  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-lg border border-gray-100 z-0 relative`} style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterAutomatically lat={center[0]} lng={center[1]} properties={properties} />
        
        {properties ? (
          properties.map(property => (
            property.coordinates && (
              <Marker 
                key={property.id} 
                position={[property.coordinates.lat, property.coordinates.lng]}
                eventHandlers={{
                  click: () => {
                    if (onMarkerClick) onMarkerClick(property.id);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <h3 className="font-bold text-sm mb-1">{property.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{property.location}</p>
                    <p className="text-brand-green font-bold text-sm mb-2">
                      {property.currency} {property.price.toLocaleString()}
                    </p>
                    <Link to={`/properties/${property.id}`}>
                      <Button size="sm" className="w-full text-xs h-8 bg-brand-green hover:bg-brand-green-hover">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            )
          ))
        ) : (
          <>
            {/* Default Markers for Home Page */}
            <Marker position={[-25.9692, 32.5732]}>
              <Popup>
                <div className="font-semibold">Maputo</div>
                <div className="text-sm text-gray-600">Capital - Grande oferta de imóveis</div>
              </Popup>
            </Marker>

            <Marker position={[-19.8316, 34.8383]}>
              <Popup>
                 <div className="font-semibold">Beira</div>
                 <div className="text-sm text-gray-600">Sofala - Oportunidades comerciais</div>
              </Popup>
            </Marker>

            <Marker position={[-15.1158, 39.2676]}>
              <Popup>
                 <div className="font-semibold">Nampula</div>
                 <div className="text-sm text-gray-600">Norte - Crescimento urbano</div>
              </Popup>
            </Marker>

            <Marker position={[-12.9732, 40.5178]}>
              <Popup>
                 <div className="font-semibold">Pemba</div>
                 <div className="text-sm text-gray-600">Cabo Delgado - Turismo e Investimento</div>
              </Popup>
            </Marker>

            <Marker position={[-16.1564, 33.5863]}>
              <Popup>
                 <div className="font-semibold">Tete</div>
                 <div className="text-sm text-gray-600">Centro - Polo industrial</div>
              </Popup>
            </Marker>
          </>
        )}

      </MapContainer>
    </div>
  );
}
