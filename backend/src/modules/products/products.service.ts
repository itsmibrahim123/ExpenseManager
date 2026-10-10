import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreateProductDto, RestockProductDto, StockAdjustmentDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required for product operations');
    }
    return tenantId;
  }

  async getAllProducts(search?: string, lowStockOnly?: boolean): Promise<Product[]> {
    const tenantId = this.getTenantId();
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere(
        '(LOWER(p.name) LIKE :s OR LOWER(p.sku) LIKE :s OR LOWER(p.barcode) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    if (lowStockOnly) {
      qb.andWhere('p.currentStock <= p.reorderLevel');
    }

    qb.orderBy('p.createdAt', 'DESC');
    return qb.getMany();
  }

  async getProductById(id: number): Promise<Product> {
    const tenantId = this.getTenantId();
    const product = await this.productRepo.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product not found with id: ${id}`);
    }
    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const tenantId = this.getTenantId();

    const existing = await this.productRepo.findOne({
      where: { sku: dto.sku, tenantId },
    });
    if (existing) {
      throw new BadRequestException(`Product with SKU '${dto.sku}' already exists.`);
    }

    const product = this.productRepo.create({
      ...dto,
      tenantId,
      currentStock: dto.currentStock || 0,
      reorderLevel: dto.reorderLevel ?? 5,
      active: dto.active !== undefined ? dto.active : true,
    });

    const saved = await this.productRepo.save(product);

    if (saved.currentStock > 0) {
      await this.stockMovementRepo.save(
        this.stockMovementRepo.create({
          tenantId,
          productId: saved.id,
          movementType: 'INITIAL_STOCK',
          quantityChanged: saved.currentStock,
          balanceAfter: saved.currentStock,
          referenceId: 'INIT',
          notes: 'Initial Product Stock Setup',
        }),
      );
    }

    return this.getProductById(saved.id);
  }

  async updateProduct(id: number, dto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.getProductById(id);
    Object.assign(product, dto);
    await this.productRepo.save(product);
    return this.getProductById(id);
  }

  async restockProduct(id: number, dto: RestockProductDto): Promise<Product> {
    const product = await this.getProductById(id);
    const newStock = product.currentStock + dto.quantity;
    product.currentStock = newStock;
    await this.productRepo.save(product);

    await this.stockMovementRepo.save(
      this.stockMovementRepo.create({
        tenantId: product.tenantId,
        productId: product.id,
        movementType: 'RESTOCK',
        quantityChanged: dto.quantity,
        balanceAfter: newStock,
        referenceId: dto.referenceNo || 'RESTOCK',
        notes: dto.notes || 'Inventory Restock',
      }),
    );

    return this.getProductById(id);
  }

  async adjustStock(dto: StockAdjustmentDto): Promise<Product> {
    const product = await this.getProductById(dto.productId);
    const qtyChange =
      dto.adjustmentType === 'DAMAGE' || dto.adjustmentType === 'ADJUSTMENT_DAMAGE'
        ? -Math.abs(dto.quantity)
        : dto.quantity;

    const newStock = product.currentStock + qtyChange;
    product.currentStock = newStock;
    await this.productRepo.save(product);

    await this.stockMovementRepo.save(
      this.stockMovementRepo.create({
        tenantId: product.tenantId,
        productId: product.id,
        movementType: dto.adjustmentType,
        quantityChanged: qtyChange,
        balanceAfter: newStock,
        referenceId: dto.referenceNo || 'ADJUST',
        notes: dto.reason || 'Manual Stock Adjustment',
      }),
    );

    return this.getProductById(product.id);
  }

  async getMovements(productId?: number): Promise<StockMovement[]> {
    const tenantId = this.getTenantId();
    const where: any = { tenantId };
    if (productId) {
      where.productId = productId;
    }
    return this.stockMovementRepo.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.getAllProducts(undefined, true);
  }
}
