import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { Tenant, TenantStatus, PlanTier } from '../tenant/entities/tenant.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Category } from '../categories/entities/category.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import {
  TenantOnboardingDto,
  UpdateSubscriptionDto,
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
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
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
      const categoriesToSeed = [
        { name: 'Inventory Purchase', type: 'EXPENSE' },
        { name: 'Rent & Utilities', type: 'EXPENSE' },
        { name: 'Salaries', type: 'EXPENSE' },
        { name: 'POS Retail Sales', type: 'INCOME' },
      ];
      for (const cat of categoriesToSeed) {
        const category = queryRunner.manager.create(Category, {
          tenantId: savedTenant.id,
          userId: savedOwner.id,
          name: cat.name,
          type: cat.type,
          sortOrder: 0,
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

  async getPlatformMetrics() {
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
    const cancelledTenants = await this.tenantRepo.count({
      where: { status: TenantStatus.CANCELLED },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newStoresLast7Days = await this.tenantRepo.count({
      where: { createdAt: MoreThanOrEqual(sevenDaysAgo) },
    });

    const invoices = await this.invoiceRepo.find();
    const totalSalesVolume30Days = invoices.reduce(
      (sum, inv) => sum + (Number(inv.grandTotal) || 0),
      0,
    );

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      cancelledTenants,
      newStoresLast7Days,
      totalSalesVolume30Days,
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
