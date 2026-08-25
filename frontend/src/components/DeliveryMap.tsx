import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, Icons } from '../utils/icons';

interface DeliveryMapProps {
  onLocationSelect: (lat: number, lng: number, distance: number, deliveryFee: number, address: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

const RESTAURANT_LOCATION = { lat: -33.499202, lng: -70.561227 };
const RESTAURANT_ADDRESS = "6957, Avenida Quilín, Villa Los Naranjos, Peñalolén, Provincia de Santiago, Región Metropolitana de Santiago, 7931136, Chile";
const MAX_DELIVERY_DISTANCE = 4; // km - Distancia máxima permitida
const MAX_DELIVERY_DISTANCE_VISUAL = 3.9; // km - Radio visual más pequeño para evitar problemas en la frontera
const MAX_DELIVERY_DISTANCE_WARNING = 3.85; // km - Mostrar advertencia si está entre 3.85-4 km
const BASE_DELIVERY_FEE = 2000; // CLP hasta 1.5 km
const BASE_DELIVERY_THRESHOLD = 1.5; // km
const ADDITIONAL_FEE_STEP = 0.13; // 130 metros
const ADDITIONAL_FEE_AMOUNT = 200; // CLP

export default function DeliveryMap({ onLocationSelect, onValidityChange }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(false);
  const [isWarningZone, setIsWarningZone] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const routingControl = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    if (map.current) return; // Already initialized

    try {
      map.current = L.map(mapContainer.current).setView(
        [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      // Marcador del restaurante
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

      // Círculo de cobertura visual (4.8 km - menor que 5 km para evitar problemas en la frontera)
      circleRef.current = L.circle([RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], {
        radius: MAX_DELIVERY_DISTANCE_VISUAL * 1000, // convertir a metros (4.8 km)
        color: '#ff7800',
        fill: true,
        fillColor: '#ff7800',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map.current);

      // Click en mapa para seleccionar ubicación
      map.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        selectDeliveryLocation(lat, lng);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      // Limpiar timeout de búsqueda si existe
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Calcular tarifa: $2000 hasta 1.5km, después $200 cada 130m
  const calculateDeliveryFee = (distanceKm: number): number => {
    if (distanceKm <= 0) return 0;

    if (distanceKm <= BASE_DELIVERY_THRESHOLD) {
      return BASE_DELIVERY_FEE;
    }

    const additionalDistance = distanceKm - BASE_DELIVERY_THRESHOLD;
    const additionalSteps = Math.ceil(additionalDistance / ADDITIONAL_FEE_STEP);
    const additionalFee = additionalSteps * ADDITIONAL_FEE_AMOUNT;

    return BASE_DELIVERY_FEE + additionalFee;
  };

  // Buscar dirección por texto con debounce
  const searchAddressByText = (text: string) => {
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si el texto es muy corto, no buscar
    if (text.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Establecer nuevo timeout para debounce (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=8&countrycodes=cl`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch (error) {
        console.error('Error searching address:', error);
        setSearchResults([]);
      }
    }, 300); // Esperar 300ms después de que el usuario deje de escribir
  };

  // Seleccionar resultado de búsqueda
  const selectSearchResult = (result: any) => {
    selectDeliveryLocation(parseFloat(result.lat), parseFloat(result.lon));
    setSearchAddress(result.display_name);
    setShowResults(false);
  };

  // Obtener dirección desde coordenadas usando Nominatim (gratuito)
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.address?.road || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Obtener distancia real y geometría de ruta desde OSRM (servicio gratuito)
  const getRouteDistance = async (lat: number, lng: number): Promise<{ distance: number | null; geometry: any }> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_LOCATION.lng},${RESTAURANT_LOCATION.lat};${lng},${lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const distanceMeters = data.routes[0].distance;
        const geometry = data.routes[0].geometry;
        return {
          distance: distanceMeters / 1000, // convertir a km
          geometry: geometry
        };
      }
      return { distance: null, geometry: null };
    } catch (error) {
      console.error('Error getting route distance:', error);
      return { distance: null, geometry: null };
    }
  };

  const selectDeliveryLocation = async (lat: number, lng: number) => {
    if (!map.current) return;

    setLoading(true);

    try {
      // Obtener dirección
      const addr = await getAddressFromCoordinates(lat, lng);

      // Obtener distancia real y geometría de ruta
      const routeData = await getRouteDistance(lat, lng);

      if (routeData.distance === null) {
        console.error('Could not calculate distance');
        setLoading(false);
        return;
      }

      setDistance(routeData.distance);

      // Verificar si está dentro del radio
      const within = routeData.distance <= MAX_DELIVERY_DISTANCE;

      // Detectar si está en la zona de advertencia (entre 4.7 y 5 km)
      const inWarningZone = routeData.distance > MAX_DELIVERY_DISTANCE_WARNING && routeData.distance <= MAX_DELIVERY_DISTANCE;

      setIsWithinRadius(within);
      setIsWarningZone(inWarningZone && within);

      // Calcular tarifa
      const fee = within ? calculateDeliveryFee(routeData.distance) : 0;
      setDeliveryFee(fee);

      // Actualizar marcador
      if (markerRef.current) {
        map.current.removeLayer(markerRef.current);
      }

      markerRef.current = L.marker([lat, lng], {
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
        .bindPopup(`Dirección de entrega<br>${addr}`);

      // Dibujar ruta basada en geometría OSRM (sigue las calles)
      if (routingControl.current) {
        map.current.removeLayer(routingControl.current);
      }

      if (routeData.geometry && routeData.geometry.coordinates) {
        // Convertir coordenadas GeoJSON [lng, lat] a [lat, lng] para Leaflet
        const routeCoordinates = routeData.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

        routingControl.current = L.polyline(routeCoordinates, {
          color: '#ff7800',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map.current);
      }

      // Notificar al componente padre
      onLocationSelect(lat, lng, routeData.distance, fee, addr);

      if (onValidityChange) {
        onValidityChange(within);
      }
    } catch (error) {
      console.error('Error selecting delivery location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Búsqueda de Dirección */}
      <div className="relative">
        <label className="block text-gray-700 font-semibold mb-2">Buscar Dirección de Entrega</label>
        <div className="relative">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => {
              setSearchAddress(e.target.value);
              searchAddressByText(e.target.value);
            }}
            placeholder="Escribe tu dirección, calle, o barrio..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 transition"
          />
          {searchAddress && (
            <button
              onClick={() => {
                setSearchAddress('');
                setShowResults(false);
                setSearchResults([]);
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Resultados de Búsqueda */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-orange-400 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition"
              >
                <p className="font-semibold text-gray-900 text-sm">{result.display_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {result.address?.road && `${result.address.road}, `}
                  {result.address?.city || result.address?.town || 'Santiago'}
                </p>
              </button>
            ))}
          </div>
        )}

        {showResults && searchAddress && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-orange-400 rounded-lg shadow-lg z-10 p-4 text-center text-gray-600">
            <p>No se encontraron resultados para "{searchAddress}"</p>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div
        ref={mapContainer}
        className="w-full h-96 border-2 border-gray-300 rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Información */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <Icon icon={Icons.spinner} size="sm" className="animate-spin" />
            <span>Calculando ruta y distancia...</span>
          </div>
        )}

        {distance !== null && (
          <>
            {/* Distancia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Distancia</p>
                <p className="text-2xl font-bold text-blue-800">{distance.toFixed(2)} km</p>
              </div>

              <div className={`rounded-lg p-4 ${
                isWithinRadius ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm font-semibold ${
                  isWithinRadius ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isWithinRadius ? 'Dentro del radio' : 'Fuera del radio'}
                </p>
                <p className={`text-xl font-bold ${
                  isWithinRadius ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isWithinRadius ? '✓ ' : '✗ '}{MAX_DELIVERY_DISTANCE} km máximo
                </p>
              </div>
            </div>

            {/* Advertencia de Zona Fronteriza */}
            {isWarningZone && (
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500 flex items-start gap-3">
                <Icon icon={Icons.warning} size="sm" className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700">Ubicación en área límite de entrega</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Tu dirección está a {distance.toFixed(2)} km del restaurante, cerca del límite de nuestro área de cobertura ({MAX_DELIVERY_DISTANCE} km). Por favor confirma que deseas continuar con la orden.
                  </p>
                </div>
              </div>
            )}

            {/* Tarifa de Delivery */}
            {isWithinRadius && (
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
                <p className="text-sm text-orange-600 font-semibold mb-2">Tarifa de Delivery</p>
                <div className="space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Tarifa base (0-{BASE_DELIVERY_THRESHOLD} km):</span>
                    <span className="font-semibold">${BASE_DELIVERY_FEE.toLocaleString('es-CL')}</span>
                  </div>
                  {distance > BASE_DELIVERY_THRESHOLD && (
                    <>
                      <div className="flex justify-between">
                        <span>Distancia adicional:</span>
                        <span className="font-semibold">
                          {(distance - BASE_DELIVERY_THRESHOLD).toFixed(2)} km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cargo adicional (${ADDITIONAL_FEE_AMOUNT.toLocaleString('es-CL')}/130m):</span>
                        <span className="font-semibold">
                          ${(deliveryFee - BASE_DELIVERY_FEE).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-orange-200">
                  <span className="font-bold text-orange-900">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ${deliveryFee.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            )}

            {!isWithinRadius && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-start gap-3">
                <Icon icon={Icons.error} size="sm" className="text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">Fuera del área de cobertura</p>
                  <p className="text-sm text-red-600">
                    La dirección seleccionada está a {distance.toFixed(2)} km. El máximo permitido es {MAX_DELIVERY_DISTANCE} km.
                  </p>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <Icon icon={Icons.lightbulb} size="sm" />
                Información:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Haz clic en el mapa para seleccionar tu dirección de entrega</li>
                <li>La línea naranja muestra la ruta desde el restaurante</li>
                <li>El círculo punteado indica el área de cobertura estimada</li>
                <li>La distancia se calcula en base a las calles reales (distancia de ruta)</li>
                <li>Si recibes una advertencia, tu ubicación está en el límite de cobertura</li>
              </ul>
            </div>
          </>
        )}

        {distance === null && !loading && (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
            <Icon icon={Icons.info} size="sm" className="inline mb-2" />
            <p>Haz clic en el mapa para seleccionar tu dirección de entrega</p>
          </div>
        )}
      </div>
    </div>
  );
}
