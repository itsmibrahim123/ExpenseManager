import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { StockAdjustmentDto } from '../products/dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['stock', 'api/stock'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class StockController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('adjust')
  async adjustStock(@Body() dto: StockAdjustmentDto) {
    return this.productsService.adjustStock(dto);
  }

  @Get('movements')
  async getMovements(@Query('productId') productId?: string) {
    const id = productId ? parseInt(productId, 10) : undefined;
    return this.productsService.getMovements(id);
  }
}
