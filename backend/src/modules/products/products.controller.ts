import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, RestockProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';
import { TenantContext } from '../../common/context/tenant-context';

/**
 * Tenant-isolated disk storage engine:
 * uploads/tenants/{tenantId}/products/{uuid}-{sanitizedFilename}.{ext}
 */
const productPhotoStorage = diskStorage({
  destination: (req: any, file, cb) => {
    const tenantId =
      req.user?.tenantId ||
      req.headers['x-tenant-id'] ||
      TenantContext.getTenantId() ||
      'default';

    const uploadDir = join(process.cwd(), 'uploads', 'tenants', String(tenantId), 'products');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const uniqueId = randomUUID();
    const originalNameWithoutExt = file.originalname
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}-${originalNameWithoutExt}${ext}`);
  },
});

/**
 * Whitelist strict allowed MIME types: JPG, PNG, WebP (Reject SVG & executables)
 */
const imageFileFilter = (req: any, file: any, cb: any) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype.toLowerCase())) {
    return cb(
      new BadRequestException(
        'Only JPG, PNG, and WebP image formats are allowed (up to 5MB)!',
      ),
      false,
    );
  }
  cb(null, true);
};

@Controller(['products', 'api/products'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    const isLowStock = lowStockOnly === 'true' || lowStockOnly === '1';
    return this.productsService.getAllProducts(search, isLowStock);
  }

  @Get('low-stock')
  async getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.deleteProduct(id);
  }

  /**
   * Standalone Image Upload:
   * POST /api/products/upload-image
   * Accepts multipart/form-data with 'file' and optional 'productId'.
   * Saves to uploads/tenants/{tenantId}/products/{filename}
   */
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: productPhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body('productId') productId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const tenantId =
      req.user?.tenantId ||
      req.headers['x-tenant-id'] ||
      TenantContext.getTenantId() ||
      'default';
    const imageUrl = `/uploads/tenants/${tenantId}/products/${file.filename}`;

    if (productId) {
      const pId = parseInt(productId, 10);
      if (!isNaN(pId)) {
        await this.productsService.updateProductImage(pId, imageUrl);
      }
    }

    return {
      imageUrl,
      filename: file.filename,
    };
  }

  /**
   * Product-specific Image Upload:
   * POST /api/products/:id/image
   */
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: productPhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProductImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const tenantId =
      req.user?.tenantId ||
      req.headers['x-tenant-id'] ||
      TenantContext.getTenantId() ||
      'default';
    const imageUrl = `/uploads/tenants/${tenantId}/products/${file.filename}`;
    return this.productsService.updateProductImage(id, imageUrl);
  }

  /**
   * Delete Product Image:
   * DELETE /api/products/:id/image
   */
  @Delete(':id/image')
  async deleteProductImage(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.deleteProductImage(id);
  }

  @Post(':id/restock')
  async restockProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestockProductDto,
  ) {
    return this.productsService.restockProduct(id, dto);
  }
}
