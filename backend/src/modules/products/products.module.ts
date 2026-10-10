import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StockController } from '../stock/stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement])],
  providers: [ProductsService],
  controllers: [ProductsController, StockController],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
