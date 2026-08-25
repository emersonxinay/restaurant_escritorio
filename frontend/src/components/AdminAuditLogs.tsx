import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: any;
  created_at: string;
  user?: {
    id: number;
    name: string | null;
    username: string;
    role: string;
  } | null;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/audit-logs');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ORDER_CREATED': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Creación Pedido</span>;
      case 'ORDER_CANCELLED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Anulación Pedido</span>;
      case 'TABLE_FREED': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Mesa Liberada</span>;
      case 'PAYMENT_PROCESSED': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Cobro Procesado</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{action}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold">Registro de Actividad</h2>
        <button 
          onClick={fetchLogs}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="Actualizar registros"
        >
          <Icon icon={Icons.refresh} size="sm" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Cargando registros...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay actividad registrada.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{log.user.name || log.user.username}</div>
                        <div className="text-gray-500 text-xs">{log.user.role}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sistema / Anónimo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionLabel(log.action)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <pre className="whitespace-pre-wrap font-sans text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
