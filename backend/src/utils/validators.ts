import { body, param, query, ValidationChain } from 'express-validator';

// Auth Validators
export const registerValidator = (): ValidationChain[] => [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const loginValidator = (): ValidationChain[] => [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Category Validators
export const createCategoryValidator = (): ValidationChain[] => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
];

export const updateCategoryValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid category ID'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
];

export const deleteCategoryValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid category ID')
];

// Product Validators
export const createProductValidator = (): ValidationChain[] => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .isInt()
    .withMessage('Valid category ID is required'),
  body('img_url')
    .optional()
    .trim()
];

export const updateProductValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Valid category ID is required')
];

export const deleteProductValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid product ID')
];

// Reservation Validators
export const createReservationValidator = (): ValidationChain[] => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  body('time')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Valid time is required (HH:MM)'),
  body('people')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of people must be between 1 and 20'),
  body('details')
    .optional()
    .trim()
];

// Order Validators
export const createOrderValidator = (): ValidationChain[] => [
  body('product_ids')
    .isArray()
    .withMessage('product_ids must be an array'),
  body('quantities')
    .isArray()
    .withMessage('quantities must be an array')
];

// Discount Validators
export const createDiscountValidator = (): ValidationChain[] => [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Discount title must be between 2 and 100 characters'),
  body('percentage')
    .isInt({ min: 5, max: 50 })
    .withMessage('Percentage must be between 5 and 50'),
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('end_date')
    .isISO8601()
    .withMessage('Valid end date is required (YYYY-MM-DD)'),
  body('start_time')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Valid start time is required (HH:MM)'),
  body('end_time')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Valid end time is required (HH:MM)'),
  body('auto_apply')
    .optional()
    .isBoolean()
    .withMessage('auto_apply must be boolean')
];

export const updateDiscountValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid discount ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Discount title must be between 2 and 100 characters'),
  body('percentage')
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage('Percentage must be between 5 and 50'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('start_time')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Valid start time is required'),
  body('end_time')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Valid end time is required'),
  body('auto_apply')
    .optional()
    .isBoolean()
    .withMessage('auto_apply must be boolean')
];

export const deleteDiscountValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid discount ID')
];

export const discountHistoryValidator = (): ValidationChain[] => [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Common Validators
export const idValidator = (): ValidationChain[] => [
  param('id').isInt().withMessage('Invalid ID')
];

export const paginationValidator = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
