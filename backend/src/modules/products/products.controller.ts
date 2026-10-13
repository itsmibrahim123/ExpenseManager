import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
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
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProductsService } from './products.service';
import { CreateProductDto, RestockProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

const productPhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/products';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `plate-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/i)) {
    return cb(
      new BadRequestException('Only image files (JPG, PNG, WEBP, GIF) are allowed!'),
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
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: productPhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      imageUrl: `/uploads/products/${file.filename}`,
      filename: file.filename,
    };
  }

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
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const imageUrl = `/uploads/products/${file.filename}`;
    return this.productsService.updateProductImage(id, imageUrl);
  }

  @Post(':id/restock')
  async restockProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestockProductDto,
  ) {
    return this.productsService.restockProduct(id, dto);
  }
}
