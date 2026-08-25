import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import MapSection from '../components/MapSection';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import { useAuth } from '../hooks/useAuth';

interface ReservationFormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  details?: string;
}

export default function Reservations() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReservationFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '13:30',
    people: 2,
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'people' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Si no está autenticado, guardar datos y redirigir a login
    if (!isAuthenticated) {
      localStorage.setItem('pendingReservation', JSON.stringify(formData));
      navigate('/login?redirect=reservas');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/reservations', formData);
      const reservationId = response.data.reservation.id;

      // Redirect to confirmation page
      setTimeout(() => {
        navigate(`/reserva-confirmacion/${reservationId}`);
      }, 500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al crear la reserva. Por favor, intenta de nuevo.'
      );
      setLoading(false);
    }
  };

  // Restaurar datos de reserva pendiente si el usuario acaba de loguearse
  useEffect(() => {
    if (isAuthenticated) {
      const pending = localStorage.getItem('pendingReservation');
      if (pending) {
        try {
          const reservationData = JSON.parse(pending);
          setFormData({
            ...reservationData,
            name: user?.name || reservationData.name || '',
            email: user?.email || reservationData.email || '',
          });
          localStorage.removeItem('pendingReservation');
        } catch (e) {
          console.error('Error restoring reservation data:', e);
        }
      }
    }
  }, [isAuthenticated, user]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-orange-600">
          Reserva tu Mesa
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl">
          Reserva una mesa en Hazuki Quilín y vive una experiencia inolvidable
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
                <Icon icon={Icons.error} size="sm" className="mt-1 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
                <Icon icon={Icons.success} size="sm" className="mt-1 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Icon icon={Icons.user} size="sm" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Icon icon={Icons.envelope} size="sm" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Icon icon={Icons.phone} size="sm" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  placeholder="+56 9 XXXX XXXX"
                  required
                />
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                    <Icon icon={Icons.calendar} size="sm" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={minDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                    required
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                    <Icon icon={Icons.clock} size="sm" />
                    Hora (Intervalos de 15 min)
                  </label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                    required
                  >
                    <option value="">Selecciona una hora</option>
                    {(() => {
                      const slots = [];
                      for (let h = 13; h <= 21; h++) {
                        for (let m = 0; m < 60; m += 15) {
                          if (h === 21 && m > 45) break;
                          const hour = String(h).padStart(2, '0');
                          const min = String(m).padStart(2, '0');
                          const displayHour = h > 12 ? h - 12 : h;
                          const period = h >= 12 ? 'PM' : 'AM';
                          const timeStr = `${hour}:${min}`;
                          slots.push(
                            <option key={timeStr} value={timeStr}>
                              {String(displayHour).padStart(2, '0')}:{min} {period}
                            </option>
                          );
                        }
                      }
                      return slots;
                    })()}
                  </select>
                </div>
              </div>

              {/* Party Size */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Icon icon={Icons.user} size="sm" />
                  Número de Personas por Mesa
                </label>
                <select
                  name="people"
                  value={formData.people}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Persona' : 'Personas'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Cada mesa soporta de 2 a 10 personas máximo
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Icon icon={Icons.info} size="sm" />
                  Notas Especiales (Opcional)
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 resize-none"
                  rows={4}
                  placeholder="Cuéntanos si tienes algún requerimiento especial, alergia, celebración, etc."
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon icon={Icons.spinner} size="sm" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Icon icon={Icons.check} size="sm" />
                    Confirmar Reserva
                  </>
                )}
              </button>

              {/* Info Message */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  <Icon icon={Icons.whatsapp} size="xs" className="inline mr-1 text-green-600" />
                  Te confirmaremos tu reserva por WhatsApp al número que proporcionaste
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold flex items-start gap-2">
                    <Icon icon={Icons.info} size="sm" className="mt-0.5 flex-shrink-0" />
                    <span>Por favor, llega <strong>10 a 15 minutos antes</strong> de tu hora de reserva</span>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Info Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Card */}
          <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
            <h3 className="text-xl font-black text-orange-600 mb-4 flex items-center gap-2">
              <Icon icon={Icons.phone} size="lg" />
              Contacto Directo
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Teléfono</p>
                <a
                  href="tel:+56958184425"
                  className="text-orange-600 hover:text-orange-700 font-bold text-lg flex items-center gap-2"
                >
                  <Icon icon={Icons.phone} size="sm" />
                  +56 9 5818 4425
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">WhatsApp</p>
                <a
                  href="https://wa.me/56958184425"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-bold text-lg flex items-center gap-2"
                >
                  <Icon icon={Icons.whatsapp} size="sm" />
                  Escribir Ahora
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Correo</p>
                <a
                  href="mailto:info@hazuki.com"
                  className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-2"
                >
                  <Icon icon={Icons.envelope} size="sm" />
                  info@hazuki.com
                </a>
              </div>
            </div>
          </div>

          {/* Hours Card */}
          <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-xl font-black text-blue-600 mb-4 flex items-center gap-2">
              <Icon icon={Icons.clock} size="lg" />
              Horarios de Reserva
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-blue-600 mb-2">Reservas disponibles:</p>
                <span className="text-base font-bold">1:30 PM - 9:45 PM</span>
              </div>
              <div className="border-t border-blue-200 pt-3 mt-3">
                <p className="font-semibold text-gray-600 mb-1">Horario del restaurante:</p>
                <div className="flex justify-between">
                  <span className="font-semibold">Lunes a Jueves</span>
                  <span>11:00 - 23:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Viernes a Domingo</span>
                  <span>11:00 - 23:00</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 italic">
                Se recomienda hacer reserva con al menos 24 horas de anticipación.
              </p>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
            <h3 className="text-xl font-black text-green-600 mb-4 flex items-center gap-2">
              <Icon icon={Icons.location} size="lg" />
              Ubicación
            </h3>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-700 font-bold text-lg">Av. Quilín 5957</p>
                <p className="text-sm text-gray-600">Local 1, Santiago, Chile</p>
              </div>
              <a
                href="https://www.google.com/maps/place/Hazuki+Sushi+Nikkei+Quilin/@-33.4985262,-70.5668644,17z/data=!4m14!1m7!3m6!1s0x9662d1caf5d339ad:0x9674cda8ea330048!2zQXYuIFF1aWzDrW4gNTk1NywgUGXDsWFsb2zDqW4sIFJlZ2nDs24gTWV0cm9wb2xpdGFuYQ!3b1!8m2!3d-33.4961285!4d-70.571349!3m5!1s0x9662d100693cc665:0x6ce3fc6e45677cf9!8m2!3d-33.4991371!4d-70.5612436!16s%2Fg%2F11x_xz829z?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <Icon icon={Icons.map} size="sm" />
                Ver en Google Maps
              </a>
            </div>
            <MapSection
              variant="minimal"
              showBorder={false}
              className="w-full"
              height="350"
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-3xl font-black text-orange-600 mb-8 flex items-center gap-3">
          <Icon icon={Icons.info} size="lg" />
          Preguntas Frecuentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon={Icons.check} size="sm" className="text-orange-600" />
              ¿Puedo cambiar la hora de mi reserva?
            </h3>
            <p className="text-gray-600 text-sm">
              Sí, puedes contactarnos por teléfono o WhatsApp para cambiar la fecha u hora de tu reserva con al menos 24 horas de anticipación.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon={Icons.check} size="sm" className="text-orange-600" />
              ¿Cuántas personas máximo pueden ir?
            </h3>
            <p className="text-gray-600 text-sm">
              Cada mesa soporta de 2 a 10 personas. Tenemos un máximo de 15 mesas disponibles por cada intervalo de horario.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon={Icons.check} size="sm" className="text-orange-600" />
              ¿Hay costo por reserva?
            </h3>
            <p className="text-gray-600 text-sm">
              No, las reservas son completamente gratuitas. Solo pagarás por tu consumo en el restaurante.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon={Icons.check} size="sm" className="text-orange-600" />
              ¿Puedo hacer una reserva para eventos especiales?
            </h3>
            <p className="text-gray-600 text-sm">
              ¡Claro! Contáctanos para hablar sobre cumpleaños, aniversarios u otros eventos especiales. Podemos arreglar menús personalizados.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          ¿Tienes Preguntas?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Estamos aquí para ayudarte. Contáctanos a través de cualquiera de nuestros canales de atención.
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
