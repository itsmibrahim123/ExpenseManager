import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async getAccounts(userId?: number, includeArchived: boolean = false): Promise<Account[]> {
    const tenantId = this.getTenantId();
    const qb = this.accountRepo.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId });

    if (userId) {
      qb.andWhere('a.userId = :userId', { userId });
    }

    if (!includeArchived) {
      qb.andWhere('a.archived = false');
    }

    qb.orderBy('a.name', 'ASC');
    return qb.getMany();
  }

  async getAccountById(id: number): Promise<Account> {
    const tenantId = this.getTenantId();
    const account = await this.accountRepo.findOne({ where: { id, tenantId } });
    if (!account) {
      throw new NotFoundException(`Account not found with id: ${id}`);
    }
    return account;
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const tenantId = this.getTenantId();
    const initial = dto.initialBalance !== undefined ? Number(dto.initialBalance) : 0;
    const current = dto.currentBalance !== undefined ? Number(dto.currentBalance) : initial;

    const account = this.accountRepo.create({
      ...dto,
      tenantId,
      initialBalance: initial,
      currentBalance: current,
      currencyCode: dto.currencyCode || 'PKR',
      archived: dto.archived || false,
    });

    return this.accountRepo.save(account);
  }

  async updateAccount(id: number, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.getAccountById(id);
    Object.assign(account, dto);
    return this.accountRepo.save(account);
  }

  async archiveAccount(id: number, force: boolean = false): Promise<string> {
    const account = await this.getAccountById(id);
    if (!force && Number(account.currentBalance) !== 0) {
      throw new BadRequestException('Cannot archive account with non-zero balance without force parameter.');
    }
    account.archived = true;
    await this.accountRepo.save(account);
    return `Account '${account.name}' has been archived successfully.`;
  }
}
