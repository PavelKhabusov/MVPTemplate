export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }

  static badRequest(message: string, code?: string) {
    return new AppError(400, message, code)
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, message, 'FORBIDDEN')
  }

  static notFound(message = 'Not found') {
    return new AppError(404, message, 'NOT_FOUND')
  }

  static conflict(message: string) {
    return new AppError(409, message, 'CONFLICT')
  }

  static paymentRequired(message = 'Payment required') {
    return new AppError(402, message, 'PAYMENT_REQUIRED')
  }

  static tooManyRequests(message = 'Too many requests') {
    return new AppError(429, message, 'TOO_MANY_REQUESTS')
  }

  static internal(message = 'Internal server error') {
    return new AppError(500, message, 'INTERNAL')
  }

  static badGateway(message = 'Bad gateway') {
    return new AppError(502, message, 'BAD_GATEWAY')
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new AppError(503, message, 'SERVICE_UNAVAILABLE')
  }
}
