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
      // 1. Seed Super Admin (Idempotent)
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

      // 2. Seed Default Store Tenant (Idempotent)
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
        this.logger.log('Seeded Default Demo Tenant Store: main-store');
      }

      // 3. Settings (Idempotent)
      let settings = await this.settingsRepo.findOne({
        where: { tenantId: tenant.id },
      });
      if (!settings) {
        settings = this.settingsRepo.create({
          tenantId: tenant.id,
          taxNumber: 'TAX-MAIN-8899',
          taxRateDefault: 5.0,
          receiptHeader: 'MAIN RETAIL STORE\nPlaza Center, Commercial Market, Lahore',
          receiptFooter: 'Thank you for shopping at Main Retail Store!\nReturns valid for 7 days with thermal receipt.',
          allowNegativeStock: false,
        });
        await this.settingsRepo.save(settings);
      }

      // 4. Store Admin User (Idempotent)
      let storeAdmin = await this.userRepo.findOne({
        where: { email: 'guest@example.com' },
      });
      if (!storeAdmin) {
        const hashedStorePassword = await bcrypt.hash('guest123', 10);
        storeAdmin = this.userRepo.create({
          fullName: 'Guest Store Admin',
          email: 'guest@example.com',
          passwordHash: hashedStorePassword,
          role: UserRole.ROLE_STORE_ADMIN,
          userStatus: UserStatus.ACTIVE,
          status: 'ACTIVE',
          tenantId: tenant.id,
          preferredCurrency: 'PKR',
        });
        storeAdmin = await this.userRepo.save(storeAdmin);
        this.logger.log('Seeded Store Admin: guest@example.com / guest123');
      }

      // 5. Default Cash Drawer Account (Idempotent)
      const existingCashDrawer = await this.accountRepo.findOne({
        where: { tenantId: tenant.id, name: 'Main Cash Drawer' },
      });
      if (!existingCashDrawer) {
        const cashDrawer = this.accountRepo.create({
          tenantId: tenant.id,
          userId: storeAdmin.id,
          name: 'Main Cash Drawer',
          type: 'CASH',
          currencyCode: 'PKR',
          initialBalance: 500,
          currentBalance: 500,
          archived: false,
        });
        await this.accountRepo.save(cashDrawer);
      }

      // 6. Default Bank Account (Idempotent)
      const existingBankAccount = await this.accountRepo.findOne({
        where: { tenantId: tenant.id, name: 'Main Bank Account' },
      });
      if (!existingBankAccount) {
        const bankAccount = this.accountRepo.create({
          tenantId: tenant.id,
          userId: storeAdmin.id,
          name: 'Main Bank Account',
          type: 'BANK',
          currencyCode: 'PKR',
          initialBalance: 10000,
          currentBalance: 10000,
          archived: false,
        });
        await this.accountRepo.save(bankAccount);
      }

      // 7. Categories (Idempotent)
      let catRetail = await this.categoryRepo.findOne({
        where: { tenantId: tenant.id, name: 'POS Retail Sales' },
      });
      if (!catRetail) {
        catRetail = await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: storeAdmin.id,
            name: 'POS Retail Sales',
            type: 'INCOME',
            sortOrder: 0,
            archived: false,
          }),
        );
      }

      let catRestock = await this.categoryRepo.findOne({
        where: { tenantId: tenant.id, name: 'Inventory Restock' },
      });
      if (!catRestock) {
        catRestock = await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: storeAdmin.id,
            name: 'Inventory Restock',
            type: 'EXPENSE',
            sortOrder: 1,
            archived: false,
          }),
        );
      }

      let catUtilities = await this.categoryRepo.findOne({
        where: { tenantId: tenant.id, name: 'Utilities & Rent' },
      });
      if (!catUtilities) {
        await this.categoryRepo.save(
          this.categoryRepo.create({
            tenantId: tenant.id,
            userId: storeAdmin.id,
            name: 'Utilities & Rent',
            type: 'EXPENSE',
            sortOrder: 2,
            archived: false,
          }),
        );
      }

      // 8. Default Walk-in Customer (Idempotent)
      const existingCustomer = await this.customerRepo.findOne({
        where: { tenantId: tenant.id, email: 'walkin@main-store.com' },
      });
      if (!existingCustomer) {
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
      }

      // 9. Seed Sample Products (Idempotent)
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
          imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
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
          imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
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
          imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=400&q=80',
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
          imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&q=80',
          categoryId: catRetail.id,
        },
      ];

      for (const p of sampleProducts) {
        const existingProduct = await this.productRepo.findOne({
          where: { tenantId: tenant.id, sku: p.sku },
        });
        if (!existingProduct) {
          await this.productRepo.save(
            this.productRepo.create({
              ...p,
              tenantId: tenant.id,
              active: true,
            }),
          );
        }
      }
    } catch (err) {
      this.logger.error('Error during database seeding:', err);
    }
  }
}
