import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async getCustomers(query?: string): Promise<Customer[]> {
    const tenantId = this.getTenantId();
    const qb = this.customerRepo.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    if (query) {
      qb.andWhere(
        '(LOWER(c.name) LIKE :q OR LOWER(c.phone) LIKE :q OR LOWER(c.email) LIKE :q)',
        { q: `%${query.toLowerCase()}%` },
      );
    }

    qb.orderBy('c.name', 'ASC');
    return qb.getMany();
  }

  async getCustomerById(id: number): Promise<Customer> {
    const tenantId = this.getTenantId();
    const customer = await this.customerRepo.findOne({
      where: { id, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer not found with id: ${id}`);
    }
    return customer;
  }

  async createCustomer(dto: CustomerDto): Promise<Customer> {
    const tenantId = this.getTenantId();
    const customer = this.customerRepo.create({
      ...dto,
      tenantId,
      currentCreditBalance: dto.currentCreditBalance || 0,
    });
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: number, dto: Partial<CustomerDto>): Promise<Customer> {
    const customer = await this.getCustomerById(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }
}
