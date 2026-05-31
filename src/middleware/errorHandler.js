const isProd = process.env.NODE_ENV === 'production';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  const message    = err.message || 'Internal Server Error';

  // Always log server-side
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  if (!isProd && err.stack) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    // In production never leak stack trace or internal details
    message: isProd && statusCode === 500 ? 'An unexpected error occurred. Please try again.' : message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};
