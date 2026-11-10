import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '../entities/invoice.entity';

export class InvoiceItemRequestDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];
}

export class CreateInvoiceDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  @IsNumber()
  @IsOptional()
  parentInvoiceId?: number;

  @IsNumber()
  @IsOptional()
  supplierId?: number;

  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsNumber()
  @IsOptional()
  accountId?: number;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  @IsOptional()
  discountTotal?: number;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemRequestDto)
  items: InvoiceItemRequestDto[];
}

export class RecordPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  referenceNotes?: string;

  @IsNumber()
  @IsOptional()
  accountId?: number;

  @IsOptional()
  paymentDate?: Date;
}
