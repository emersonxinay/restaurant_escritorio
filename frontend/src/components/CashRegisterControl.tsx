import React, { useState } from 'react';
import { cashierAPI, CashierReport, CashMovement } from '../services/cashierService';

interface CashRegisterControlProps {
  report: CashierReport;
  onUpdate: () => void;
}

export const CashRegisterControl: React.FC<CashRegisterControlProps> = ({ report, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // Calculate leftover from previous close
  const previousLeftover = report.previous_close ? 
    Number(report.previous_close.counted_cash || 0) - Number(report.previous_close.amount_to_deposit || 0) : 0;

  const [openingBalance, setOpeningBalance] = useState(previousLeftover);

  // Update opening balance if report changes (e.g., loaded)
  React.useEffect(() => {
    if (!report.is_open && !report.is_closed) {
      setOpeningBalance(report.previous_close ? 
        Number(report.previous_close.counted_cash || 0) - Number(report.previous_close.amount_to_deposit || 0) : 0);
    }
  }, [report.previous_close, report.is_open, report.is_closed]);
  
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<{type: 'expense'|'income', amount: number, observation: string}>({
    type: 'expense',
    amount: 0,
    observation: ''
  });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ counted_cash: 0, amount_to_deposit: 0 });

  const handleOpenRegister = async () => {
    if (openingBalance < 0) return alert('El monto no puede ser negativo');
    setLoading(true);
    try {
      await cashierAPI.openRegister({ date: report.date, opening_balance: openingBalance });
      onUpdate();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error abriendo caja');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async () => {
    if (movementForm.amount <= 0 || !movementForm.observation) return alert('Datos inválidos');
    setLoading(true);
    try {
      await cashierAPI.addMovement({
        date: report.date,
        type: movementForm.type,
        amount: movementForm.amount,
        observation: movementForm.observation
      });
      setShowMovementModal(false);
      setMovementForm({ type: 'expense', amount: 0, observation: '' });
      onUpdate();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error registrando movimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegister = async () => {
    setLoading(true);
    try {
      await cashierAPI.closeRegister({
        date: report.date,
        counted_cash: closeForm.counted_cash,
        amount_to_deposit: closeForm.amount_to_deposit
      });
      setShowCloseModal(false);
      onUpdate();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error cerrando caja');
    } finally {
      setLoading(false);
    }
  };

  const isUnopened = !report.is_open && !report.is_closed;

  // Render variables
  const opening = Number(report.daily_close?.opening_balance || 0);
  const incomes = report.movements?.filter(m => m.type === 'income') || [];
  const expenses = report.movements?.filter(m => m.type === 'expense') || [];
  
  const totalIncomes = incomes.reduce((s, m) => s + Number(m.amount), 0);
  const totalExpenses = expenses.reduce((s, m) => s + Number(m.amount), 0);

  const expectedCash = opening + (report.by_method?.cash || 0) + totalIncomes - totalExpenses;

  if (isUnopened) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-lg mx-auto mt-10">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">Caja Cerrada</h2>
        <p className="text-gray-500 mb-8">Debes aperturar la caja del día {new Date(report.date).toLocaleDateString()} para registrar pagos y movimientos.</p>
        
        <div className="text-left mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Fondo Inicial de Caja (Efectivo dejado el turno anterior)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input 
              type="number"
              value={openingBalance || ''}
              readOnly
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-lg text-gray-600 cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            El fondo inicial se calcula automáticamente con el efectivo sobrante del último cierre. Si deseas agregar más efectivo, hazlo a través de un "Ingreso Extra" luego de abrir la caja.
          </p>
        </div>

        <button 
          onClick={handleOpenRegister}
          disabled={loading}
          className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30 transition-all active:scale-95 disabled:opacity-50 text-lg"
        >
          {loading ? 'Abriendo...' : 'Abrir Caja'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Control de Caja ({new Date(report.date).toLocaleDateString()})</h2>
          {report.is_closed ? (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">Caja Cerrada</span>
          ) : (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">Caja Abierta en Curso</span>
          )}
        </div>
        <div className="flex gap-3">
          {!report.is_closed && (
            <>
              <button onClick={() => { setMovementForm({...movementForm, type: 'expense'}); setShowMovementModal(true); }} className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold transition-colors">
                - Registrar Gasto/Retiro
              </button>
              <button onClick={() => { setMovementForm({...movementForm, type: 'income'}); setShowMovementModal(true); }} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold transition-colors">
                + Registrar Ingreso Extra
              </button>
              <button onClick={() => setShowCloseModal(true)} className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold shadow-md transition-colors ml-4">
                Realizar Cierre de Caja
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Resumen de Efectivo</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Fondo Inicial:</span>
                <span className="font-bold text-gray-800">${opening.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-green-700">
                <span>Ventas Efectivo Sistema:</span>
                <span className="font-bold">+ ${(report.by_method?.cash || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-blue-700">
                <span>Ingresos Extras / Sodexo:</span>
                <span className="font-bold">+ ${totalIncomes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-red-700">
                <span>Gastos / Retiros:</span>
                <span className="font-bold">- ${totalExpenses.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Efectivo Esperado:</span>
                  <span className="font-black text-xl text-gray-900">${expectedCash.toFixed(2)}</span>
                </div>
              </div>

              {report.is_closed && (
                <>
                  <div className="flex justify-between items-center text-gray-600 mt-2">
                    <span>Efectivo Físico Contado:</span>
                    <span className="font-bold text-gray-800">${Number(report.daily_close.counted_cash).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Diferencia:</span>
                    <span className={`font-bold ${Number(report.daily_close.difference) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      ${Number(report.daily_close.difference).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 mt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-800">Monto a Retirar (Depósito):</span>
                    <span className="font-black text-orange-600">${Number(report.daily_close.amount_to_deposit).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Otros Métodos de Pago</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Transbank (Tarjeta):</span>
                <span className="font-bold text-gray-800">${(report.by_method?.card_transbank || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Transferencias:</span>
                <span className="font-bold text-gray-800">${(report.by_method?.transfer || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Pagos Mixtos:</span>
                <span className="font-bold text-gray-800">${(report.by_method?.mixed || 0).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 mt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800">Ventas Totales Netas:</span>
                <span className="font-black text-gray-900">${report.total_sales.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Movements List */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detalle de Movimientos de Caja (Varios)</h3>
          
          {report.movements && report.movements.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Observación</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.movements.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : '-'}</td>
                      <td className="py-3 px-4">
                        {m.type === 'expense' ? 
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Retiro/Gasto</span> : 
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Ingreso Extra</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-800">{m.observation}</td>
                      <td className="py-3 px-4 text-gray-500">{m.creator?.name || '-'}</td>
                      <td className={`py-3 px-4 text-right font-bold ${m.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                        {m.type === 'expense' ? '-' : '+'}${Number(m.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
              <p className="text-gray-500">No se han registrado retiros ni ingresos extras el día de hoy.</p>
            </div>
          )}
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className={`p-4 border-b ${movementForm.type === 'expense' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
              <h3 className="font-bold text-lg">
                {movementForm.type === 'expense' ? 'Registrar Gasto / Retiro de Caja' : 'Registrar Ingreso Extra / Vale Sodexo'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Monto ($)</label>
                <input 
                  type="number" 
                  value={movementForm.amount || ''}
                  onChange={e => setMovementForm({...movementForm, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-gray-200 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observación (Motivo)</label>
                <input 
                  type="text" 
                  value={movementForm.observation}
                  onChange={e => setMovementForm({...movementForm, observation: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-gray-200 outline-none"
                  placeholder={movementForm.type === 'expense' ? 'Ej: Compra de hielo' : 'Ej: Vale Sodexo'}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowMovementModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">Cancelar</button>
              <button onClick={handleAddMovement} disabled={loading} className={`px-4 py-2 text-white rounded-xl font-bold shadow-sm ${movementForm.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {loading ? 'Guardando...' : 'Guardar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <h3 className="text-xl font-bold">Cuadratura y Cierre de Caja</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center mb-6">
                <span className="font-bold text-orange-800">Efectivo Esperado (Sistema):</span>
                <span className="text-2xl font-black text-orange-600">${expectedCash.toFixed(2)}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Efectivo Físico Contado</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="number" 
                      value={closeForm.counted_cash || ''}
                      onChange={(e) => setCloseForm({...closeForm, counted_cash: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-green-50 font-bold text-green-900 border border-green-200 rounded-xl focus:ring-green-500 focus:border-green-500 text-xl"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Diferencia (Sobrante/Faltante)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={(closeForm.counted_cash - expectedCash).toFixed(2)}
                    className={`w-full px-4 py-3 font-bold rounded-xl outline-none border text-lg
                      ${(closeForm.counted_cash - expectedCash) < 0 ? 'bg-red-50 text-red-700 border-red-200' : 
                        (closeForm.counted_cash - expectedCash) > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Monto a Retirar / Entregar (Depósito)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="number" 
                      value={closeForm.amount_to_deposit || ''}
                      onChange={(e) => setCloseForm({...closeForm, amount_to_deposit: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 font-bold text-lg"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">Efectivo final que se sacará de caja para enviar a banco o administrador.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCloseRegister}
                disabled={loading}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar Cierre Definitivo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
