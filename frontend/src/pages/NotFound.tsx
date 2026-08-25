import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Icon, Icons } from '../utils/icons';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          {/* 404 Animation Container */}
          <div className="mb-8 relative">
            {/* Large 404 text with gradient */}
            <div className="text-9xl md:text-[150px] font-black bg-gradient-hazuki bg-clip-text text-transparent select-none">
              404
            </div>

            {/* Floating icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-hazuki-orange opacity-20 animate-pulse">
              <Icon icon={Icons.utensils} size="xl" className="text-8xl" />
            </div>
          </div>

          {/* Main message */}
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-hazuki-text-dark">
            ¡Página No Encontrada!
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-hazuki-gray-medium mb-6 max-w-2xl mx-auto leading-relaxed">
            Lo sentimos, parece que la página que buscas se ha "comido" como un delicioso plato nuestro.
            <br className="hidden md:block" />
            <span className="text-hazuki-orange font-bold">No hay rastro de ella aquí.</span>
          </p>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-1 w-12 bg-gradient-hazuki rounded-full"></div>
            <Icon icon={Icons.plate} size="md" className="text-hazuki-orange" />
            <div className="h-1 w-12 bg-gradient-hazuki rounded-full"></div>
          </div>

          {/* Helpful message */}
          <p className="text-hazuki-gray-medium mb-10 text-lg max-w-xl mx-auto">
            Es posible que la URL sea incorrecta o que esta página se haya movido de lugar.
            Pero no te preocupes, ¡tenemos muchas opciones deliciosas esperándote!
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {/* Primary button - Go Home */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-3 bg-gradient-hazuki hover:shadow-glow-red text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Icon icon={Icons.home} size="md" />
              <span>Volver al Inicio</span>
            </button>

            {/* Secondary button - View Menu */}
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center justify-center gap-3 bg-white border-2 border-hazuki-orange hover:bg-hazuki-orange text-hazuki-orange hover:text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Icon icon={Icons.plate} size="md" />
              <span>Ver Menú</span>
            </button>

            {/* Tertiary button - Make reservation */}
            <button
              onClick={() => navigate('/reservas')}
              className="flex items-center justify-center gap-3 bg-hazuki-gray-light hover:bg-hazuki-gray-medium text-hazuki-text-dark font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Icon icon={Icons.calendar} size="md" />
              <span>Hacer Reserva</span>
            </button>
          </div>

          {/* Quick links */}
          <div className="bg-hazuki-bg-light rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-bold text-hazuki-text-dark mb-6">
              Explora nuestras secciones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/carta')}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-all duration-300 hover:border-hazuki-orange border-2 border-transparent"
              >
                <Icon icon={Icons.utensils} size="lg" className="text-hazuki-orange" />
                <span className="font-semibold text-sm text-hazuki-text-dark">Carta</span>
              </button>

              <button
                onClick={() => navigate('/nosotros')}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-all duration-300 hover:border-hazuki-orange border-2 border-transparent"
              >
                <Icon icon={Icons.info} size="lg" className="text-hazuki-orange" />
                <span className="font-semibold text-sm text-hazuki-text-dark">Nosotros</span>
              </button>

              <button
                onClick={() => navigate('/promociones')}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-all duration-300 hover:border-hazuki-orange border-2 border-transparent"
              >
                <Icon icon={Icons.star} size="lg" className="text-hazuki-orange" />
                <span className="font-semibold text-sm text-hazuki-text-dark">Promociones</span>
              </button>

              <button
                onClick={() => navigate('/reservas')}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-all duration-300 hover:border-hazuki-orange border-2 border-transparent"
              >
                <Icon icon={Icons.calendar} size="lg" className="text-hazuki-orange" />
                <span className="font-semibold text-sm text-hazuki-text-dark">Reservas</span>
              </button>
            </div>
          </div>

          {/* Footer message */}
          <p className="text-hazuki-gray-medium text-sm">
            Si crees que esto es un error, por favor{' '}
            <a href="mailto:contacto@hazuki.com" className="text-hazuki-orange font-bold hover:underline">
              contáctanos
            </a>
          </p>

          {/* Decorative emoji elements */}
          <div className="mt-10 flex justify-center gap-8 text-5xl opacity-30">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>
              <Icon icon={Icons.sushi} className="text-hazuki-orange" />
            </span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
              <Icon icon={Icons.noodles} className="text-hazuki-orange" />
            </span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <Icon icon={Icons.utensils} className="text-hazuki-orange" />
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
