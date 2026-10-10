import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['categories', 'api/categories'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.categoriesService.getAll(uid, type);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getById(id);
  }

  @Post()
  async create(@Body() dto: CategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CategoryDto>,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
