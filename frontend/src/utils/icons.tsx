import React from 'react';

/**
 * FontAwesome Icon Component Wrapper
 * Proporciona un sistema consistente de iconos en toda la aplicación
 */

interface IconProps {
  icon: string; // ej: "fas fa-home", "fab fa-whatsapp"
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Para Tailwind: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ icon, size = 'lg', className = '', title, style }) => {
  const sizeClass = size === 'xs' ? 'text-xs' :
                    size === 'sm' ? 'text-sm' :
                    size === 'md' ? 'text-base' :
                    size === 'lg' ? 'text-lg' :
                    size === 'xl' ? 'text-xl' : 'text-2xl';

  return (
    <i
      className={`${icon} ${sizeClass} ${className}`}
      title={title}
      style={style}
    ></i>
  );
};

/**
 * Iconos predefinidos para usar en toda la app
 */
export const Icons = {
  // Navegación
  home: 'fas fa-home',
  menu: 'fas fa-bars',
  close: 'fas fa-times',

  // Comida
  utensils: 'fas fa-utensils',
  plate: 'fas fa-plate-wheat',
  coffee: 'fas fa-coffee',

  // Carrito
  cart: 'fas fa-shopping-cart',
  bag: 'fas fa-shopping-bag',
  plus: 'fas fa-plus',
  minus: 'fas fa-minus',
  trash: 'fas fa-trash-alt',

  // Contacto
  phone: 'fas fa-phone',
  whatsapp: 'fab fa-whatsapp',
  instagram: 'fab fa-instagram',
  facebook: 'fab fa-facebook',
  envelope: 'fas fa-envelope',
  map: 'fas fa-map-marker-alt',

  // Acciones
  search: 'fas fa-search',
  filter: 'fas fa-filter',
  sort: 'fas fa-sort',
  download: 'fas fa-download',
  print: 'fas fa-print',
  share: 'fas fa-share-alt',
  link: 'fas fa-link',

  // Autenticación
  user: 'fas fa-user',
  users: 'fas fa-users',
  logout: 'fas fa-sign-out-alt',
  lock: 'fas fa-lock',

  // Estado
  check: 'fas fa-check',
  error: 'fas fa-exclamation-circle',
  warning: 'fas fa-exclamation-triangle',
  alert: 'fas fa-exclamation-triangle',
  info: 'fas fa-info-circle',
  success: 'fas fa-check-circle',
  refresh: 'fas fa-sync-alt',

  // Admin
  cog: 'fas fa-cog',
  edit: 'fas fa-edit',
  add: 'fas fa-plus-circle',
  delete: 'fas fa-trash',

  // Navegación
  chevronLeft: 'fas fa-chevron-left',
  chevronRight: 'fas fa-chevron-right',
  chevronUp: 'fas fa-chevron-up',
  chevronDown: 'fas fa-chevron-down',
  arrowLeft: 'fas fa-arrow-left',
  eye: 'fas fa-eye',

  // Especial
  star: 'fas fa-star',
  heart: 'fas fa-heart',
  clock: 'fas fa-clock',
  delivery: 'fas fa-truck',
  location: 'fas fa-location-dot',
  list: 'fas fa-list',
  image: 'fas fa-image',
  smile: 'fas fa-face-smile',
  calendar: 'fas fa-calendar-alt',
  spinner: 'fas fa-spinner',
  fire: 'fas fa-fire',
  crown: 'fas fa-crown',
  chartBar: 'fas fa-chart-bar',
  car: 'fas fa-car',
  motorcycle: 'fas fa-motorcycle',
  building: 'fas fa-building',
  house: 'fas fa-house',
  store: 'fas fa-store',
  clipboard: 'fas fa-clipboard-list',
  box: 'fas fa-box',
  truck: 'fas fa-truck-fast',
  mapPin: 'fas fa-map-pin',
  moneyBill: 'fas fa-money-bill-wave',
  bullseye: 'fas fa-bullseye',
  chartLine: 'fas fa-chart-line',
  lightbulb: 'fas fa-lightbulb',
  sushi: 'fas fa-fish',
  noodles: 'fas fa-bowl-food',
  creditCard: 'fas fa-credit-card',
  dollar: 'fas fa-dollar-sign',
  checkCircle: 'fas fa-check-circle',
  document: 'fas fa-file-alt',
  history: 'fas fa-history',
  wallet: 'fas fa-wallet',
  card: 'fas fa-credit-card',
};

/**
 * Componentes predefinidos de iconos comunes
 */
export const CartIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.cart} size={size} className={className} title="Carrito" />
);

export const HomeIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.home} size={size} className={className} title="Inicio" />
);

export const MenuIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.menu} size={size} className={className} title="Menú" />
);

export const PhoneIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.phone} size={size} className={className} title="Teléfono" />
);

export const WhatsAppIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.whatsapp} size={size} className={className} title="WhatsApp" />
);

export const InstagramIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.instagram} size={size} className={className} title="Instagram" />
);

export const CheckIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.check} size={size} className={className} title="Confirmado" />
);

export const StarIcon: React.FC<{ size?: IconProps['size'], className?: string }> = ({ size = 'lg', className = '' }) => (
  <Icon icon={Icons.star} size={size} className={className} title="Calificación" />
);
