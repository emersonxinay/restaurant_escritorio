import React from 'react';
import QRCode from 'react-qr-code';

interface OrderItemType {
  product?: { name: string; price: number };
  product_name?: string;
  price?: number;
  quantity: number;
  notes?: string;
}

interface PrintableTicketProps {
  order: any;
  type: 'kitchen' | 'receipt';
  stationName?: string;
  itemsOverride?: any[]; // Allow passing specific items to override order.items (for reprinting by station)
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ order, type, stationName, itemsOverride }) => {
  if (!order) return null;

  const items = itemsOverride || (order.order_items && order.order_items.length > 0 ? order.order_items : order.items || []);
  
  return (
    <div className={`printable-ticket hidden print:block absolute top-0 left-0 w-[80mm] bg-white text-black font-mono p-2 z-[9999] ${type === 'kitchen' ? 'text-base' : 'text-sm'}`}>
      <div className="text-center mb-4">
        {type === 'receipt' && (
          <>
            <h1 className="text-xl font-bold uppercase">Nombre Restaurante</h1>
            <p className="text-xs">RUC: 12345678-9</p>
            <p className="text-xs">Dirección del Local 123</p>
            <p className="text-xs mb-2">Tel: +56 9 1234 5678</p>
            <h2 className="text-lg font-bold border-b border-black border-dashed pb-1 mb-2">BOLETA DE VENTA</h2>
          </>
        )}
        {type === 'kitchen' && (
          <>
            <h2 className="text-2xl font-black uppercase mb-1 border-b-2 border-black border-solid pb-1">
              === {stationName || 'COCINA'} ===
            </h2>
            <div className="flex justify-center my-3">
              <QRCode value={order.order_number || ''} size={64} level="L" />
            </div>
          </>
        )}
        
        <div className={`text-left flex flex-col gap-0.5 ${type === 'kitchen' ? 'text-sm mb-3' : 'text-xs mb-2'}`}>
          <p className={type === 'kitchen' ? 'font-bold text-lg' : ''}><strong>Orden:</strong> #{order.order_number}</p>
          <p><strong>Fecha:</strong> {new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p>
            <strong>Atendió:</strong> {order.waiter?.name || order.cashier?.name || order.customer_name || 'Sistema'}
          </p>
          {order.delivery_type === 'dine_in' ? (
            <p className="text-xl font-black border-2 border-black p-1 text-center mt-2">MESA {order.table_id || order.table?.number}</p>
          ) : (
            <p className="text-lg font-bold mt-1"><strong>Tipo:</strong> {order.delivery_type === 'delivery' ? 'Delivery' : 'Para Llevar'}</p>
          )}
          {type === 'kitchen' && order.delivery_type === 'delivery' && order.delivery_address && (
            <p className="mt-1"><strong>Dir:</strong> {order.delivery_address}</p>
          )}
        </div>
      </div>

      <table className={`w-full mb-4 ${type === 'kitchen' ? 'text-base' : 'text-xs'}`}>
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="text-left py-1 w-10">Cant</th>
            <th className="text-left py-1">Descripción</th>
            {type === 'receipt' && <th className="text-right py-1">Total</th>}
          </tr>
        </thead>
        <tbody className="align-top">
          {items.map((item: OrderItemType, idx: number) => (
            <React.Fragment key={idx}>
              <tr className={type === 'kitchen' ? 'border-b border-gray-200 border-dashed' : ''}>
                <td className="py-2 font-black text-lg align-top">{item.quantity}</td>
                <td className="py-2 align-top">
                  <span className={type === 'kitchen' ? 'font-bold text-lg leading-tight block' : ''}>
                    {item.product?.name || item.product_name}
                  </span>
                  {type === 'kitchen' && item.notes && (
                    <div className="text-sm font-bold italic mt-1 uppercase border border-black p-1 rounded-sm inline-block">
                      *** {item.notes} ***
                    </div>
                  )}
                </td>
                {type === 'receipt' && (
                  <td className="text-right py-2 align-top">
                    ${((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}
                  </td>
                )}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {type === 'receipt' && (
        <div className="border-t border-black border-dashed pt-2 text-xs flex flex-col gap-1">
          <div className="flex justify-between font-bold">
            <span>Subtotal:</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
          {Number(order.tip_amount || 0) > 0 && (
            <div className="flex justify-between">
              <span>Propina (10%):</span>
              <span>${Number(order.tip_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(order.discount_amount || 0) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento:</span>
              <span>-${Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-black border-solid">
            <span>TOTAL:</span>
            <span>${(Number(order.total) + Number(order.tip_amount || 0) - Number(order.discount_amount || 0)).toFixed(2)}</span>
          </div>
          {order.payment_status && (
            <div className="text-center mt-4">
              <span className="border border-black px-2 py-1 uppercase font-bold text-[10px]">
                {order.payment_status === 'paid' ? 'PAGADO' : order.payment_status}
              </span>
            </div>
          )}
        </div>
      )}

      {type === 'kitchen' && (
        <div className="text-center mt-6 pt-2 border-t-2 border-black border-dashed">
          <p className="text-sm font-bold">FIN DE COMANDA</p>
          <p className="text-xs mt-1">---</p>
        </div>
      )}

      <div className="text-center text-[10px] mt-6 italic">
        {type === 'receipt' ? '¡Gracias por su preferencia!' : 'Impreso desde Sistema Hazuki'}
      </div>
    </div>
  );
};
