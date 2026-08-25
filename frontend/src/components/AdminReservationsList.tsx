import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import QRScanner from './QRScanner';

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  details: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'no_show';
  created_at: string;
}

export default function AdminReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations');
      setReservations(response.data.reservations || []);
    } catch (err: any) {
      setError('Error al cargar las reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReservation = useCallback(async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    try {
      await api.delete(`/reservations/${id}`);
      // Update local state instead of refetching
      setReservations(prev => prev.filter(r => r.id !== id));
      setSelectedReservation(null);
    } catch (err: any) {
      setError('Error al cancelar la reserva');
      console.error(err);
    }
  }, []);

  const changeReservationStatus = useCallback(async (id: number, newStatus: 'confirmed' | 'rejected' | 'pending') => {
    try {
      if (newStatus === 'confirmed') {
        const response = await api.patch(`/reservations/${id}/confirm`);
        // Update local state
        setReservations(prev =>
          prev.map(r => r.id === id ? response.data.reservation : r)
        );
        setSelectedReservation(response.data.reservation);
      } else if (newStatus === 'rejected') {
        const response = await api.patch(`/reservations/${id}/reject`);
        // Update local state
        setReservations(prev =>
          prev.map(r => r.id === id ? response.data.reservation : r)
        );
        setSelectedReservation(response.data.reservation);
      }
    } catch (err: any) {
      setError('Error al cambiar el estado de la reserva');
      console.error(err);
    }
  }, []);

  const handleQRScan = useCallback((qrData: string) => {
    try {
      const reservationId = parseInt(qrData);
      const reservation = reservations.find(r => r.id === reservationId);

      if (reservation) {
        setSelectedReservation(reservation);
        setIsScannerOpen(false);

        // Auto-confirm if pending
        if (reservation.status === 'pending') {
          changeReservationStatus(reservationId, 'confirmed');
        }
      } else {
        setError(`No se encontró reserva con ID: ${qrData}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Error al procesar el código QR');
      console.error(err);
    }
  }, [reservations, changeReservationStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Icon icon={Icons.check} size="xs" />
            Confirmada
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Icon icon={Icons.error} size="xs" />
            Rechazada
          </span>
        );
      case 'no_show':
        return (
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Icon icon={Icons.clock} size="xs" />
            No se presentó
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Icon icon={Icons.clock} size="xs" />
            Pendiente
          </span>
        );
    }
  };

  // Memoize filtered reservations to avoid recalculating on every render
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesDate = filterDate ? r.date.startsWith(filterDate) : true;
      const matchesSearch = searchTerm ? (
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.id).includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm)
      ) : true;
      return matchesDate && matchesSearch;
    });
  }, [filterDate, searchTerm, reservations]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Icon icon={Icons.spinner} size="lg" className="inline mb-2" />
        <p className="text-gray-600">Cargando reservas...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon={Icons.calendar} size="lg" className="text-gray-400 mb-2" />
        <p className="text-gray-600">No hay reservas aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <Icon icon={Icons.error} className="mr-2 inline" />
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-end gap-4 flex-col md:flex-row">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Filtrar por Fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 w-full md:w-48"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                />
                <Icon icon={Icons.search} size="sm" className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
          >
            <Icon icon={Icons.search} size="sm" />
            Escanear QR
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-orange-600">Reservas ({filteredReservations.length})</h2>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredReservations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay reservas para esta fecha
              </div>
            ) : (
              filteredReservations.map(reservation => (
                <button
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                    selectedReservation?.id === reservation.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{reservation.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(reservation.date)} - {formatTime(reservation.time)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        {reservation.people} personas
                      </span>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{reservation.email}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Reservation Details */}
        {selectedReservation && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Detalles de la Reserva</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Nombre</p>
                  <p className="text-lg font-bold text-gray-900">{selectedReservation.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Estado</p>
                  {getStatusBadge(selectedReservation.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold">Email</p>
                <p className="text-gray-900">{selectedReservation.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold">Teléfono</p>
                <a href={`https://wa.me/${selectedReservation.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2">
                  <Icon icon={Icons.whatsapp} size="sm" />
                  {selectedReservation.phone}
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Fecha</p>
                  <p className="text-gray-900">{formatDate(selectedReservation.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Hora</p>
                  <p className="text-gray-900">{formatTime(selectedReservation.time)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold">Cantidad de Personas</p>
                <p className="text-2xl font-bold text-orange-600">{selectedReservation.people}</p>
              </div>

              {selectedReservation.details && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Detalles Especiales</p>
                  <p className="text-gray-900">{selectedReservation.details}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Reserva hecha el {new Date(selectedReservation.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t flex-col space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {selectedReservation.status !== 'confirmed' && (
                    <button
                      onClick={() => changeReservationStatus(selectedReservation.id, 'confirmed')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.check} size="sm" />
                      Confirmar
                    </button>
                  )}
                  {selectedReservation.status !== 'rejected' && (
                    <button
                      onClick={() => changeReservationStatus(selectedReservation.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Icon icon={Icons.error} size="sm" />
                      Rechazar
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    const message = `Hola ${selectedReservation.name}, confirmo tu reserva para ${selectedReservation.people} personas el ${formatDate(selectedReservation.date)} a las ${formatTime(selectedReservation.time)}. ¡Nos vemos pronto!`;
                    window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Icon icon={Icons.whatsapp} size="sm" />
                  Enviar por WhatsApp
                </button>

                <button
                  onClick={() => deleteReservation(selectedReservation.id)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Icon icon={Icons.trash} size="sm" />
                  Eliminar Reserva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
