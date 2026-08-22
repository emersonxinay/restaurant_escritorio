import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export interface ApiError extends Error {
  status?: number;
  errors?: any[];
}

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: 'param' in error ? error.param : 'unknown',
      message: error.msg
    }));

    return res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

// Clase para crear errores API estandarizados
export class ApiErrorClass extends Error implements ApiError {
  status: number;
  errors?: any[];

  constructor(message: string, status: number = 500, errors?: any[]) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiErrorClass.prototype);
  }
}

// Middleware para errores no capturados
export const globalErrorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || null;

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`, err);

  res.status(status).json({
    status,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Wrapper para async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
