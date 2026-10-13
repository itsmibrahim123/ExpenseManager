import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Product } from './entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { TenantContext } from '../../common/context/tenant-context';
import {
  CreateProductDto,
  UpdateProductDto,
  RestockProductDto,
  StockAdjustmentDto,
} from './dto/product.dto';

/**
 * Safely unlinks an uploaded file from disk if it exists inside the /uploads directory.
 */
export function deleteUploadedFileSafely(imageUrl?: string | null): void {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
    return;
  }
  try {
    const cleanPath = imageUrl.replace(/^\/+/, ''); // uploads/tenants/...
    const fullPath = join(process.cwd(), cleanPath);
    const uploadsRoot = join(process.cwd(), 'uploads');

    // Security check against path traversal
    if (fullPath.startsWith(uploadsRoot) && existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  } catch (err) {
    Logger.warn(`Failed to unlink file for imageUrl ${imageUrl}: ${err.message}`, 'ProductsService');
  }
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

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
      costPrice: dto.costPrice || 0,
      sellingPrice: dto.sellingPrice || 0,
      reorderLevel: dto.reorderLevel !== undefined ? dto.reorderLevel : 5,
      unit: dto.unit || 'PCS',
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

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(id);

    // If an image is being replaced or removed, clean up old file from disk
    if (dto.imageUrl !== undefined && dto.imageUrl !== product.imageUrl && product.imageUrl) {
      deleteUploadedFileSafely(product.imageUrl);
    }

    Object.assign(product, dto);
    await this.productRepo.save(product);
    return this.getProductById(id);
  }

  async updateProductImage(id: number, imageUrl: string): Promise<Product> {
    const product = await this.getProductById(id);

    // Clean up previous image file if it exists and differs
    if (product.imageUrl && product.imageUrl !== imageUrl) {
      deleteUploadedFileSafely(product.imageUrl);
    }

    product.imageUrl = imageUrl;
    await this.productRepo.save(product);
    return this.getProductById(id);
  }

  async deleteProductImage(id: number): Promise<Product> {
    const product = await this.getProductById(id);
    if (product.imageUrl) {
      deleteUploadedFileSafely(product.imageUrl);
      product.imageUrl = null as any;
      await this.productRepo.save(product);
    }
    return this.getProductById(id);
  }

  async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    const product = await this.getProductById(id);
    if (product.imageUrl) {
      deleteUploadedFileSafely(product.imageUrl);
    }
    await this.productRepo.remove(product);
    return { success: true, message: `Product ${id} deleted successfully` };
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
