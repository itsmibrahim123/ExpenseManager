import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getAll(userId?: number, type?: string) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.categoryRepo.createQueryBuilder('c')
      .where('c.archived = false');

    if (tenantId) {
      qb.andWhere('c.tenantId = :tenantId', { tenantId });
    }
    if (userId) {
      qb.andWhere('(c.userId = :userId OR c.userId IS NULL)', { userId });
    }
    if (type) {
      qb.andWhere('c.type = :type', { type });
    }

    qb.orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC');
    const categories = await qb.getMany();

    // Frontend handles both Page response ({ content: [...] }) and array
    return {
      content: categories,
      totalElements: categories.length,
      totalPages: 1,
      size: categories.length,
      number: 0,
    };
  }

  async getById(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category not found: ${id}`);
    return category;
  }

  async create(dto: CategoryDto): Promise<Category> {
    const tenantId = TenantContext.getTenantId();
    const category = this.categoryRepo.create({
      ...dto,
      tenantId: tenantId || undefined,
      archived: false,
    });
    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: Partial<CategoryDto>): Promise<Category> {
    const category = await this.getById(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async delete(id: number): Promise<void> {
    const category = await this.getById(id);
    category.archived = true;
    await this.categoryRepo.save(category);
  }
}
