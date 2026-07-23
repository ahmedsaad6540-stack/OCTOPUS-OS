import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

/**
 * Standardized API Error Response
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Custom Error Class for operational errors
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware.
 * Captures all unhandled errors, logs them, and returns a standard JSON response.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  
  // Log the error centrally
  if (isOperational) {
    logger.warn({ err, reqId: req.id }, "Operational error occurred");
  } else {
    logger.error({ err, reqId: req.id }, "Unexpected system error");
  }

  // Response payload
  const response: ApiErrorResponse = {
    error: {
      message: isOperational || process.env.NODE_ENV !== "production" ? err.message : "Internal server error",
      code,
      ...(process.env.NODE_ENV !== "production" && { details: err.stack })
    }
  };

  res.status(statusCode).json(response);
}
