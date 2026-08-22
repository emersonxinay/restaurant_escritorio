// Reservations
export const RESERVATION_HOURS = [
  { start: 13, end: 17 },  // 1pm - 5pm
  { start: 18, end: 21.5 } // 6pm - 9:30pm
];

export const MAX_RESERVATION_DAYS = 60; // 2 months
export const MAX_PEOPLE_RESERVATION = 20;
export const MIN_PEOPLE_RESERVATION = 1;

// Discounts
export const MIN_DISCOUNT_PERCENTAGE = 5;
export const MAX_DISCOUNT_PERCENTAGE = 50;
export const MAX_DISCOUNT_FUTURE_DAYS = 30;

export const DISCOUNT_STATUS = {
  PROGRAMMED: 'programmed',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

// File Upload
export const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Predefined Images
export const PREDEFINED_IMAGES = [
  'logohazukifavicon.png',
  '40piezas.jpg',
  'aji_de_gallina.jpg',
  'cevicheroll-hazuki.jpg',
  'logofavicon.png',
  'logofavicon1.png',
  'logofavicon3.png',
  'logonavhazuki.png',
  'sashimi.jpg',
  'tempuras.jpg'
];

export const DEFAULT_IMAGE = 'logofavicon.png';

// Categories (Excluded from discounts)
export const EXCLUDED_DISCOUNT_CATEGORIES = [
  'promociones',
  'bebidas y jugos',
  'colaciones'
];

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// JWT
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// API Response Messages
export const MESSAGES = {
  // Auth
  REGISTERED_SUCCESSFULLY: 'User registered successfully',
  LOGIN_SUCCESSFUL: 'Login successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  ADMIN_CREATED: 'Admin created successfully',
  INVALID_CREDENTIALS: 'Invalid username or password',
  ADMIN_EXISTS: 'An admin already exists',
  USER_EXISTS: 'Username already taken',

  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  CATEGORY_NOT_FOUND: 'Category not found',

  // Products
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCT_NOT_FOUND: 'Product not found',
  INVALID_FILE_TYPE: 'File type not allowed. Use: PNG, JPG, JPEG, GIF, WEBP',

  // Reservations
  RESERVATION_CREATED: 'Reservation created successfully',
  RESERVATION_DELETED: 'Reservation deleted successfully',
  RESERVATION_NOT_FOUND: 'Reservation not found',
  INVALID_DATE: 'Date must be between today and 60 days from now',
  INVALID_TIME: 'Time must be between 1pm-5pm or 6pm-9:30pm',
  SLOT_ALREADY_BOOKED: 'Time slot is already booked',

  // Orders
  ORDER_CREATED: 'Order received successfully',

  // Discounts
  DISCOUNT_CREATED: 'Discount created successfully',
  DISCOUNT_UPDATED: 'Discount updated successfully',
  DISCOUNT_DELETED: 'Discount deleted successfully',
  DISCOUNT_STOPPED: 'Discount stopped successfully',
  DISCOUNT_REACTIVATED: 'Discount reactivated successfully',
  DISCOUNT_NOT_FOUND: 'Discount not found',
  CONFLICTING_DISCOUNT: 'Conflicting discount already exists',
  DISCOUNT_CANNOT_EDIT: 'This discount cannot be edited because it is already active or expired',
  DISCOUNT_CANNOT_REACTIVATE: 'This discount cannot be reactivated',
  DISCOUNT_CANNOT_DELETE: 'Cannot delete an active discount',

  // Errors
  MISSING_FIELDS: 'Missing required fields',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden - Admin privileges required',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Route not found'
} as const;

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TIME: /^\d{2}:\d{2}$/,
  IMAGE_URL: /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i,
  SAFE_FILENAME: /^[a-zA-Z0-9._-]+$/
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const;
