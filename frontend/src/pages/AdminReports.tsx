import React, { useState, useEffect } from 'react';
import { cashierAPI } from '../services/cashierService';
import * as xlsx from 'xlsx';

export default function AdminReports() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closes, setCloses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCloses = async () => {
    try {
      setLoading(true);
      const data = await cashierAPI.getMonthlyCloses(month);
      setCloses(data);
    } catch (error) {
      console.error('Error fetching closes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloses();
  }, [month]);

  const handleExportExcel = () => {
    if (closes.length === 0) return alert("No hay datos para exportar");

    // Format data to match exactly their "Cuadratura" sheet
    const dataToExport = closes.map(close => ({
      'Dia': new Date(close.date).toLocaleDateString(),
      'Boleta inicial': '',
      'Boleta Final': '',
      'monto ventas': Number(close.total_sales).toFixed(2),
      'Monto ventas Sin IVA': (Number(close.total_sales) / 1.19).toFixed(2), // Assumes 19% IVA, modify if different
      'Transbank': Number(close.total_card).toFixed(2),
      'monto sodexo y otros': (Number(close.total_other) + Number(close.extra_incomes)).toFixed(2), // Incorporating extra incomes here for simplicity or creating its own column
      'retiros': Number(close.withdrawals).toFixed(2),
      'saldo caja inicio': Number(close.opening_balance).toFixed(2),
      'Saldo Efectivo': Number(close.expected_cash).toFixed(2),
      'Digite el Efectivo en Caja Real': Number(close.counted_cash).toFixed(2),
      'diferencia': Number(close.difference).toFixed(2),
      'Monto a Retirar': Number(close.amount_to_deposit).toFixed(2),
      'entegado': ''
    }));

    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Cuadratura");
    
    // Save
    xlsx.writeFile(wb, `Cuadratura_${month}.xlsx`);
  };

  const totalSales = closes.reduce((sum, c) => sum + Number(c.total_sales), 0);
  const totalDifference = closes.reduce((sum, c) => sum + Number(c.difference), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cierres de Caja</h1>
          <p className="text-gray-500 font-medium mt-1">Historial y cuadratura mensual</p>
        </div>

        <div className="flex gap-4 items-center">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 shadow-sm"
          />
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ventas del Mes</p>
            <p className="text-3xl font-black text-gray-900 mt-1">${totalSales.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Días Cerrados</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{closes.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Balance Diferencias</p>
            <p className={`text-3xl font-black mt-1 ${totalDifference < 0 ? 'text-red-600' : totalDifference > 0 ? 'text-blue-600' : 'text-green-600'}`}>
              ${totalDifference.toFixed(2)}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${totalDifference < 0 ? 'bg-red-100 text-red-600' : totalDifference > 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Día</th>
                <th className="p-4">Cajero</th>
                <th className="p-4 text-right">Fondo Inicio</th>
                <th className="p-4 text-right">Ventas Totales</th>
                <th className="p-4 text-right">Efectivo Sistema</th>
                <th className="p-4 text-right bg-gray-100/50">Efectivo Físico</th>
                <th className="p-4 text-right">Diferencia</th>
                <th className="p-4 text-right text-orange-600">Retiro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Cargando...</td></tr>
              ) : closes.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No hay cierres registrados en este mes.</td></tr>
              ) : (
                closes.map((close) => (
                  <tr key={close.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                      {new Date(close.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600">
                      {close.cashier?.name || 'Desconocido'}
                    </td>
                    <td className="p-4 text-right text-gray-600 font-medium">
                      ${Number(close.opening_balance).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-gray-900 font-bold">
                      ${Number(close.total_sales).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-gray-600 font-medium">
                      ${Number(close.expected_cash).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-black text-green-700 bg-green-50/30">
                      ${Number(close.counted_cash).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs
                        ${Number(close.difference) < 0 ? 'bg-red-100 text-red-700' : 
                          Number(close.difference) > 0 ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {Number(close.difference) > 0 ? '+' : ''}{Number(close.difference).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-orange-600">
                      ${Number(close.amount_to_deposit).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
