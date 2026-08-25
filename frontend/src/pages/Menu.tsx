import { useEffect, useState, useMemo } from 'react';
import MainLayout from '../layouts/MainLayout';
import ProductCard from '../components/ProductCard';
import { useCartStore } from '../stores/cartStore';
import { useAppDataStore, Product } from '../stores/appDataStore';
import { Icon, Icons } from '../utils/icons';
import { useAuth } from '../hooks/useAuth';

export default function Menu() {
  const menuStructure = useAppDataStore((state) => state.menuStructure);
  const hasFetchedMenu = useAppDataStore((state) => state.hasFetchedMenu);
  const fetchMenuData = useAppDataStore((state) => state.fetchMenuData);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(!hasFetchedMenu);
  const [expandedMainCategories, setExpandedMainCategories] = useState<Set<number>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(new Set());
  const { addItem, activeTableId } = useCartStore();
  const { user } = useAuth();

  // Track which main categories should be expanded by default
  const [initialExpand, setInitialExpand] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!hasFetchedMenu) {
        setLoading(true);
        await fetchMenuData();
        setLoading(false);
      }
    };
    initData();
  }, [hasFetchedMenu, fetchMenuData]);

  useEffect(() => {
    if (menuStructure.length > 0 && !initialExpand) {
      const mainCatIds = new Set(menuStructure.map(cat => cat.id));
      const subCatIds = new Set(menuStructure.flatMap(mainCat => mainCat.subcategories.map(sub => sub.id)));
      setExpandedMainCategories(mainCatIds);
      setExpandedSubcategories(subCatIds);
      setInitialExpand(true);
    }
  }, [menuStructure, initialExpand]);

  // Lógica de búsqueda: filtrar productos por nombre y descripción
  const filteredMenuStructure = useMemo(() => {
    if (!searchTerm.trim()) {
      return menuStructure;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return menuStructure
      .map((mainCat) => ({
        ...mainCat,
        subcategories: mainCat.subcategories
          .map((subCat) => ({
            ...subCat,
            products: subCat.products.filter((product) =>
              product.name.toLowerCase().includes(lowerSearchTerm) ||
              product.description?.toLowerCase().includes(lowerSearchTerm)
            ),
          }))
          .filter((subCat) => subCat.products.length > 0), // Solo mostrar subcategorías con resultados
      }))
      .filter((mainCat) => mainCat.subcategories.length > 0); // Solo mostrar categorías principales con resultados
  }, [menuStructure, searchTerm]);

  // Contar total de productos visibles
  const totalVisibleProducts = useMemo(() => {
    return filteredMenuStructure.reduce((total, mainCat) => {
      return (
        total +
        mainCat.subcategories.reduce(
          (subTotal, subCat) => subTotal + subCat.products.length,
          0
        )
      );
    }, 0);
  }, [filteredMenuStructure]);

  const toggleMainCategory = (categoryId: number) => {
    setExpandedMainCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: number) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image_url: product.image_url,
    });
  };

  return (
    <MainLayout>
      {/* Waiter Banner */}
      {activeTableId && user?.role === 'waiter' && (
        <div className="bg-orange-600 text-white font-bold py-3 px-4 rounded-lg mb-6 flex justify-between items-center shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Icon icon={Icons.utensils} size="md" />
            <span className="text-lg">Tomando pedido para la Mesa {activeTableId}</span>
          </div>
          <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider shadow-sm">
            Modo Mesero
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-hazuki bg-clip-text text-transparent">
          Nuestro Menú Completo
        </h1>
        <p className="text-hazuki-gray-medium text-lg max-w-2xl">
          Explora nuestras deliciosas opciones de sushi y comida peruana. Todos nuestros productos están elaborados con ingredientes premium y preparados con cuidado.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-10">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 md:py-4 pl-12 rounded-lg border-2 border-hazuki-gray-light focus:border-hazuki-orange focus:outline-none transition-colors text-hazuki-text-dark placeholder-hazuki-gray-medium"
          />
          <Icon
            icon={Icons.search}
            size="md"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-hazuki-gray-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-hazuki-gray-medium hover:text-hazuki-text-dark transition-colors"
              title="Limpiar búsqueda"
            >
              <Icon icon={Icons.close} size="md" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="text-5xl mb-4 text-orange-600">
              <Icon icon={Icons.plate} size="xl" />
            </div>
            <p className="text-hazuki-gray-medium text-lg">Cargando menú delicioso...</p>
          </div>
        </div>
      ) : filteredMenuStructure.length === 0 ? (
        <div className="text-center py-16 bg-hazuki-bg-light rounded-2xl">
          <div className="inline-block">
            <div className="text-5xl mb-4 text-red-500">
              <Icon icon={Icons.info} size="xl" />
            </div>
            <p className="text-hazuki-gray-medium text-lg">
              {searchTerm
                ? 'No encontramos productos que coincidan con tu búsqueda'
                : 'No hay productos disponibles en este momento'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 bg-gradient-hazuki text-white font-bold px-6 py-2 rounded-lg hover:shadow-glow-red transition-all"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <p className="text-hazuki-gray-medium mb-8">
            Mostrando <span className="font-bold text-hazuki-orange">{totalVisibleProducts}</span> producto
            {totalVisibleProducts !== 1 ? 's' : ''}
            {searchTerm && (
              <span className="ml-2 text-sm">para "{searchTerm}"</span>
            )}
          </p>

          {/* Menu Structure with Accordions */}
          {filteredMenuStructure.map((mainCategory) => (
            <div key={mainCategory.id} className="mb-6 border border-hazuki-gray-light rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Main Category Accordion Header */}
              <button
                onClick={() => toggleMainCategory(mainCategory.id)}
                className="w-full px-6 py-4 md:py-5 flex items-center justify-between hover:bg-hazuki-bg-light transition-colors bg-white"
              >
                <h2 className="text-2xl md:text-3xl font-black text-hazuki-text-dark text-left">
                  {mainCategory.name}
                </h2>
                <div className={`text-hazuki-orange text-2xl transition-transform duration-300 ${
                  expandedMainCategories.has(mainCategory.id) ? 'rotate-180' : ''
                }`}>
                  <Icon icon={Icons.chevronDown} size="lg" />
                </div>
              </button>

              {/* Main Category Content */}
              {expandedMainCategories.has(mainCategory.id) && (
                <div className="border-t border-hazuki-gray-light px-6 py-6 space-y-4">
                  {/* Subcategories */}
                  {mainCategory.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="border border-hazuki-gray-light rounded-lg bg-hazuki-bg-light">
                      {/* Subcategory Accordion Header */}
                      <button
                        onClick={() => toggleSubcategory(subcategory.id)}
                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white transition-colors"
                      >
                        <h3 className="text-lg md:text-xl font-bold text-hazuki-orange flex items-center gap-3">
                          <span className="w-1 h-6 bg-hazuki-orange rounded-full"></span>
                          {subcategory.name}
                        </h3>
                        <div className={`text-hazuki-orange transition-transform duration-300 ${
                          expandedSubcategories.has(subcategory.id) ? 'rotate-180' : ''
                        }`}>
                          <Icon icon={Icons.chevronDown} size="md" />
                        </div>
                      </button>

                      {/* Subcategory Content - Products Grid */}
                      {expandedSubcategories.has(subcategory.id) && (
                        <div className="border-t border-hazuki-gray-light p-5 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subcategory.products.map((product) => (
                                <ProductCard
                                  key={product.id}
                                  {...product}
                                  onAddToCart={(qty) => handleAddToCart(product, qty)}
                                />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Bottom CTA */}
      {!loading && totalVisibleProducts > 0 && (
        <div className="bg-gradient-hazuki rounded-2xl p-8 md:p-12 text-white text-center mt-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            ¿Listo para pedir?
          </h2>
          <p className="text-lg mb-6 text-yellow-100">
            Selecciona tus productos favoritos y confirma tu pedido. Entregaremos en 30 minutos a 1 hora.
          </p>
          <p className="text-sm text-gray-100 flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Icon icon={Icons.check} size="sm" />
              Ingredientes Premium
            </span>
            •
            <span className="flex items-center gap-1">
              <Icon icon={Icons.delivery} size="sm" />
              Entrega Rápida
            </span>
            •
            <span className="flex items-center gap-1">
              <Icon icon={Icons.star} size="sm" />
              Garantía Satisfecho o te devolvemos tu dinero
            </span>
          </p>
        </div>
      )}
    </MainLayout>
  );
}
