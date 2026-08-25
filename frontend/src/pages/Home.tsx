import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';
import MapSection from '../components/MapSection';
import { useCartStore } from '../stores/cartStore';
import { useAppDataStore, Product } from '../stores/appDataStore';
import { Icon, Icons } from '../utils/icons';

export default function Home() {
  const products = useAppDataStore((state) => state.products);
  const discount = useAppDataStore((state) => state.discount);
  const hasFetchedHome = useAppDataStore((state) => state.hasFetchedHome);
  const fetchHomeData = useAppDataStore((state) => state.fetchHomeData);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const initData = async () => {
      if (!hasFetchedHome) {
        await fetchHomeData();
      }
    };
    initData();
  }, [hasFetchedHome, fetchHomeData]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image_url: product.image_url,
    });
  };


  return (
    <MainLayout>
      {/* Hero Carousel */}
      <Carousel />

      {/* Main Brand Section - Like the reference image */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-orange-700 via-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center">
          {/* Descuento Badge */}
          {discount && (
            <div className="inline-block bg-red-700 text-white px-4 py-2 rounded-full text-xs md:text-sm font-bold mb-6 animate-pulse flex items-center gap-2">
              <Icon icon={Icons.star} size="sm" />
              {discount.title}: Descuento {discount.percentage}% en pedidos desde hoy
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-yellow-300 mb-3">
            HAZUKI
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-bold text-white mb-8">
            El Mejor Sushi & Comida Peruana
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl md:text-3xl font-black text-yellow-300">1000+</div>
              <div className="text-sm text-gray-100">Clientes Felices</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl md:text-3xl font-black text-yellow-300 flex items-center justify-center gap-1">4.9 <Icon icon={Icons.star} size="sm" /></div>
              <div className="text-sm text-gray-100">Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl md:text-3xl font-black text-yellow-300">30min-1h</div>
              <div className="text-sm text-gray-100">Entrega</div>
            </div>
          </div>

          {/* Trust Info */}
          <p className="text-sm md:text-base text-gray-100 mb-8 flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Icon icon={Icons.check} size="sm" />
              Ingredientes Premium
            </span>
            •
            <span className="flex items-center gap-1">
              <Icon icon={Icons.delivery} size="sm" />
              Entrega Rápida
            </span>
            •
            <span className="flex items-center gap-1">
              <Icon icon={Icons.check} size="sm" />
              Garantizado Fresco
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 md:px-10 md:py-4 rounded-full transition-colors"
            >
              <Icon icon={Icons.cart} size="sm" />
              PEDIR AHORA
            </Link>
            <a
              href="tel:+56958184425"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-3 md:px-10 md:py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              <Icon icon={Icons.phone} size="sm" />
              LLAMAR AHORA
            </a>
          </div>
        </div>
      </section>

      {/* Products Section - PRODUCTOS ESTRELLA */}
      {products.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-hazuki-bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center text-orange-600 mb-2">
              PRODUCTOS ESTRELLA
            </h2>
            <p className="text-center text-hazuki-gray-medium mb-12">
              Los favoritos de nuestros clientes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 5).map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  isPopular={true}
                  onAddToCart={(qty) => handleAddToCart(product, qty)}
                />
              ))}
              {/* Placeholder for "¡Y mucho más!" */}
              {products.length > 5 && (
                <div className="flex flex-col items-center justify-center p-8 bg-orange-50 rounded-2xl text-center">
                  <div className="text-4xl mb-4 text-orange-600"><Icon icon={Icons.plate} size="lg" /></div>
                  <h3 className="text-xl font-black text-hazuki-text-dark mb-4">
                    ¡Y mucho más!
                  </h3>
                  <p className="text-hazuki-gray-medium mb-6">
                    Descubre nuestra amplia variedad de productos deliciosos
                  </p>
                  <Link
                    to="/menu"
                    className="bg-gradient-hazuki text-white font-bold px-6 py-2 rounded-full hover:shadow-glow-red transition-all"
                  >
                    VER CARTA COMPLETA
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Trust / Customers Section - CLIENTES FELICES */}
      <section className="py-12 md:py-16 px-4 bg-hazuki-bg-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-orange-600 mb-2">
            CLIENTES FELICES
          </h2>
          <p className="text-center text-hazuki-gray-medium mb-12">
            Más de 1000 clientes satisfechos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4 text-orange-600">
                <Icon icon={Icons.smile} size="lg" />
              </div>
              <div className="flex gap-1 justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} icon={Icons.star} size="lg" className="text-yellow-400" />
                ))}
              </div>
              <p className="text-hazuki-gray-medium italic mb-3">
                "El mejor sushi de Santiago! Delivery rápido y producto de excelente calidad."
              </p>
              <p className="font-bold text-hazuki-text-dark">Carlos M.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4 text-red-500">
                <Icon icon={Icons.heart} size="lg" />
              </div>
              <div className="flex gap-1 justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} icon={Icons.star} size="lg" className="text-yellow-400" />
                ))}
              </div>
              <p className="text-hazuki-gray-medium italic mb-3">
                "La comida peruana es simplemente deliciosa. Siempre pidó aqui cuando quiero algo especial."
              </p>
              <p className="font-bold text-hazuki-text-dark">María F.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4 text-green-600">
                <Icon icon={Icons.check} size="lg" />
              </div>
              <div className="flex gap-1 justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} icon={Icons.star} size="lg" className="text-yellow-400" />
                ))}
              </div>
              <p className="text-hazuki-gray-medium italic mb-3">
                "Perfecta para reuniones familiares. Los precios son muy competitivos y la calidad garantizada."
              </p>
              <p className="font-bold text-hazuki-text-dark">Familia González</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            ¿LISTO PARA LA MEJOR EXPERIENCIA?
          </h2>
          <p className="text-gray-100 mb-8 text-lg max-w-2xl mx-auto">
            Únete a más de 1000 clientes satisfechos. Ordena a través de cualquiera de nuestros canales de contacto.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-full transition-colors"
            >
              <Icon icon={Icons.cart} size="sm" />
              HACER PEDIDO AHORA
            </Link>
            <a
              href="tel:+56958184425"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              <Icon icon={Icons.phone} size="sm" />
              LLAMAR AHORA
            </a>
          </div>
        </div>
      </section>

      {/* Footer Section - Location */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-yellow-600 to-yellow-700">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8 text-center">
            LOCAL DE QUILÍN
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Info */}
            <div className="text-white">
              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-start gap-3">
                    <Icon icon={Icons.location} size="sm" className="mt-1 flex-shrink-0" />
                    <div>
                      <strong className="text-lg">Av. Quilín 5957</strong> <br />
                      <span className="text-yellow-100">Local 1, Santiago, Chile</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <Icon icon={Icons.phone} size="sm" />
                    <div>
                      <strong>Teléfono:</strong>
                      <a href="tel:+56958184425" className="block text-yellow-100 hover:text-white transition">
                        +56 9 5818 4425
                      </a>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3">
                    <Icon icon={Icons.clock} size="sm" className="mt-1 flex-shrink-0" />
                    <div>
                      <strong>Horario de Atención:</strong> <br />
                      <span className="text-yellow-100">
                        Lunes a Jueves: 11:00 - 23:00 hrs <br />
                        Viernes a Domingo: 11:00 - 23:00 hrs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8 pt-8 border-t border-yellow-500">
                <a href="tel:+56958184425" className="hover:scale-110 transition text-yellow-100 hover:text-white">
                  <Icon icon={Icons.phone} size="xl" />
                </a>
                <a href="mailto:info@hazuki.com" className="hover:scale-110 transition text-yellow-100 hover:text-white">
                  <Icon icon={Icons.envelope} size="xl" />
                </a>
                <a href="#map" className="hover:scale-110 transition text-yellow-100 hover:text-white">
                  <Icon icon={Icons.location} size="xl" />
                </a>
              </div>
            </div>
            {/* Map */}
            <div className="flex flex-col items-center justify-center">
              <MapSection
                variant="card"
                showBorder={true}
                className="w-full max-w-md md:max-w-lg"
                height="400"
              />
              <p className="text-white text-sm mt-4 text-center font-semibold">
                Haz clic en el mapa para obtener indicaciones
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
