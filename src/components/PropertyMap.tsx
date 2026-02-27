import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export function PropertyMap() {
  // Center of Mozambique
  const position: [number, number] = [-18.665695, 35.529562];

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-100 z-0 relative">
      <MapContainer 
        center={position} 
        zoom={5} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Maputo */}
        <Marker position={[-25.9692, 32.5732]}>
          <Popup>
            <div className="font-semibold">Maputo</div>
            <div className="text-sm text-gray-600">Capital - Grande oferta de imóveis</div>
          </Popup>
        </Marker>

        {/* Beira */}
        <Marker position={[-19.8316, 34.8383]}>
          <Popup>
             <div className="font-semibold">Beira</div>
             <div className="text-sm text-gray-600">Sofala - Oportunidades comerciais</div>
          </Popup>
        </Marker>

        {/* Nampula */}
        <Marker position={[-15.1158, 39.2676]}>
          <Popup>
             <div className="font-semibold">Nampula</div>
             <div className="text-sm text-gray-600">Norte - Crescimento urbano</div>
          </Popup>
        </Marker>

        {/* Pemba */}
        <Marker position={[-12.9732, 40.5178]}>
          <Popup>
             <div className="font-semibold">Pemba</div>
             <div className="text-sm text-gray-600">Cabo Delgado - Turismo e Investimento</div>
          </Popup>
        </Marker>

        {/* Tete */}
        <Marker position={[-16.1564, 33.5863]}>
          <Popup>
             <div className="font-semibold">Tete</div>
             <div className="text-sm text-gray-600">Centro - Polo industrial</div>
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}
