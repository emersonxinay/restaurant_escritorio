import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Icon, Icons } from '../utils/icons';
import { useAuth } from '../hooks/useAuth';
import { useReservationStore } from '../stores/reservationStore';
import { Reservation } from '../types/models';

export default function MyReservations() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { myReservations: reservations, loading, error, fetchMyReservations, cancelReservation: storeCancelReservation } = useReservationStore();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyReservations();
  }, [isAuthenticated, navigate, fetchMyReservations]);

  useEffect(() => {
    if (selectedReservation) {
      const updated = reservations.find(r => r.id === selectedReservation.id);
      if (updated && updated.status !== selectedReservation.status) {
        setSelectedReservation(updated);
      }
    }
  }, [reservations]);

  const cancelReservation = useCallback(async (id: number, isAdmin: boolean = false) => {
    const confirmMsg = isAdmin ? '¿Deseas cancelar esta reserva?' : '¿Deseas cancelar esta reserva pendiente?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await storeCancelReservation(id);
      setSelectedReservation(null);
    } catch (err: any) {
      console.error(err);
    }
  }, [storeCancelReservation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
            <Icon icon={Icons.check} size="xs" />
            Confirmada
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
            <Icon icon={Icons.error} size="xs" />
            Rechazada
          </span>
        );
      case 'no_show':
        return (
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
            <Icon icon={Icons.clock} size="xs" />
            No se presentó
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
            <Icon icon={Icons.clock} size="xs" />
            Pendiente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Icon icon={Icons.spinner} size="lg" className="inline mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Cargando tus reservas...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-orange-600">
          Mis Reservas
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí puedes ver todas tus reservas y sus detalles
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
          <Icon icon={Icons.error} size="sm" className="mt-1 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Icon icon={Icons.calendar} size="lg" className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-6">No tienes reservas aún</p>
          <button
            onClick={() => navigate('/reservas')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
          >
            <Icon icon={Icons.check} size="sm" />
            Hacer una Reserva
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reservations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-orange-600">Tus Reservas ({reservations.length})</h2>
              </div>

              <div className="divide-y max-h-96 overflow-y-auto">
                {reservations.map(reservation => (
                  <button
                    key={reservation.id}
                    onClick={() => setSelectedReservation(reservation)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedReservation?.id === reservation.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{formatDate(reservation.date)}</p>
                        <p className="text-sm text-gray-600">{formatTime(reservation.time)}</p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <p className="text-xs text-gray-500">{reservation.people} personas</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          {selectedReservation && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detalles de la Reserva</h2>
                  {getStatusBadge(selectedReservation.status)}
                </div>

                <div className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-semibold mb-1">Nombre</p>
                      <p className="text-gray-900 font-semibold">{selectedReservation.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-semibold mb-1">Teléfono</p>
                      <p className="text-gray-900 font-semibold">{selectedReservation.phone}</p>
                    </div>
                  </div>

                  {/* Reservation Info */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-sm text-gray-600 font-semibold mb-2">Fecha</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatDate(selectedReservation.date)}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 font-semibold mb-2">Hora</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatTime(selectedReservation.time)}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 font-semibold mb-2">Personas</p>
                      <p className="text-lg font-bold text-purple-600">
                        {selectedReservation.people}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  {selectedReservation.details && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-semibold mb-2">Detalles Especiales</p>
                      <p className="text-gray-900">{selectedReservation.details}</p>
                    </div>
                  )}

                  {/* QR Code */}
                  {selectedReservation.qr_code && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 font-semibold mb-4">Código QR de la Reserva</p>
                      <img
                        src={selectedReservation.qr_code}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto rounded-lg border-2 border-orange-600"
                      />
                      <p className="text-xs text-gray-500 mt-4">ID: {selectedReservation.id}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Creada: {new Date(selectedReservation.created_at).toLocaleDateString('es-CL')}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID de Reserva: <span className="font-mono">{selectedReservation.id}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t flex-col">
                    {selectedReservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => navigate(`/reserva-confirmacion/${selectedReservation.id}`)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Icon icon={Icons.check} size="sm" />
                          Confirmar Reserva
                        </button>
                        <button
                          onClick={() => cancelReservation(selectedReservation.id, user?.role === "admin")}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Icon icon={Icons.trash} size="sm" />
                          Cancelar Reserva
                        </button>
                      </>
                    )}

                    {selectedReservation.status === 'confirmed' && user?.role === "admin" && (
                      <button
                        onClick={() => cancelReservation(selectedReservation.id, true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Icon icon={Icons.trash} size="sm" />
                        Cancelar Reserva (Admin)
                      </button>
                    )}

                    {selectedReservation.status === 'confirmed' && user?.role !== "admin" && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-orange-800 font-semibold mb-3 flex items-start gap-2">
                          <Icon icon={Icons.info} size="sm" className="mt-0.5 flex-shrink-0" />
                          <span>Para cancelar tu reserva confirmada, contacta con nosotros <strong>1 hora antes</strong> de tu horario reservado</span>
                        </p>
                        <button
                          onClick={() => {
                            const message = `Hola, quisiera cancelar mi reserva confirmada para ${selectedReservation.people} personas el ${formatDate(selectedReservation.date)} a las ${formatTime(selectedReservation.time)}.`;
                            window.open(`https://wa.me/${selectedReservation.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Icon icon={Icons.whatsapp} size="sm" />
                          Solicitar Cancelación por WhatsApp
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const message = `Hola, quería confirmar mi reserva para ${selectedReservation.people} personas el ${formatDate(selectedReservation.date)} a las ${formatTime(selectedReservation.time)}.`;
                        window.open(`https://wa.me/${selectedReservation.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.whatsapp} size="sm" />
                      Contactar por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
