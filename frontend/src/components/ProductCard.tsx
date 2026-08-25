import { useState } from 'react';
import ProductImage from './ProductImage';
import { Icon, Icons } from '../utils/icons';

interface ProductCardProps {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  isPopular?: boolean;
  isSpecial?: boolean;
  rating?: number;
  onAddToCart: (quantity: number) => void;
}

export default function ProductCard({

  name,
  description,
  price,
  image_url,
  isPopular = false,
  isSpecial = false,
  rating = 4.8,
  onAddToCart,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    setQuantity(1); // Reset after adding
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-gray-100">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {isPopular && (
          <div className="bg-gradient-hazuki text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
            <Icon icon={Icons.fire} size="sm" />
            POPULAR
          </div>
        )}
        {isSpecial && (
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
            <Icon icon={Icons.star} size="sm" />
            ESPECIAL
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gray-200">
        <ProductImage
          imageUrl={image_url}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          containerClassName="relative w-full h-full overflow-hidden bg-gray-200"
          showFallbackIcon={true}
        />

        {/* Overlay gradiente en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Title y Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg md:text-xl font-bold text-hazuki-text-dark leading-tight flex-1 group-hover:text-hazuki-orange transition-colors">
            {name}
          </h3>
          {rating && (
            <div className="flex items-center gap-1 ml-2 whitespace-nowrap">
              <span className="text-xs md:text-sm font-semibold text-hazuki-gray-medium">{rating}</span>
              <Icon icon={Icons.star} size="sm" className="text-yellow-400" />
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs md:text-sm text-hazuki-gray-medium line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-black bg-gradient-hazuki bg-clip-text text-transparent">
              ${price.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mb-4 bg-hazuki-bg-light rounded-lg p-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-hazuki-gray-light rounded text-lg font-bold text-hazuki-text-dark transition-colors"
          >
            −
          </button>
          <span className="flex-1 text-center font-bold text-hazuki-text-dark">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-hazuki-gray-light rounded text-lg font-bold text-hazuki-text-dark transition-colors"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            isAdded
              ? 'bg-green-500 shadow-lg'
              : 'bg-gradient-hazuki hover:shadow-glow-red transform hover:scale-105'
          }`}
        >
          {isAdded ? (
            <>
              <span>✓ Añadido</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2"><Icon icon={Icons.cart} size="sm" /> Añadir</span>
            </>
          )}
        </button>

        {/* Trust Badge */}
        <div className="mt-3 text-xs text-hazuki-gray-medium text-center border-t border-hazuki-gray-light pt-2">
          ✓ Ingredientes Premium • Preparación Fresca
        </div>
      </div>
    </div>
  );
}
