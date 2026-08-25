import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, Icons } from '../utils/icons';

const RESTAURANT_LOCATION = { lat: -33.499202, lng: -70.561227 };
const RESTAURANT_ADDRESS = "6957, Avenida Quilín, Villa Los Naranjos, Peñalolén, Provincia de Santiago, Región Metropolitana de Santiago, 7931136, Chile";

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryLat?: number;
  deliveryLng?: number;
  address: string;
  distance: number;
}

export default function DeliveryMapModal({
  isOpen,
  onClose,
  deliveryLat,
  deliveryLng,
  address,
  distance
}: DeliveryMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routingControl = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);

  // Obtener geometría de ruta desde OSRM
  const getRouteGeometry = async (lat: number, lng: number): Promise<any> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_LOCATION.lng},${RESTAURANT_LOCATION.lat};${lng},${lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry;
      }
      return null;
    } catch (error) {
      console.error('Error getting route geometry:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainer.current || !deliveryLat || !deliveryLng) return;

    setLoading(true);

    // Inicializar mapa
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView(
        [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lat],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);
    }

    // Agregar marcador del restaurante
    L.marker([RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    })
      .addTo(map.current)
      .bindPopup(`${RESTAURANT_ADDRESS}`);

    // Agregar marcador de entrega
    if (markerRef.current) {
      map.current.removeLayer(markerRef.current);
    }

    markerRef.current = L.marker([deliveryLat, deliveryLng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    })
      .addTo(map.current)
      .bindPopup(`Dirección de entrega<br>${address}`);

    // Dibujar ruta
    const drawRoute = async () => {
      const geometry = await getRouteGeometry(deliveryLat, deliveryLng);

      if (routingControl.current) {
        map.current!.removeLayer(routingControl.current);
      }

      if (geometry && geometry.coordinates) {
        const routeCoordinates = geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

        routingControl.current = L.polyline(routeCoordinates, {
          color: '#ff7800',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map.current!);

        // Ajustar zoom a la ruta
        const bounds = L.latLngBounds(
          [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng],
          [deliveryLat, deliveryLng]
        );
        map.current!.fitBounds(bounds, { padding: [50, 50] });
      }

      setLoading(false);
    };

    drawRoute();
  }, [isOpen, deliveryLat, deliveryLng, address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-orange-600 mb-2">Recorrido de Entrega</h2>
            <p className="text-gray-600 text-sm">{address}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Información */}
        <div className="px-6 pt-4 pb-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon icon={Icons.map} size="sm" className="text-orange-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">Distancia:</span> {distance.toFixed(2)} km
              </span>
            </div>
            {loading && (
              <div className="flex items-center gap-2">
                <Icon icon={Icons.spinner} size="sm" className="animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Cargando ruta...</span>
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div
          ref={mapContainer}
          className="flex-1 min-h-96 border border-gray-200"
          style={{ minHeight: '400px' }}
        />

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
