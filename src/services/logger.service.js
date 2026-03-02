import Log from '../models/log.model.js';

/**
 * Get request metadata for audit (IP, user agent).
 */
export function getRequestMeta(req) {
  const ipAddress =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';
  const userAgent = req.headers['user-agent'] || '';
  return { ipAddress, userAgent };
}

/**
 * Get performer info from req.user (authenticated user).
 */
export function getPerformerMeta(req) {
  const user = req?.user;
  if (!user) {
    return {
      performedByUserId: null,
      performedByUserName: '',
      performedByCompany: '',
    };
  }
  return {
    performedByUserId: user._id,
    performedByUserName: user.name || user.email || '',
    performedByCompany: user.designation || '',
  };
}

/**
 * Create an audit log entry. Runs async and does not block the request.
 * Company is set from req.user.company (user must NOT pass company manually).
 * Never throws; logs errors to console.
 */
export function createAuditLog(entry) {
  const doc = {
    title: entry.title,
    description: entry.description ?? '',
    actionType: entry.actionType,
    entityType: entry.entityType,
    entityId: String(entry.entityId),
    entityName: entry.entityName ?? '',
    performedByUserId: entry.performedByUserId ?? null,
    performedByUserName: entry.performedByUserName ?? '',
    performedByCompany: entry.performedByCompany ?? '',
    company: entry.company ?? null,
    previousData: entry.previousData ?? null,
    newData: entry.newData ?? null,
    ipAddress: entry.ipAddress ?? '',
    userAgent: entry.userAgent ?? '',
  };
  Log.create(doc).catch((err) => console.error('Audit log create failed:', err));
}

/**
 * Log from Express req + entity info. Call this from controllers after state-changing actions.
 * Company is always taken from req.user.company; user must NOT pass company in options.
 */
export function auditLogFromRequest(req, options) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  const { performedByUserId, performedByUserName, performedByCompany } = getPerformerMeta(req);
  const company = req?.user?.company ?? null;
  createAuditLog({
    ...options,
    ipAddress,
    userAgent,
    performedByUserId,
    performedByUserName,
    performedByCompany,
    company,
  });
}
