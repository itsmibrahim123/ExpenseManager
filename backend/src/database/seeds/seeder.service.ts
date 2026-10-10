import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Tenant, TenantStatus, PlanTier } from '../../modules/tenant/entities/tenant.entity';
import { TenantSettings } from '../../modules/tenant/entities/tenant-settings.entity';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import { Account } from '../../modules/accounts/entities/account.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Product } from '../../modules/products/entities/product.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantSettings)
    private readonly settingsRepo: Repository<TenantSettings>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    try {
      // 1. Seed Super Admin
      const existingSuperAdmin = await this.userRepo.findOne({
        where: { email: 'admin@saas.com' },
      });

      if (!existingSuperAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const superAdmin = this.userRepo.create({
          fullName: 'Super Admin',
          email: 'admin@saas.com',
          passwordHash: hashedPassword,
          role: UserRole.ROLE_SUPER_ADMIN,
          userStatus: UserStatus.ACTIVE,
          status: 'ACTIVE',
          tenantId: null,
          preferredCurrency: 'USD',
        });
        await this.userRepo.save(superAdmin);
        this.logger.log('Seeded Super Admin: admin@saas.com / admin123');
      }

      // 2. Seed Default Store Tenant
      let tenant = await this.tenantRepo.findOne({
        where: { slug: 'main-store' },
      });

      if (!tenant) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 2);

        tenant = this.tenantRepo.create({
          storeName: 'Main Retail Store',
          slug: 'main-store',
          contactEmail: 'guest@example.com',
          contactPhone: '0300-1234567',
          currencyCode: 'PKR',
          status: TenantStatus.ACTIVE,
          planTier: PlanTier.ENTERPRISE,
          expiresAt: expiresAt,
        });
        tenant = await this.tenantRepo.save(tenant);

        // Settings
        const settings = this.settingsRepo.create({
          tenantId: tenant.id,
          taxNumber: 'TAX-MAIN-8899',
          taxRateDefault: 5.0,
          receiptHeader:
            'MAIN RETAIL STORE\nPlaza Center, Commercial Market, Lahore',
          receiptFooter:
            'Thank you for shopping at Main Retail Store!\nReturns valid for 7 days with thermal receipt.',
          allowNegativeStock: false,
        });
        await this.settingsRepo.save(settings);

        // Store Admin User
        const hashedStorePassword = await bcrypt.hash('guest123', 10);
        const storeAdmin = this.userRepo.create({
          fullName: 'Guest Store Admin',
          email: 'guest@example.com',
          passwordHash: hashedStorePassword,
          role: UserRole.ROLE_STORE_ADMIN,
          userStatus: UserStatus.ACTIVE,
          status: 'ACTIVE',
          tenantId: tenant.id,
          preferredCurrency: 'PKR',
        });
        const savedStoreAdmin = await this.userRepo.save(storeAdmin);

        // Default Cash Drawer Account
        const cashDrawer = this.accountRepo.create({
          tenantId: tenant.id,
          userId: savedStoreAdmin.id,
          name: 'Main Cash Drawer',
          type: 'CASH',
          currencyCode: 'PKR',
          initialBalance: 500,
          currentBalance: 500,
          archived: false,
        });
        await this.accountRepo.save(cashDrawer);

        // Default Bank Account
        const bankAccount = this.accountRepo.create({
          tenantId: tenant.id,
          userId: savedStoreAdmin.id,
          name: 'Main Bank Account',
          type: 'BANK',
          currencyCode: 'PKR',
          initialBalance: 10000,
          currentBalance: 10000,
          archived: false,
        });
        await this.accountRepo.save(bankAccount);

        // Categories
        const catRetail = await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: savedStoreAdmin.id,
            name: 'POS Retail Sales',
            type: 'INCOME',
            sortOrder: 0,
            archived: false,
          }),
        );

        const catRestock = await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: savedStoreAdmin.id,
            name: 'Inventory Restock',
            type: 'EXPENSE',
            sortOrder: 1,
            archived: false,
          }),
        );

        await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: savedStoreAdmin.id,
            name: 'Utilities & Rent',
            type: 'EXPENSE',
            sortOrder: 2,
            archived: false,
          }),
        );

        // Default Walk-in Customer
        await this.customerRepo.save(
          this.customerRepo.create({
            tenantId: tenant.id,
            name: 'Walk-in Customer',
            phone: '000-000-0000',
            email: 'walkin@main-store.com',
            address: 'Store Front Counter',
            taxId: 'WALK-01',
            currentCreditBalance: 0,
          }),
        );

        // Seed Sample Products
        const sampleProducts = [
          {
            name: 'Wireless Optical Mouse',
            sku: 'PRD-MOU-001',
            barcode: '8901234567890',
            costPrice: 15.0,
            sellingPrice: 25.0,
            currentStock: 45,
            reorderLevel: 10,
            unit: 'PCS',
            categoryId: catRetail.id,
          },
          {
            name: 'Mechanical Gaming Keyboard',
            sku: 'PRD-KEY-002',
            barcode: '8901234567891',
            costPrice: 45.0,
            sellingPrice: 75.0,
            currentStock: 30,
            reorderLevel: 5,
            unit: 'PCS',
            categoryId: catRetail.id,
          },
          {
            name: 'USB-C Fast Charging Cable 2M',
            sku: 'PRD-CAB-003',
            barcode: '8901234567892',
            costPrice: 4.0,
            sellingPrice: 12.0,
            currentStock: 100,
            reorderLevel: 20,
            unit: 'PCS',
            categoryId: catRetail.id,
          },
          {
            name: 'HD Webcam 1080P with Mic',
            sku: 'PRD-CAM-004',
            barcode: '8901234567893',
            costPrice: 28.0,
            sellingPrice: 49.99,
            currentStock: 22,
            reorderLevel: 5,
            unit: 'PCS',
            categoryId: catRetail.id,
          },
        ];

        for (const p of sampleProducts) {
          await this.productRepo.save(
            this.productRepo.create({
              ...p,
              tenantId: tenant.id,
              active: true,
            }),
          );
        }

        this.logger.log('Seeded Default Demo Tenant Store: main-store / guest@example.com');
      }
    } catch (err) {
      this.logger.error('Error during database seeding:', err);
    }
  }
}
