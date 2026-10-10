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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['accounts', 'api/accounts'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccounts(
    @Query('userId') userId?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    const isArchived = includeArchived === 'true' || includeArchived === '1';
    return this.accountsService.getAccounts(uid, isArchived);
  }

  @Get(':id')
  async getAccountById(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.getAccountById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(dto);
  }

  @Put(':id')
  async updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(id, dto);
  }

  @Delete(':id/archive')
  async archiveAccount(
    @Param('id', ParseIntPipe) id: number,
    @Query('force') force?: string,
  ) {
    const isForce = force === 'true' || force === '1';
    const message = await this.accountsService.archiveAccount(id, isForce);
    return { message };
  }
}
