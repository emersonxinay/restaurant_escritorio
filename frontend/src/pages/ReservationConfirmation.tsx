import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface ReservationDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  details: string;
  status: 'pending' | 'confirmed' | 'rejected';
  qr_code?: string;
  created_at: string;
}

export default function ReservationConfirmation() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        if (!reservationId) {
          setError('ID de reserva no válido');
          setLoading(false);
          return;
        }

        const response = await api.get(`/reservations/${reservationId}`);
        setReservation(response.data.reservation);
      } catch (err: any) {
        setError('Error al cargar la reserva');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  const handleConfirm = async () => {
    if (!reservation) return;

    setConfirming(true);
    try {
      const response = await api.patch(`/reservations/${reservation.id}/confirm`);
      setReservation(response.data.reservation);
    } catch (err: any) {
      setError('Error al confirmar la reserva');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!reservation || !window.confirm('¿Deseas rechazar esta reserva?')) return;

    setConfirming(true);
    try {
      const response = await api.patch(`/reservations/${reservation.id}/reject`);
      setReservation(response.data.reservation);
    } catch (err: any) {
      setError('Error al rechazar la reserva');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Icon icon={Icons.spinner} size="lg" className="inline mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Cargando reserva...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !reservation) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Icon icon={Icons.error} size="lg" className="text-red-600 mb-4" />
          <p className="text-red-600 text-lg font-semibold">{error || 'Reserva no encontrada'}</p>
          <button
            onClick={() => navigate('/reservas')}
            className="mt-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Volver a Reservas
          </button>
        </div>
      </MainLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'rejected':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'pending':
      default:
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'rejected':
        return 'Rechazada';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-6 text-orange-600">
          Confirmación de Reserva
        </h1>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with status */}
          <div className={`p-6 border-l-4 ${
            reservation.status === 'confirmed'
              ? 'bg-green-50 border-green-600'
              : reservation.status === 'rejected'
              ? 'bg-red-50 border-red-600'
              : 'bg-yellow-50 border-yellow-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {reservation.name}
                </h2>
                <p className={`font-semibold inline-block px-4 py-2 rounded-full border ${getStatusColor(reservation.status)}`}>
                  <Icon icon={
                    reservation.status === 'confirmed' ? Icons.success :
                    reservation.status === 'rejected' ? Icons.error :
                    Icons.clock
                  } className="inline mr-2" />
                  {getStatusLabel(reservation.status)}
                </p>
              </div>
              {reservation.status === 'pending' && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <p className="text-lg font-bold text-yellow-600">Pendiente de Confirmación</p>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Details */}
          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <Icon icon={Icons.error} size="sm" className="mt-1 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">Correo</p>
                <p className="text-gray-900 font-semibold">{reservation.email}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">Teléfono</p>
                <a
                  href={`https://wa.me/${reservation.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
                >
                  <Icon icon={Icons.whatsapp} size="sm" />
                  {reservation.phone}
                </a>
              </div>
            </div>

            {/* Reservation Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Fecha</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatDate(reservation.date)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Hora</p>
                <p className="text-lg font-bold text-blue-600">
                  {reservation.time}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Personas</p>
                <p className="text-lg font-bold text-purple-600">
                  {reservation.people} {reservation.people === 1 ? 'Persona' : 'Personas'}
                </p>
              </div>
            </div>

            {/* Details */}
            {reservation.details && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Detalles Especiales</p>
                <p className="text-gray-900">{reservation.details}</p>
              </div>
            )}

            {/* QR Code */}
            {reservation.qr_code && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 font-semibold mb-4">Código QR de la Reserva</p>
                <img
                  src={reservation.qr_code}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                ID de Reserva: <span className="font-mono">{reservation.id}</span>
              </p>
              <p className="text-xs text-gray-500">
                Creada: {new Date(reservation.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          {/* Actions */}
          {reservation.status === 'pending' && (
            <div className="bg-gray-50 border-t p-6 flex gap-4 flex-col md:flex-row">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <Icon icon={Icons.spinner} size="sm" className="animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Icon icon={Icons.check} size="sm" />
                    Confirmar Reserva
                  </>
                )}
              </button>

              <button
                onClick={handleReject}
                disabled={confirming}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <Icon icon={Icons.spinner} size="sm" className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Icon icon={Icons.error} size="sm" />
                    Rechazar Reserva
                  </>
                )}
              </button>
            </div>
          )}

          {/* Confirmed/Rejected Message */}
          {reservation.status === 'confirmed' && (
            <div className="bg-green-50 border-t border-green-200 p-6 text-center">
              <Icon icon={Icons.success} size="lg" className="text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-semibold text-lg">¡Reserva Confirmada!</p>
              <p className="text-green-600 text-sm mt-2">
                Te confirmaremos los detalles por WhatsApp al número que proporcionaste.
              </p>
            </div>
          )}

          {reservation.status === 'rejected' && (
            <div className="bg-red-50 border-t border-red-200 p-6 text-center">
              <Icon icon={Icons.error} size="lg" className="text-red-600 mx-auto mb-2" />
              <p className="text-red-700 font-semibold text-lg">Reserva Rechazada</p>
              <p className="text-red-600 text-sm mt-2">
                Si tienes preguntas, contáctanos a través de nuestros canales de atención.
              </p>
              <button
                onClick={() => navigate('/reservas')}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition inline-block"
              >
                Hacer otra reserva
              </button>
            </div>
          )}

          {/* Back to Reservations */}
          {reservation.status !== 'pending' && (
            <div className="bg-gray-50 border-t p-6 text-center">
              <button
                onClick={() => navigate('/reservas')}
                className="text-orange-600 hover:text-orange-700 font-bold flex items-center justify-center gap-2 mx-auto"
              >
                <Icon icon={Icons.arrowLeft} size="sm" />
                Volver a Reservas
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
