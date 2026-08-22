// User Types
export interface IUser {
  id: number;
  username: string;
  password_hash: string;
  role: boolean;
}

export interface IUserResponse {
  id: number;
  username: string;
  role: boolean;
}

// Category Types
export interface ICategory {
  id: number;
  name: string;
}

// Product Types
export interface IProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: number;
}

// Discount Types
export type DiscountStatus = 'programmed' | 'active' | 'expired' | 'cancelled';

export interface IDiscount {
  id: number;
  title: string;
  percentage: number;
  start_date: Date;
  end_date: Date;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  auto_apply: boolean;
  status: DiscountStatus;
  created_by_admin_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface IDiscountResponse {
  id: number;
  title: string;
  percentage: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  auto_apply: boolean;
  status: DiscountStatus;
  is_currently_active: boolean;
  time_remaining?: string;
  can_be_edited: boolean;
  created_at: string;
  updated_at: string;
}

// Reservation Types
export interface IReservation {
  id: number;
  name: string;
  email: string;
  date: Date;
  time: string;
  people: number;
  details?: string;
  qr_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IReservationResponse {
  id: number;
  name: string;
  email: string;
  date: string;
  time: string;
  people: number;
  details?: string;
  qr_code?: string;
  created_at?: string;
  updated_at?: string;
}

// Order Types
export interface IOrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderSummary {
  items: IOrderItem[];
  total_price: number;
  discount?: IDiscountResponse | null;
}

// API Response Types
export interface IApiResponse<T> {
  message?: string;
  data?: T;
  errors?: any[];
  status?: number;
  timestamp?: string;
}

export interface IListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query Parameters
export interface IPaginationQuery {
  page?: number;
  limit?: number;
}

export interface IProductQuery extends IPaginationQuery {
  category_id?: number;
  search?: string;
}

export interface IDiscountHistoryQuery {
  days?: number;
}

// Authentication
export interface IAuthPayload {
  id: number;
  username: string;
  role: boolean;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest extends ILoginRequest {}

export interface IAuthResponse {
  token: string;
  user: IUserResponse;
}

// File Upload
export interface IUploadedFile {
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
}

// Error Types
export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Database Query Options
export interface IQueryOptions {
  where?: any;
  include?: any;
  limit?: number;
  offset?: number;
  order?: any;
}

// Discount Logic
export interface IDiscountCalculation {
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  final_price: number;
}
