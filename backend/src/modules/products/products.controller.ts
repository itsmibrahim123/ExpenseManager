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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, RestockProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

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
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Post(':id/restock')
  async restockProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestockProductDto,
  ) {
    return this.productsService.restockProduct(id, dto);
  }
}
