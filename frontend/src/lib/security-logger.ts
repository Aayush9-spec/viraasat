export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_UNAUTHORIZED_ACCESS'
  | 'RBAC_PRIVILEGE_VIOLATION'
  | 'ADMIN_PIN_SUCCESS'
  | 'ADMIN_PIN_FAILED'
  | 'ADMIN_PIN_RATE_LIMITED'
  | 'PAYMENT_PRICE_TAMPERING_ATTEMPT'
  | 'PAYMENT_SIGNATURE_MISMATCH'
  | 'PAYMENT_WEBHOOK_VERIFIED'
  | 'PAYMENT_WEBHOOK_REJECTED'
  | 'AUCTION_INVALID_BID'
  | 'AUCTION_SELF_BID_ATTEMPT'
  | 'AUCTION_EXPIRED_BID_ATTEMPT'
  | 'MALICIOUS_FILE_UPLOAD_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROMPT_INJECTION_FLAGGED';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string | null;
  ip?: string | null;
  path?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Sanitizes potentially sensitive fields from log metadata
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) return {};
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['pin', 'password', 'token', 'secret', 'key', 'cvv', 'card', 'signature', 'cookie'];

  for (const [k, v] of Object.entries(details)) {
    const isSensitive = sensitiveKeys.some((s) => k.toLowerCase().includes(s));
    if (isSensitive) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'string' && v.length > 500) {
      sanitized[k] = `${v.substring(0, 100)}...[truncated]`;
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Structured security event logger for audit compliance and anomaly monitoring.
 * Outputs JSON format for SIEM / Vercel log ingestion without leaking credentials or PII.
 */
export function logSecurityEvent(event: SecurityEvent) {
  const payload = {
    viraasat_security_event: true,
    type: event.type,
    userId: event.userId || 'anonymous',
    ip: event.ip || 'unknown',
    path: event.path || '',
    details: sanitizeDetails(event.details),
    timestamp: event.timestamp || new Date().toISOString(),
  };

  const isSevere =
    event.type.includes('TAMPERING') ||
    event.type.includes('PRIVILEGE_VIOLATION') ||
    event.type.includes('MALICIOUS') ||
    event.type.includes('ADMIN_PIN_FAILED');

  if (isSevere) {
    console.error('[SECURITY ALERT]', JSON.stringify(payload));
  } else {
    console.warn('[SECURITY AUDIT]', JSON.stringify(payload));
  }
}
