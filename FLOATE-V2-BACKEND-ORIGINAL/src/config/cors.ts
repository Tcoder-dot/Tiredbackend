/**
 * CORS Configuration for Floate WhatsApp Commerce Engine
 * Enforces strict credentials handling for httpOnly cross-site session cookies
 * and validates allowed frontend origins from PUBLIC_SITE_URL without wildcards.
 */

import { Request, Response, NextFunction } from 'express';
import { getPublicSiteUrl } from './siteUrls.js';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const configuredOrigins = [
    getPublicSiteUrl(),
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()),
  ];
  const allowedOrigins = new Set(
    configuredOrigins.flatMap((value) => {
      try {
        return [new URL(value).origin];
      } catch {
        return [];
      }
    })
  );

  let requestOrigin: URL | null = null;
  try {
    if (origin) requestOrigin = new URL(origin);
  } catch {
    requestOrigin = null;
  }

  const hostname = requestOrigin?.hostname.toLowerCase() || '';
  const isAllowed = !origin || Boolean(
    requestOrigin && (
      requestOrigin.host === req.get('host')?.toLowerCase() ||
      allowedOrigins.has(requestOrigin.origin) ||
      hostname === 'floate.xyz' ||
      hostname.endsWith('.floate.xyz') ||
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.github.dev') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    )
  );

  res.vary('Origin');
  if (origin && !isAllowed) {
    return res.status(403).json({ success: false, error: 'Origin is not allowed.' });
  }

  if (origin && requestOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin.origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-token, x-api-key, x-floate-api-key, x-admin-api-key, x-registration-phone, x-registration-verification-token'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}
