import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface Discount {
  id: number;
  title: string;
  percentage: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  auto_apply: boolean;
  created_at: string;
}

export default function Promotions() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await api.get('/public/discounts');
        setDiscounts(response.data.discounts || []);
      } catch (err: any) {
        setError('Error al cargar las promociones');
        console.error('Error fetching discounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const getStatus = (discount: Discount): { label: string; color: string } => {
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = new Date(discount.end_date);

    if (now < startDate) {
      return { label: 'Próximamente', color: 'bg-blue-500' };
    }
    if (now > endDate) {
      return { label: 'Finalizada', color: 'bg-gray-500' };
    }
    if (discount.is_active) {
      return { label: 'Activa', color: 'bg-green-500' };
    }
    return { label: 'Inactiva', color: 'bg-gray-500' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes} hrs`;
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-orange-600">
          Promociones y Descuentos
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl">
          Descubre nuestras ofertas especiales y ahorra en tus pedidos favoritos
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 flex items-center gap-3">
          <Icon icon={Icons.error} size="sm" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 text-orange-600">
              <Icon icon={Icons.spinner} size="lg" />
            </div>
            <p className="text-gray-600 text-lg">Cargando promociones...</p>
          </div>
        </div>
      )}

      {/* No Discounts State */}
      {!loading && discounts.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4 text-gray-400">
              <Icon icon={Icons.info} size="lg" />
            </div>
            <p className="text-gray-600 text-lg mb-6">
              No hay promociones disponibles en este momento
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-full transition"
            >
              <Icon icon={Icons.cart} size="sm" />
              Ver Menú
            </Link>
          </div>
        </div>
      )}

      {/* Discounts Grid */}
      {!loading && discounts.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {discounts.map((discount) => {
              const status = getStatus(discount);
              return (
                <div
                  key={discount.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Status Badge */}
                  <div className={`${status.color} text-white px-6 py-3 font-bold flex items-center gap-2`}>
                    {status.label === 'Activa' && (
                      <Icon icon={Icons.check} size="sm" />
                    )}
                    {status.label === 'Próximamente' && (
                      <Icon icon={Icons.clock} size="sm" />
                    )}
                    {status.label === 'Finalizada' && (
                      <Icon icon={Icons.info} size="sm" />
                    )}
                    {status.label}
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    {/* Discount Title */}
                    <h3 className="text-2xl font-black text-gray-800 mb-4">
                      {discount.title}
                    </h3>

                    {/* Discount Percentage */}
                    <div className="mb-6">
                      <div className="inline-block bg-red-100 text-red-600 px-6 py-3 rounded-full font-black text-3xl">
                        {discount.percentage}% OFF
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-3 mb-6 text-gray-600">
                      <div className="flex items-start gap-3">
                        <Icon icon={Icons.calendar} size="sm" className="mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-800">Desde</div>
                          <div>
                            {formatDate(discount.start_date)}
                            {discount.start_time && (
                              <span> - {formatTime(discount.start_time)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon icon={Icons.calendar} size="sm" className="mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-800">Hasta</div>
                          <div>
                            {formatDate(discount.end_date)}
                            {discount.end_time && (
                              <span> - {formatTime(discount.end_time)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Apply Badge */}
                    {discount.auto_apply && (
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-6 flex items-center gap-2 font-semibold">
                        <Icon icon={Icons.check} size="sm" />
                        Se aplica automáticamente
                      </div>
                    )}

                    {/* CTA Button */}
                    <Link
                      to="/menu"
                      className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold px-6 py-3 rounded-lg transition text-center flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.cart} size="sm" />
                      Aprovechar Oferta
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="mt-12 py-12 md:py-16 bg-orange-50 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-orange-600 mb-6 flex items-center gap-3">
            <Icon icon={Icons.info} size="lg" />
            Cómo funciona
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 text-white font-black">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Revisa las promociones activas</h3>
                <p>
                  Nuestras promociones se actualizan constantemente. Mira cuáles están activas en este momento.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 text-white font-black">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Realiza tu pedido</h3>
                <p>
                  Ve al menú y realiza tu pedido con los productos que deseas. Si la promoción es automática, se aplicará en el carrito.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-600 text-white font-black">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Disfruta del descuento</h3>
                <p>
                  El descuento se reflejará en tu total. Completa el pedido y disfruta de tu comida a un precio especial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-12 py-12 md:py-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          ¿No ves lo que buscas?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Explora nuestro menú completo y descubre todas nuestras deliciosas opciones.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition"
        >
          <Icon icon={Icons.cart} size="sm" />
          Ver Menú Completo
        </Link>
      </section>
    </MainLayout>
  );
}
