import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantContext } from '../context/tenant-context';

@Injectable()
export class TenantSecurityGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Delegated to JwtAuthGuard
    }

    if (user.role === 'ROLE_SUPER_ADMIN') {
      const impersonateHeader = request.headers['x-tenant-id'] as string;
      if (impersonateHeader) {
        TenantContext.setTenantId(impersonateHeader);
      }
      return true;
    }

    // For store users, tenantId must be present
    const userTenantId = user.tenantId;
    if (!userTenantId) {
      throw new ForbiddenException('Store user does not have an assigned tenant');
    }

    TenantContext.setTenantId(userTenantId);
    return true;
  }
}
