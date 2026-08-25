import React, { useState, useEffect } from 'react';
import { Order } from '../types/models';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface WaiterPaymentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export const WaiterPaymentModal: React.FC<WaiterPaymentModalProps> = ({ order, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'cash' | 'card_transbank' | 'transfer'>('cash');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = Number(order.total);
  const tipAmount = Math.round(subtotal * (tipPercentage / 100));
  const finalTotal = subtotal + tipAmount;
  
  const paidSoFar = order.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
  const remaining = finalTotal - paidSoFar;

  const handlePayment = async () => {
    if (remaining <= 0) {
      setLoading(true);
      try {
        // Trigger a status update to 'delivered' to force table freeing logic
        await api.patch(`/orders/${order.id}/status`, { status: 'delivered' });
        onSuccess();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al liberar la mesa');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/payments', {
        order_id: order.id,
        amount: remaining,
        method: method
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Cobrar Mesa {order.table_id || 'N/A'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
            <Icon icon={Icons.close} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2 text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            
            <div className="mb-4">
              <span className="block text-sm text-gray-600 mb-2">Propina Sugerida</span>
              <div className="flex gap-2">
                {[0, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTipPercentage(pct)}
                    className={`flex-1 py-1 px-2 rounded border text-sm font-bold transition-colors ${tipPercentage === pct ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {pct}% (${Math.round(subtotal * (pct / 100)).toLocaleString()})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between font-bold text-xl text-gray-900 border-t pt-2">
              <span>Total a Cobrar</span>
              <span>${remaining.toLocaleString()}</span>
            </div>
            {paidSoFar > 0 && (
              <div className="text-xs text-orange-600 text-right mt-1">
                (Ya se han pagado ${paidSoFar.toLocaleString()})
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setMethod('cash')} className={`p-3 rounded-lg border font-bold text-sm ${method === 'cash' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Efectivo</button>
              <button onClick={() => setMethod('card_transbank')} className={`p-3 rounded-lg border font-bold text-sm ${method === 'card_transbank' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Tarjeta</button>
              <button onClick={() => setMethod('transfer')} className={`p-3 rounded-lg border font-bold text-sm ${method === 'transfer' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Transf.</button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon icon={Icons.spinner} className="animate-spin" />
                Procesando...
              </>
            ) : remaining <= 0 ? (
              'Liberar Mesa'
            ) : (
              'Confirmar Pago'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
