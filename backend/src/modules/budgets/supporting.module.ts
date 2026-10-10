import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Injectable,
  Module,
  ParseIntPipe,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Tag } from '../tags/entities/tag.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

// --- Budgets ---
@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
  ) {}

  async getAll(userId: number) {
    return this.budgetRepo.find({ where: { userId } });
  }

  async create(data: any) {
    return this.budgetRepo.save(this.budgetRepo.create(data));
  }

  async delete(id: number) {
    await this.budgetRepo.delete(id);
    return { message: 'Budget deleted' };
  }
}

@Controller(['budgets', 'api/budgets'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async getAll(@Query('userId') userId: string) {
    return this.budgetsService.getAll(parseInt(userId, 10));
  }

  @Post()
  async create(@Body() data: any) {
    return this.budgetsService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.budgetsService.delete(id);
  }
}

// --- Merchants ---
@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  async getAll(userId: number) {
    return this.merchantRepo.find({ where: { userId } });
  }

  async create(data: any) {
    return this.merchantRepo.save(this.merchantRepo.create(data));
  }
}

@Controller(['merchants', 'api/merchants'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  async getAll(@Query('userId') userId: string) {
    return this.merchantsService.getAll(parseInt(userId, 10));
  }

  @Post()
  async create(@Body() data: any) {
    return this.merchantsService.create(data);
  }
}

// --- Payment Methods ---
@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly pmRepo: Repository<PaymentMethod>,
  ) {}

  async getAll(userId: number) {
    return this.pmRepo.find({ where: { userId, archived: false } });
  }

  async create(data: any) {
    return this.pmRepo.save(this.pmRepo.create(data));
  }
}

@Controller(['paymentMethods', 'api/paymentMethods'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class PaymentMethodsController {
  constructor(private readonly pmService: PaymentMethodsService) {}

  @Get()
  async getAll(@Query('userId') userId: string) {
    return this.pmService.getAll(parseInt(userId, 10));
  }

  @Post()
  async create(@Body() data: any) {
    return this.pmService.create(data);
  }
}

// --- Tags ---
@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async getAll(userId: number) {
    return this.tagRepo.find({ where: { userId } });
  }

  async create(data: any) {
    return this.tagRepo.save(this.tagRepo.create(data));
  }
}

@Controller(['tags', 'api/tags'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async getAll(@Query('userId') userId: string) {
    return this.tagsService.getAll(parseInt(userId, 10));
  }

  @Post()
  async create(@Body() data: any) {
    return this.tagsService.create(data);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Budget, Merchant, PaymentMethod, Tag])],
  providers: [BudgetsService, MerchantsService, PaymentMethodsService, TagsService],
  controllers: [
    BudgetsController,
    MerchantsController,
    PaymentMethodsController,
    TagsController,
  ],
  exports: [BudgetsService, MerchantsService, PaymentMethodsService, TagsService],
})
export class SupportingModule {}
