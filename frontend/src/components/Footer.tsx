import { Icon, Icons } from '../utils/icons';

export default function Footer() {
  return (
    <footer className="bg-orange-700 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">
                H
              </div>
              <h3 className="font-black text-lg">Hazuki Quilín</h3>
            </div>
            <p className="text-sm">El Mejor Sushi & Comida Peruana. Ingredientes Premium, Entregas Rápidas.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Información</h3>
            <p className="text-sm mb-2">
              <Icon icon={Icons.map} size="sm" className="mr-2" />
              Av. Quilín 5957, Santiago
            </p>
            <p className="text-sm mb-2">
              <Icon icon={Icons.phone} size="sm" className="mr-2" />
              +56 9 5818 4425
            </p>
            <p className="text-sm">
              <Icon icon={Icons.clock} size="sm" className="mr-2" />
              Lun - Dom: 11:00 - 23:00
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Síguenos</h3>
            <div className="flex gap-4">
              <a href="tel:+56958184425" className="text-white hover:scale-110 transition" title="Llamar">
                <Icon icon={Icons.phone} size="xl" />
              </a>
              <a href="https://wa.me/56958184425" target="_blank" rel="noopener noreferrer" className="text-white hover:scale-110 transition" title="WhatsApp">
                <Icon icon={Icons.whatsapp} size="xl" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:scale-110 transition" title="Instagram">
                <Icon icon={Icons.instagram} size="xl" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-orange-600 pt-6 text-center">
          <p className="text-sm mb-2">© 2025 Hazuki Quilín Restaurant. Todos los derechos reservados.</p>
          <p className="text-xs text-gray-200">Hecho con <Icon icon={Icons.heart} size="xs" className="text-red-400 inline" /> para nuestros clientes</p>
        </div>
      </div>
    </footer>
  );
}
