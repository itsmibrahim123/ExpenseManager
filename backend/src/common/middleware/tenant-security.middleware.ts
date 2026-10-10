import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant-context';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantSecurityMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId: string | null = null;
    let userId: number | undefined = undefined;
    let userRole: string | undefined = undefined;
    let email: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload) {
          userId = payload.sub || payload.userId;
          userRole = payload.role;
          tenantId = payload.tenantId || null;
          email = payload.email;

          // Super Admin impersonation via X-Tenant-Id header
          const impersonateTenantId = req.headers['x-tenant-id'] as string;
          if (userRole === 'ROLE_SUPER_ADMIN' && impersonateTenantId) {
            tenantId = impersonateTenantId;
          }
        }
      } catch (e) {
        // Token decode error handled by auth guard
      }
    }

    TenantContext.run(
      {
        tenantId,
        userId,
        userRole,
        email,
      },
      () => {
        next();
      },
    );
  }
}
