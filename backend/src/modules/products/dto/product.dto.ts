import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductDto {
  id: number;
  tenantId: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  categoryId?: number;
  imageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class RestockProductDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  referenceNo?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockAdjustmentDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  adjustmentType: string; // RESTOCK, ADJUSTMENT, RETURN, DAMAGE

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  referenceNo?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
