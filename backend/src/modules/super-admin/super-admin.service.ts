import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { Tenant, TenantStatus, PlanTier } from '../tenant/entities/tenant.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Category } from '../categories/entities/category.entity';
import {
  TenantOnboardingDto,
  UpdateSubscriptionDto,
  PlatformGovernanceMetricsDto,
} from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantSettings)
    private readonly settingsRepo: Repository<TenantSettings>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async provisionTenant(dto: TenantOnboardingDto) {
    const existingSlug = await this.tenantRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Store slug '${dto.slug}' is already taken.`);
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: dto.ownerEmail },
    });
    if (existingUser) {
      throw new BadRequestException(
        `Owner email '${dto.ownerEmail}' is already registered.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const trialDays = dto.trialDays || 14;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + trialDays);

      // 1. Create Tenant
      const tenant = queryRunner.manager.create(Tenant, {
        storeName: dto.storeName,
        slug: dto.slug,
        contactEmail: dto.ownerEmail,
        contactPhone: dto.contactPhone,
        currencyCode: dto.currencyCode || 'PKR',
        status: TenantStatus.TRIAL,
        planTier: dto.planTier || PlanTier.STARTER,
        expiresAt,
      });
      const savedTenant = await queryRunner.manager.save(tenant);

      // 2. Create Settings
      const settings = queryRunner.manager.create(TenantSettings, {
        tenantId: savedTenant.id,
        taxNumber: 'TAX-' + dto.slug.toUpperCase(),
        taxRateDefault: 0,
        receiptHeader: `${dto.storeName}\nRetail & Commerce Operations`,
        receiptFooter: `Thank you for shopping at ${dto.storeName}!\nPlease come again.`,
        allowNegativeStock: false,
      });
      const savedSettings = await queryRunner.manager.save(settings);

      // 3. Create Store Admin User
      const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);
      const owner = queryRunner.manager.create(User, {
        tenantId: savedTenant.id,
        fullName: dto.ownerName,
        email: dto.ownerEmail,
        passwordHash: hashedPassword,
        role: UserRole.ROLE_STORE_ADMIN,
        userStatus: UserStatus.ACTIVE,
        status: 'ACTIVE',
        preferredCurrency: savedTenant.currencyCode,
      });
      const savedOwner = await queryRunner.manager.save(owner);

      // 4. Seed baseline Accounts
      const cashDrawer = queryRunner.manager.create(Account, {
        tenantId: savedTenant.id,
        userId: savedOwner.id,
        name: 'Main Cash Drawer',
        type: 'CASH',
        currencyCode: savedTenant.currencyCode,
        initialBalance: 10000,
        currentBalance: 10000,
        archived: false,
      });
      await queryRunner.manager.save(cashDrawer);

      const bankAccount = queryRunner.manager.create(Account, {
        tenantId: savedTenant.id,
        userId: savedOwner.id,
        name: 'Main Bank Account',
        type: 'BANK',
        currencyCode: savedTenant.currencyCode,
        initialBalance: 100000,
        currentBalance: 100000,
        archived: false,
      });
      await queryRunner.manager.save(bankAccount);

      // 5. Seed default Customer
      const walkInCustomer = queryRunner.manager.create(Customer, {
        tenantId: savedTenant.id,
        name: 'Walk-in Customer',
        phone: '000-000-0000',
        email: `walkin@${dto.slug}.com`,
        address: 'Retail Front Counter',
        currentCreditBalance: 0,
      });
      await queryRunner.manager.save(walkInCustomer);

      // 6. Seed default Categories
      const categories = [
        { name: 'Store Retail Sales', type: 'INCOME', sortOrder: 0 },
        { name: 'Supplier Restock', type: 'EXPENSE', sortOrder: 1 },
        { name: 'Shop Utilities & Rent', type: 'EXPENSE', sortOrder: 2 },
        { name: 'Staff Wages & Payroll', type: 'EXPENSE', sortOrder: 3 },
      ];

      for (const cat of categories) {
        const category = queryRunner.manager.create(Category, {
          tenantId: savedTenant.id,
          userId: savedOwner.id,
          name: cat.name,
          type: cat.type,
          sortOrder: cat.sortOrder,
          archived: false,
        });
        await queryRunner.manager.save(category);
      }

      await queryRunner.commitTransaction();

      return this.mapToResponse(savedTenant, savedSettings, savedOwner);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getTenants(
    status?: string,
    planTier?: string,
    query?: string,
    page: number = 0,
    size: number = 20,
  ) {
    const qb = this.tenantRepo.createQueryBuilder('tenant');

    if (status) {
      qb.andWhere('tenant.status = :status', { status });
    }
    if (planTier) {
      qb.andWhere('tenant.planTier = :planTier', { planTier });
    }
    if (query) {
      qb.andWhere(
        '(LOWER(tenant.storeName) LIKE :query OR LOWER(tenant.slug) LIKE :query OR LOWER(tenant.contactEmail) LIKE :query)',
        { query: `%${query.toLowerCase()}%` },
      );
    }

    qb.orderBy('tenant.createdAt', 'DESC')
      .skip(page * size)
      .take(size);

    const [tenants, totalElements] = await qb.getManyAndCount();

    const content = await Promise.all(
      tenants.map(async (t) => {
        const settings = await this.settingsRepo.findOne({
          where: { tenantId: t.id },
        });
        const owner = await this.userRepo.findOne({
          where: { tenantId: t.id, role: UserRole.ROLE_STORE_ADMIN },
        });
        return this.mapToResponse(t, settings, owner);
      }),
    );

    return {
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
    };
  }

  async getTenantById(id: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant not found: ${id}`);
    const settings = await this.settingsRepo.findOne({
      where: { tenantId: id },
    });
    const owner = await this.userRepo.findOne({
      where: { tenantId: id, role: UserRole.ROLE_STORE_ADMIN },
    });
    return this.mapToResponse(tenant, settings, owner);
  }

  async updateStatus(id: string, status: any) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant not found: ${id}`);
    tenant.status = status;
    await this.tenantRepo.save(tenant);
    return this.getTenantById(id);
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant not found: ${id}`);

    if (dto.planTier) {
      tenant.planTier = dto.planTier;
    }
    if (dto.expiresAt) {
      tenant.expiresAt = new Date(dto.expiresAt);
    } else if (dto.extendDays && dto.extendDays > 0) {
      const currentExp =
        tenant.expiresAt && new Date(tenant.expiresAt) > new Date()
          ? new Date(tenant.expiresAt)
          : new Date();
      currentExp.setDate(currentExp.getDate() + dto.extendDays);
      tenant.expiresAt = currentExp;
    }

    await this.tenantRepo.save(tenant);
    return this.getTenantById(id);
  }

  /**
   * Pure Platform Governance KPIs:
   * Returns operational tenant & user metrics only.
   * NEVER queries, aggregates, or exposes store sales, POS volumes, invoices, or revenue.
   */
  async getPlatformMetrics(): Promise<PlatformGovernanceMetricsDto> {
    const totalTenants = await this.tenantRepo.count();
    const activeTenants = await this.tenantRepo.count({
      where: { status: TenantStatus.ACTIVE },
    });
    const trialTenants = await this.tenantRepo.count({
      where: { status: TenantStatus.TRIAL },
    });
    const suspendedTenants = await this.tenantRepo.count({
      where: { status: TenantStatus.SUSPENDED },
    });

    const totalUsers = await this.userRepo.count();
    const superAdmin = await this.userRepo.count({
      where: { role: UserRole.ROLE_SUPER_ADMIN },
    });
    const storeAdmin = await this.userRepo.count({
      where: { role: UserRole.ROLE_STORE_ADMIN },
    });
    const inventoryManager = await this.userRepo.count({
      where: { role: UserRole.ROLE_INVENTORY_MANAGER },
    });
    const cashier = await this.userRepo.count({
      where: { role: UserRole.ROLE_CASHIER },
    });

    // Subscriptions ending in <= 7 days or overdue for review (active or trial)
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringSubscriptionsCount = await this.tenantRepo
      .createQueryBuilder('t')
      .where('t.expiresAt IS NOT NULL')
      .andWhere('t.expiresAt <= :in7Days', { in7Days })
      .andWhere('t.status IN (:...statuses)', {
        statuses: [TenantStatus.ACTIVE, TenantStatus.TRIAL],
      })
      .getCount();

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      totalUsers,
      usersByRole: {
        superAdmin,
        storeAdmin,
        inventoryManager,
        cashier,
      },
      expiringSubscriptionsCount,
    };
  }

  async getSettings(id: string) {
    let settings = await this.settingsRepo.findOne({ where: { tenantId: id } });
    if (!settings) {
      settings = this.settingsRepo.create({
        tenantId: id,
        allowNegativeStock: false,
        taxRateDefault: 0,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  /**
   * Sanitized Platform User Directory:
   * Returns user profiles joined ONLY with basic Tenant metadata.
   * Strictly avoids joining sales, invoices, or register financial figures.
   */
  async getAllUsers(
    search?: string,
    role?: string,
    tenantId?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) {
    const qb = this.userRepo.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');

    if (search && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(u.fullName) LIKE :s OR LOWER(u.email) LIKE :s)', { s });
    }

    if (role && role !== 'ALL') {
      qb.andWhere('u.role = :role', { role });
    }

    if (tenantId && tenantId !== 'ALL') {
      if (tenantId === 'PLATFORM' || tenantId === 'GLOBAL') {
        qb.andWhere('u.tenantId IS NULL');
      } else {
        qb.andWhere('u.tenantId = :tenantId', { tenantId });
      }
    }

    if (status && status !== 'ALL') {
      const normalizedReqStatus = status.toUpperCase();
      if (normalizedReqStatus === 'SUSPENDED' || normalizedReqStatus === 'INACTIVE') {
        qb.andWhere(
          '(u.status = :s1 OR u.userStatus = :s2 OR u.status = :s2)',
          { s1: 'SUSPENDED', s2: 'INACTIVE' },
        );
      } else if (normalizedReqStatus === 'ACTIVE') {
        qb.andWhere(
          '(u.status = :act OR u.userStatus = :act) AND u.status != :susp AND u.userStatus != :inact',
          { act: 'ACTIVE', susp: 'SUSPENDED', inact: 'INACTIVE' },
        );
      }
    }

    if (page !== undefined && limit !== undefined && limit > 0) {
      qb.skip(page * limit).take(limit);
    }

    const users = await qb.getMany();
    const tenants = await this.tenantRepo.find();
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    return users.map((u) => {
      const tenant = u.tenantId ? tenantMap.get(u.tenantId) : null;
      const isSuspended =
        u.status === 'SUSPENDED' ||
        u.status === 'INACTIVE' ||
        u.userStatus === UserStatus.INACTIVE;
      const normalizedStatus = isSuspended ? 'SUSPENDED' : 'ACTIVE';

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        status: normalizedStatus,
        userStatus: isSuspended ? UserStatus.INACTIVE : UserStatus.ACTIVE,
        tenantId: u.tenantId || null,
        tenantName: tenant ? tenant.storeName : null,
        createdAt: u.createdAt,
        lastLoginAt: (u as any).lastLoginAt || u.updatedAt || null,
        tenant: tenant
          ? {
              id: tenant.id,
              storeName: tenant.storeName,
              slug: tenant.slug,
              status: tenant.status,
              planTier: tenant.planTier,
            }
          : null,
      };
    });
  }

  async updateUserAccess(
    id: number,
    data: {
      role?: UserRole;
      status?: string;
      tenantId?: string | null;
      fullName?: string;
      password?: string;
    },
  ) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }

    if (data.fullName) {
      user.fullName = data.fullName.trim();
    }

    if (data.role) {
      user.role = data.role;
      if (data.role === UserRole.ROLE_SUPER_ADMIN) {
        user.tenantId = null;
      }
    }

    if (data.status) {
      const normalized = data.status.toUpperCase();
      if (normalized === 'SUSPENDED' || normalized === 'INACTIVE') {
        user.status = 'SUSPENDED';
        user.userStatus = UserStatus.INACTIVE;
      } else {
        user.status = 'ACTIVE';
        user.userStatus = UserStatus.ACTIVE;
      }
    }

    if (data.tenantId !== undefined) {
      if (data.tenantId && user.role !== UserRole.ROLE_SUPER_ADMIN) {
        const tenant = await this.tenantRepo.findOne({ where: { id: data.tenantId } });
        if (!tenant) {
          throw new NotFoundException(`Tenant store not found: ${data.tenantId}`);
        }
        user.tenantId = tenant.id;
      } else if (data.tenantId === null || user.role === UserRole.ROLE_SUPER_ADMIN) {
        user.tenantId = null;
      }
    }

    if (data.password && data.password.trim().length >= 6) {
      user.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    const saved = await this.userRepo.save(user);
    const tenant = saved.tenantId ? await this.tenantRepo.findOne({ where: { id: saved.tenantId } }) : null;

    const isSuspended =
      saved.status === 'SUSPENDED' ||
      saved.status === 'INACTIVE' ||
      saved.userStatus === UserStatus.INACTIVE;

    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      status: isSuspended ? 'SUSPENDED' : 'ACTIVE',
      userStatus: isSuspended ? UserStatus.INACTIVE : UserStatus.ACTIVE,
      tenantId: saved.tenantId || null,
      tenantName: tenant ? tenant.storeName : null,
      createdAt: saved.createdAt,
      lastLoginAt: (saved as any).lastLoginAt || saved.updatedAt || null,
      tenant: tenant
        ? {
            id: tenant.id,
            storeName: tenant.storeName,
            slug: tenant.slug,
            status: tenant.status,
            planTier: tenant.planTier,
          }
        : null,
    };
  }

  async resetUserPassword(id: number, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    user.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await this.userRepo.save(user);
    return {
      success: true,
      message: `Password reset successfully for user "${user.fullName}" (${user.email})`,
    };
  }

  async createPlatformUser(data: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    tenantId?: string | null;
  }) {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = await this.userRepo.findOne({ where: { email: cleanEmail } });
    if (existing) {
      throw new BadRequestException(`Email '${data.email}' is already registered`);
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const tenantId = data.tenantId || null;
    if (data.role !== UserRole.ROLE_SUPER_ADMIN && !tenantId) {
      throw new BadRequestException('Tenant store is required for store roles');
    }

    let tenant: Tenant | null = null;
    if (tenantId && data.role !== UserRole.ROLE_SUPER_ADMIN) {
      tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new NotFoundException(`Tenant store not found: ${tenantId}`);
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      fullName: data.fullName.trim(),
      email: cleanEmail,
      passwordHash,
      role: data.role,
      userStatus: UserStatus.ACTIVE,
      status: 'ACTIVE',
      tenantId: data.role === UserRole.ROLE_SUPER_ADMIN ? null : tenantId,
    });

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      status: 'ACTIVE',
      userStatus: UserStatus.ACTIVE,
      tenantId: saved.tenantId,
      tenantName: tenant ? tenant.storeName : null,
      createdAt: saved.createdAt,
      lastLoginAt: null,
      tenant: tenant
        ? {
            id: tenant.id,
            storeName: tenant.storeName,
            slug: tenant.slug,
            status: tenant.status,
            planTier: tenant.planTier,
          }
        : null,
    };
  }

  async deletePlatformUser(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own Super Admin account');
    }
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    await this.userRepo.delete(id);
    return { success: true, message: `User account '${user.fullName}' deleted successfully` };
  }

  async updateSettings(id: string, data: Partial<TenantSettings>) {
    let settings = await this.getSettings(id);
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }

  private mapToResponse(
    tenant: Tenant,
    settings: TenantSettings | null,
    owner: User | null,
  ) {
    return {
      id: tenant.id,
      storeName: tenant.storeName,
      slug: tenant.slug,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      currencyCode: tenant.currencyCode,
      status: tenant.status,
      planTier: tenant.planTier,
      expiresAt: tenant.expiresAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      taxNumber: settings?.taxNumber || null,
      taxRateDefault: settings?.taxRateDefault || 0,
      receiptHeader: settings?.receiptHeader || null,
      receiptFooter: settings?.receiptFooter || null,
      logoUrl: settings?.logoUrl || null,
      allowNegativeStock: settings?.allowNegativeStock || false,
      ownerUserId: owner?.id || null,
      ownerName: owner?.fullName || null,
    };
  }
}
