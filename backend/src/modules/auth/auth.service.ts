import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { SuperAdminService } from '../super-admin/super-admin.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly superAdminService: SuperAdminService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let storeName = 'SaaS Platform Admin';
    let tenantSettings: any = null;

    if (user.tenantId) {
      try {
        const tenant = await this.tenantService.findById(user.tenantId);
        storeName = tenant.storeName;
        tenantSettings = await this.tenantService.getSettings(user.tenantId);
      } catch (e) {
        // tenant lookup fallback
      }
    }

    const payload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      storeName: storeName,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      type: 'Bearer',
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      storeName,
      tenantSettings,
    };
  }

  async getMe(userId: number) {
    const user = await this.usersService.findById(userId);
    let storeName = 'SaaS Platform Admin';
    let tenantSettings: any = null;

    if (user.tenantId) {
      try {
        const tenant = await this.tenantService.findById(user.tenantId);
        storeName = tenant.storeName;
        tenantSettings = await this.tenantService.getSettings(user.tenantId);
      } catch (e) {
        // tenant lookup fallback
      }
    }

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      storeName,
      tenantSettings,
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    if (!registerDto.storeName || registerDto.storeName.trim() === '') {
      throw new BadRequestException('Store / Company name is required for registration');
    }

    const rawSlug = registerDto.slug && registerDto.slug.trim() !== ''
      ? registerDto.slug
      : registerDto.storeName;

    const baseSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'store';
    const uniqueSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const provisionResult = await this.superAdminService.provisionTenant({
      storeName: registerDto.storeName,
      slug: registerDto.slug ? baseSlug : uniqueSlug,
      ownerName: registerDto.fullName,
      ownerEmail: registerDto.email,
      ownerPassword: registerDto.password,
      contactPhone: registerDto.contactPhone,
      currencyCode: registerDto.currencyCode || registerDto.preferredCurrency || 'PKR',
      planTier: registerDto.planTier,
      trialDays: 14,
    });

    const loginResult = await this.login({
      email: registerDto.email,
      password: registerDto.password,
    });

    return {
      message: 'Store tenant provisioned successfully',
      ...loginResult,
      tenant: provisionResult,
    };
  }
}
