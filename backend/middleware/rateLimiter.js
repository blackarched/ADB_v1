import rateLimit from 'express-rate-limit';

const MAX_REQUESTS = process.env.API_RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, 10)
  : 100; // Default to 100 requests

const WINDOW_MS = process.env.API_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10)
  : 60 * 1000; // Default to 1 minute

const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again after a short break.',
  headers: true, // Send X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
  standardHeaders: 'draft-7', // Recommended standard for rate limit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers (use standardHeaders instead)
  keyGenerator: (req) => {
    // Use the first IP address from X-Forwarded-For if available (common for proxies/load balancers)
    // otherwise, fall back to req.ip (which uses req.socket.remoteAddress)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor && typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return req.ip;
  },
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for IP: ${options.requestWasThrottled ? req.ip : '<unknown>'}. Limit: ${options.max}, Message: ${options.message}`);
    res.status(options.statusCode).send(options.message);
  }
});

export default apiRateLimiter;
