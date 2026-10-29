import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditContext {
  username: string;
  ip?: string;
  userAgent?: string;
}

export const auditStorage = new AsyncLocalStorage<AuditContext>();

export function getAuditContext(): AuditContext | undefined {
  return auditStorage.getStore();
}

export function runWithAuditContext<T>(ctx: AuditContext, fn: () => T): T {
  return auditStorage.run(ctx, fn);
}