/**
 * 🔄 Backward Compatibility Proxy
 *
 * @deprecated Use /api/ai/supervisor instead
 *
 * This endpoint proxies requests to the new supervisor endpoint
 * for backward compatibility during the migration period.
 *
 * Migration Timeline:
 * - v5.83.8: unified-stream deprecated, supervisor is primary
 * - v5.84.x: unified-stream will be removed
 *
 * @see /api/ai/supervisor
 */

export { POST } from '../supervisor/route';
