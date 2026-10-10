import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId?: string | null;
  userId?: number;
  userRole?: string;
  email?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantContextData>();

export class TenantContext {
  static run<T>(data: TenantContextData, fn: () => T): T {
    return asyncLocalStorage.run(data, fn);
  }

  static get(): TenantContextData | undefined {
    return asyncLocalStorage.getStore();
  }

  static getTenantId(): string | null | undefined {
    return asyncLocalStorage.getStore()?.tenantId;
  }

  static setTenantId(tenantId: string | null): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.tenantId = tenantId;
    }
  }

  static getUserId(): number | undefined {
    return asyncLocalStorage.getStore()?.userId;
  }

  static getUserRole(): string | undefined {
    return asyncLocalStorage.getStore()?.userRole;
  }

  static clear(): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.tenantId = null;
      store.userId = undefined;
      store.userRole = undefined;
      store.email = undefined;
    }
  }
}
