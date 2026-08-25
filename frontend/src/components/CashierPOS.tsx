import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { Icon, Icons } from '../utils/icons';
import DeliveryMap from './DeliveryMap';
import { cashierAPI } from '../services/cashierService';

export default function CashierPOS() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<any[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>(undefined);
  const [deliveryLng, setDeliveryLng] = useState<number | undefined>(undefined);
  const [deliveryStreetNumber, setDeliveryStreetNumber] = useState('');
  const [deliveryPropertyType, setDeliveryPropertyType] = useState('house');
  const [deliveryApartmentNumber, setDeliveryApartmentNumber] = useState('');
  const [deliveryReferences, setDeliveryReferences] = useState('');
  const [isDeliveryValid, setIsDeliveryValid] = useState(true);
  const [notes, setNotes] = useState('');
  
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_transbank' | 'mixed'>('cash');
  const [tipInput, setTipInput] = useState('0');
  const [tipType, setTipType] = useState<'percent'|'fixed'>('percent');
  const [cashReceived, setCashReceived] = useState('');
  const [mixedCash, setMixedCash] = useState('');
  const [mixedCard, setMixedCard] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/public/categories'),
        api.get('/public/products')
      ]);
      const categoriesData = catsRes.data.categories || catsRes.data || [];
      const productsData = prodsRes.data.products || prodsRes.data || [];
      
      setCategories(categoriesData);
      setProducts(productsData);
      
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    } else if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory);
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + (deliveryType === 'delivery' ? Number(deliveryFee) : 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const updateItemNotes = (id: number, notes: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  };

  const computedTip = useMemo(() => {
    const val = Number(tipInput) || 0;
    if (tipType === 'percent') {
      return Math.round(total * (val / 100));
    }
    return val;
  }, [tipInput, tipType, total]);

  const finalTotal = total + computedTip;

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    if (!customerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      alert('Ingresa la dirección de entrega');
      return;
    }
    // Default 10% tip if it's dine-in or to-go, maybe 0 for now
    setTipInput('0');
    setPaymentMethod('cash');
    setCashReceived('');
    setMixedCash('');
    setMixedCard('');
    setShowPaymentModal(true);
  };

  const handleProcessOrderAndPayment = async () => {
    try {
      setSubmitting(true);
      
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : undefined,
        delivery_lat: deliveryType === 'delivery' ? deliveryLat : undefined,
        delivery_lng: deliveryType === 'delivery' ? deliveryLng : undefined,
        delivery_street_number: deliveryType === 'delivery' ? deliveryStreetNumber : undefined,
        delivery_property_type: deliveryType === 'delivery' ? deliveryPropertyType : undefined,
        delivery_apartment_number: deliveryType === 'delivery' ? deliveryApartmentNumber : undefined,
        delivery_references: deliveryType === 'delivery' ? deliveryReferences : undefined,
        delivery_fee: deliveryType === 'delivery' ? Number(deliveryFee) : 0,
        subtotal,
        total, // The backend expects the base total. Tip is calculated from excess payment.
        notes,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        }))
      };

      const res = await api.post('/orders', orderData);
      const newOrder = res.data.order || res.data;
      
      if (newOrder && newOrder.id) {
        // Process Payment
        if (paymentMethod === 'mixed') {
          const cashToRegister = Number(mixedCash) || 0;
          const cardToRegister = Number(mixedCard) || 0;
          if (cashToRegister > 0) {
            await cashierAPI.processPayment(newOrder.id, { amount: cashToRegister, method: 'cash' });
          }
          if (cardToRegister > 0) {
            await cashierAPI.processPayment(newOrder.id, { amount: cardToRegister, method: 'card_transbank' });
          }
        } else {
          await cashierAPI.processPayment(newOrder.id, {
            amount: finalTotal,
            method: paymentMethod
          });
        }

        // Set status back to confirmed so it goes to KDS
        await api.patch(`/orders/${newOrder.id}/status`, { status: 'confirmed' });

        // Auto-print the ticket for the customer
        try {
          await cashierAPI.reprintOrder(newOrder.id);
        } catch (printErr) {
          console.error("Error al imprimir el ticket", printErr);
          // We don't block the flow if printing fails
        }
      }

      setShowPaymentModal(false);
      alert('Pedido y Pago registrados exitosamente. Imprimiendo ticket...');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryType('pickup');
      setDeliveryAddress('');
      setDeliveryFee(0);
      setDeliveryLat(undefined);
      setDeliveryLng(undefined);
      setDeliveryStreetNumber('');
      setDeliveryPropertyType('house');
      setDeliveryApartmentNumber('');
      setDeliveryReferences('');
      setIsDeliveryValid(true);
      setCustomerHistory(null);
      setNotes('');
      
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al procesar el pedido o pago');
    } finally {
      setSubmitting(false);
    }
  };

  // Búsqueda automática al escribir el teléfono
  useEffect(() => {
    if (customerPhone && customerPhone.length >= 8) {
      const delayDebounceFn = setTimeout(() => {
        if (!isSearchingCustomer) handleSearchCustomer();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (customerPhone.length === 0) {
      setCustomerHistory(null);
    }
  }, [customerPhone]);

  const handleSearchCustomer = async () => {
    if (!customerPhone || customerPhone.length < 5) return;
    setIsSearchingCustomer(true);
    try {
      const response = await api.get(`/orders/customer/${customerPhone}`);
      const data = response.data;
      
      if (!customerName) setCustomerName(data.name || '');
      setCustomerHistory(data);
      
      // Auto-fill delivery details if in delivery mode
      if (deliveryType === 'delivery' && data.last_delivery_address) {
        setDeliveryAddress(data.last_delivery_address);
        if (data.last_delivery_lat) setDeliveryLat(data.last_delivery_lat);
        if (data.last_delivery_lng) setDeliveryLng(data.last_delivery_lng);
        setDeliveryStreetNumber(data.last_delivery_street_number || '');
        setDeliveryPropertyType(data.last_delivery_property_type || 'house');
        setDeliveryApartmentNumber(data.last_delivery_apartment_number || '');
        setDeliveryReferences(data.last_delivery_references || '');
        setIsDeliveryValid(true);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error searching customer:', error);
      } else {
        alert('No se encontró historial para este número.');
      }
      setCustomerHistory(null);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleRepeatOrder = (order: any) => {
    const newCart = order.order_items.map((item: any) => ({
      id: item.product?.id || item.product_id,
      name: item.product?.name || item.product_name,
      price: item.product?.price || item.price,
      quantity: item.quantity,
      image_url: item.product?.image_url
    }));
    setCart(newCart);
    
    if (order.delivery_type === 'delivery') {
      setDeliveryType('delivery');
      if (order.delivery_address) setDeliveryAddress(order.delivery_address);
      if (order.delivery_lat) setDeliveryLat(order.delivery_lat);
      if (order.delivery_lng) setDeliveryLng(order.delivery_lng);
      if (order.delivery_street_number) setDeliveryStreetNumber(order.delivery_street_number);
      if (order.delivery_property_type) setDeliveryPropertyType(order.delivery_property_type);
      if (order.delivery_apartment_number) setDeliveryApartmentNumber(order.delivery_apartment_number);
      if (order.delivery_references) setDeliveryReferences(order.delivery_references);
      if (order.delivery_fee) setDeliveryFee(order.delivery_fee);
    } else if (order.delivery_type) {
      setDeliveryType(order.delivery_type);
    }
    
    setShowCustomerHistory(false);
  };

  if (loading) return <div className="p-8 text-center"><Icon icon={Icons.spinner} className="animate-spin mx-auto text-orange-500 mb-2" size="lg" />Cargando...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Catálogo */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Búsqueda */}
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar producto por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 p-4 border-b bg-gray-50 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 border hover:bg-orange-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 overflow-hidden cursor-pointer flex flex-col active:scale-95 transition-transform"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <Icon icon={Icons.image} className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="p-3 border-t bg-white flex flex-col justify-between flex-1">
                  <span className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{product.name}</span>
                  <span className="text-orange-600 font-semibold mt-1">${product.price.toLocaleString('es-CL')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrito y Formulario */}
      <div className="w-full md:w-[400px] bg-white rounded-lg shadow-sm border flex flex-col flex-shrink-0">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800">Nuevo Pedido</h2>
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Opciones de pedido */}
          <div className="space-y-4 mb-6">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${deliveryType === 'to_go' ? 'bg-white shadow text-purple-700' : 'text-gray-600'}`}
                onClick={() => setDeliveryType('to_go')}
              >
                Para Llevar
              </button>
              <button 
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${deliveryType === 'pickup' ? 'bg-white shadow text-purple-700' : 'text-gray-600'}`}
                onClick={() => setDeliveryType('pickup')}
              >
                Retiro
              </button>
              <button 
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${deliveryType === 'delivery' ? 'bg-white shadow text-purple-700' : 'text-gray-600'}`}
                onClick={() => setDeliveryType('delivery')}
              >
                Delivery
              </button>
              <button 
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${deliveryType === 'dine_in' ? 'bg-white shadow text-purple-700' : 'text-gray-600'}`}
                onClick={() => setDeliveryType('dine_in')}
              >
                Mesa
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                  placeholder="Nombre..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (customerHistory) setShowCustomerHistory(true);
                        else handleSearchCustomer();
                      }
                    }}
                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                    placeholder="Ej. 987654321"
                  />
                  <button
                    onClick={handleSearchCustomer}
                    disabled={isSearchingCustomer || !customerPhone}
                    className="bg-gray-100 hover:bg-gray-200 border rounded px-3 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Buscar cliente"
                  >
                    {isSearchingCustomer ? (
                      <Icon icon={Icons.spinner} size="sm" className="animate-spin text-gray-500" />
                    ) : (
                      <Icon icon={Icons.search} size="sm" className="text-gray-600" />
                    )}
                  </button>
                </div>
                {customerHistory && (
                  <button 
                    onClick={() => setShowCustomerHistory(true)}
                    className="mt-2 w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold py-2 px-3 rounded text-xs flex justify-between items-center transition-colors shadow-sm animate-pulse-once"
                  >
                    <span className="flex items-center gap-1">
                      <Icon icon={Icons.history} size="sm" />
                      Historial del Cliente
                    </span>
                    <span className="bg-blue-600 text-white py-0.5 px-2 rounded-full">
                      {customerHistory.total_orders}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="space-y-3">
                <div className="border border-orange-200 rounded-lg overflow-hidden bg-white">
                  <DeliveryMap 
                    onLocationSelect={(lat, lng, _dist, fee, addr) => {
                      setDeliveryLat(lat);
                      setDeliveryLng(lng);
                      setDeliveryFee(fee);
                      setDeliveryAddress(addr);
                    }}
                    onValidityChange={setIsDeliveryValid}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección del Mapa (Solo lectura)</label>
                  <input 
                    type="text" 
                    value={deliveryAddress}
                    readOnly
                    className="w-full border rounded p-2 text-sm bg-gray-50 outline-none text-gray-700" 
                    placeholder="La dirección aparecerá aquí..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nº de Casa / Edificio</label>
                    <input 
                      type="text" 
                      value={deliveryStreetNumber}
                      onChange={e => setDeliveryStreetNumber(e.target.value)}
                      className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                    <select
                      value={deliveryPropertyType}
                      onChange={e => setDeliveryPropertyType(e.target.value)}
                      className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                    >
                      <option value="house">Casa</option>
                      <option value="apartment">Departamento / Oficina</option>
                    </select>
                  </div>
                  {deliveryPropertyType !== 'house' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nº Depto / Oficina</label>
                      <input 
                        type="text" 
                        value={deliveryApartmentNumber}
                        onChange={e => setDeliveryApartmentNumber(e.target.value)}
                        className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Referencias extra</label>
                    <input 
                      type="text" 
                      value={deliveryReferences}
                      onChange={e => setDeliveryReferences(e.target.value)}
                      className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none" 
                      placeholder="Portón negro, dejar en conserjería..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nota del Pedido (Para Cocina)</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-orange-500 outline-none resize-none h-16" 
                placeholder="Sin ají, extra salsa..."
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-3">Detalle</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Agrega productos del catálogo</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-sm line-clamp-1">{item.name}</div>
                        <div className="text-orange-600 text-xs mt-0.5">
                          <span className="text-gray-500 font-medium">${item.price.toLocaleString('es-CL')} x {item.quantity}</span> 
                          <span className="font-bold ml-1">= ${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded border border-gray-200">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l">-</button>
                        <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r">+</button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Nota (ej. sin sal)"
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer con Totales y Botón */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString('es-CL')}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Delivery:</span>
                <span>${Number(deliveryFee).toLocaleString('es-CL')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
              <span>Total:</span>
              <span>${total.toLocaleString('es-CL')}</span>
            </div>
          </div>
          
          <button
            onClick={handleOpenPayment}
            disabled={
              submitting || 
              cart.length === 0 || 
              (deliveryType === 'delivery' && (!isDeliveryValid || !deliveryAddress || !deliveryStreetNumber))
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon={Icons.check} className="w-5 h-5" />
            Cobrar y Enviar a Cocina
          </button>
        </div>
      </div>

      {/* Customer History Modal */}
      {showCustomerHistory && customerHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Historial de {customerHistory.name || 'Cliente'}</h3>
                <p className="text-sm text-gray-500">{customerPhone} • {customerHistory.total_orders} pedidos en total</p>
              </div>
              <button onClick={() => setShowCustomerHistory(false)} className="text-gray-500 hover:text-gray-700">
                <Icon icon={Icons.close} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 space-y-4">
              {customerHistory.history.map((order: any) => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3 border-b pb-2">
                    <div>
                      <span className="font-bold text-gray-700">Pedido #{order.order_number}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-orange-600">${Number(order.total).toLocaleString()}</span>
                      <button 
                        onClick={() => handleRepeatOrder(order)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <Icon icon={Icons.refresh} size="sm" />
                        Repetir Pedido
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {order.order_items.map((item: any) => (
                      <li key={item.id} className="text-sm text-gray-700 flex justify-between">
                        <span><span className="font-bold text-gray-500">{item.quantity}x</span> {item.product?.name || item.product_name}</span>
                      </li>
                    ))}
                  </ul>
                  {order.delivery_type === 'delivery' && order.delivery_address && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-start gap-1">
                      <Icon icon={Icons.location} size="sm" className="mt-0.5 flex-shrink-0" />
                      <span>{order.delivery_address} {order.delivery_street_number ? `#${order.delivery_street_number}` : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Registrar Pago</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <Icon icon={Icons.close} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center text-lg text-gray-600">
                <span>Subtotal:</span>
                <span className="font-bold">${Number(total).toLocaleString('es-CL')}</span>
              </div>

              {/* Tip Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-lg text-gray-600">
                  <span>Propina:</span>
                  <div className="text-right">
                    <span className="font-bold text-orange-500">${computedTip.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end items-center">
                  <button 
                    onClick={() => { setTipType('percent'); setTipInput('0'); }}
                    className={`px-3 py-1 text-sm rounded border ${Number(tipInput) === 0 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    0%
                  </button>
                  <button 
                    onClick={() => { setTipType('percent'); setTipInput('10'); }}
                    className={`px-3 py-1 text-sm rounded border ${tipType === 'percent' && tipInput === '10' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    10%
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-2xl text-gray-900 font-black border-t pt-4 border-b pb-4">
                <span>Total a Cobrar:</span>
                <span>${finalTotal.toLocaleString('es-CL')}</span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 flex flex-col items-center justify-center rounded-lg border-2 transition-colors ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Icon icon={Icons.wallet} size="lg" className="mb-1" />
                    <span className="font-bold text-sm">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card_transbank')}
                    className={`py-3 flex flex-col items-center justify-center rounded-lg border-2 transition-colors ${paymentMethod === 'card_transbank' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Icon icon={Icons.card} size="lg" className="mb-1" />
                    <span className="font-bold text-sm">Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mixed')}
                    className={`py-3 flex flex-col items-center justify-center rounded-lg border-2 transition-colors ${paymentMethod === 'mixed' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Icon icon={Icons.list} size="lg" className="mb-1" />
                    <span className="font-bold text-sm">Mixto</span>
                  </button>
                </div>
              </div>

              {/* Cash Payment Inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Monto Entregado por Cliente</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="w-full px-3 py-3 border rounded-md focus:ring-2 focus:ring-orange-500 font-bold text-lg"
                      placeholder={`Ej: ${finalTotal + 5000}`}
                    />
                  </div>
                  {(Number(cashReceived) || 0) > finalTotal && (
                    <div className="flex justify-between items-center text-xl text-green-700 font-black pt-2 border-t border-green-200">
                      <span>Vuelto a entregar:</span>
                      <span>${(Number(cashReceived) - finalTotal).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {(Number(cashReceived) || 0) > 0 && (Number(cashReceived) || 0) < finalTotal && (
                    <div className="text-red-500 font-bold text-sm">
                      Faltan ${(finalTotal - Number(cashReceived)).toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              )}

              {/* Mixed Payment Inputs */}
              {paymentMethod === 'mixed' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Monto en Efectivo</label>
                    <input
                      type="number"
                      value={mixedCash}
                      onChange={e => {
                        setMixedCash(e.target.value);
                        const remainder = finalTotal - (Number(e.target.value) || 0);
                        if (remainder > 0) setMixedCard(remainder.toString());
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ej: 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Monto en Tarjeta</label>
                    <input
                      type="number"
                      value={mixedCard}
                      onChange={e => setMixedCard(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ej: 10000"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleProcessOrderAndPayment}
                disabled={
                  submitting || 
                  (paymentMethod === 'mixed' && ((Number(mixedCash) || 0) + (Number(mixedCard) || 0) < finalTotal)) ||
                  (paymentMethod === 'cash' && (Number(cashReceived) || 0) > 0 && (Number(cashReceived) || 0) < finalTotal)
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Icon icon={Icons.refresh} className="animate-spin w-5 h-5" />
                ) : (
                  <Icon icon={Icons.check} className="w-5 h-5" />
                )}
                {submitting ? 'Procesando Pago y Orden...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
