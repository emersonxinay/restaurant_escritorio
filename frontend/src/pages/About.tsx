import MainLayout from '../layouts/MainLayout';
import { Icon, Icons } from '../utils/icons';

export default function About() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-orange-600">
          Nosotros
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl">
          Conoce la historia detrás de Hazuki Quilín, tu restaurante de confianza en Santiago
        </p>
      </div>

      {/* Story Section */}
      <section className="py-12 md:py-16 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-orange-600 mb-6">
              Nuestra Historia
            </h2>
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              Hazuki Quilín nació con la visión de traer los mejores sabores asiáticos y peruanos a tu mesa.
              Desde nuestros inicios, nos hemos comprometido con la calidad, usando solo ingredientes premium
              seleccionados cuidadosamente.
            </p>
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              Nuestro equipo de chefs expertos combina técnicas tradicionales con innovación culinaria para
              crear platos que deleitarán tu paladar. Cada pedido es preparado con dedicación y cuidado.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Ubicados en el corazón de Quilín, nos esforzamos por ser más que un restaurante: somos parte
              de tu comunidad, compartiendo momentos especiales en cada entrega.
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 text-white flex flex-col items-center justify-center h-96">
            <Icon icon={Icons.utensils} size="xl" className="mb-4" style={{fontSize: '4rem'}} />
            <h3 className="text-2xl font-black text-center">Pasión por la Gastronomía</h3>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-16 mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-center text-orange-600 mb-12">
          Nuestros Valores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4 flex justify-center text-orange-600">
              <Icon icon={Icons.star} size="xl" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Calidad Premium</h3>
            <p className="text-gray-600">
              Usamos solo ingredientes frescos y de la mejor calidad en cada uno de nuestros platos.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4 flex justify-center text-orange-600">
              <Icon icon={Icons.delivery} size="xl" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Entrega Rápida</h3>
            <p className="text-gray-600">
              Garantizamos entregas en 30 minutos a 1 hora, manteniendo la calidad de nuestros platos.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-5xl mb-4 flex justify-center text-orange-600">
              <Icon icon={Icons.heart} size="xl" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Pasión y Dedicación</h3>
            <p className="text-gray-600">
              Cada plato es preparado con amor y cuidado para ofrecerte la mejor experiencia.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-16 mb-12 bg-orange-50 rounded-lg p-8">
        <h2 className="text-3xl md:text-4xl font-black text-center text-orange-600 mb-12">
          Nuestro Equipo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              Nuestro equipo está compuesto por chefs experimentados, delivery rápido y personal atento
              que se dedica a brindarte el mejor servicio. Cada miembro de nuestro equipo comparte la
              misma pasión por la excelencia culinaria.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Nos capacitamos continuamente para mantenernos a la vanguardia de las tendencias culinarias
              y para perfeccionar nuestros procesos de entrega.
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-8 text-white flex flex-col items-center justify-center h-80">
            <Icon icon={Icons.user} size="xl" className="mb-4" style={{fontSize: '4rem'}} />
            <h3 className="text-2xl font-black text-center">Profesionales Comprometidos</h3>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          ¿Tienes Preguntas?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Estamos aquí para ayudarte. Contáctanos a través de cualquiera de nuestros canales.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center flex-wrap">
          <a
            href="tel:+56958184425"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            <Icon icon={Icons.phone} size="sm" />
            Llamar Ahora
          </a>
          <a
            href="https://wa.me/56958184425"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition"
          >
            <Icon icon={Icons.whatsapp} size="sm" />
            WhatsApp
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
