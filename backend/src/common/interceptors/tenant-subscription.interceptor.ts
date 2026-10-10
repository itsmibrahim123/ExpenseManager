import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { Tenant } from '../../modules/tenant/entities/tenant.entity';

@Injectable()
export class TenantSubscriptionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Bypass check for ROLE_SUPER_ADMIN or unauthenticated/public endpoints
    if (!user || user.role === 'ROLE_SUPER_ADMIN') {
      return next.handle();
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException({
        error: 'TENANT_ACCOUNT_INACTIVE',
        message: 'No tenant associated with user account.',
      });
    }

    const tenantRepo = this.dataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new ForbiddenException({
        error: 'TENANT_ACCOUNT_INACTIVE',
        message: 'Tenant store record not found.',
      });
    }

    const now = new Date();
    const isExpired = tenant.expiresAt && new Date(tenant.expiresAt) < now;
    const isInactive =
      tenant.status === 'SUSPENDED' ||
      tenant.status === 'CANCELLED' ||
      isExpired;

    if (isInactive) {
      throw new ForbiddenException({
        error: 'TENANT_ACCOUNT_INACTIVE',
        message:
          'Your store subscription is suspended, expired, or cancelled. Please contact platform support.',
      });
    }

    return next.handle();
  }
}
