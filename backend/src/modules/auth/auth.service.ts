import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
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

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.save({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash: hashedPassword,
      role: UserRole.ROLE_STORE_ADMIN,
      userStatus: UserStatus.ACTIVE,
      status: 'ACTIVE',
      preferredCurrency: registerDto.preferredCurrency || 'USD',
      tenantId: null,
    } as any);

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }
}
