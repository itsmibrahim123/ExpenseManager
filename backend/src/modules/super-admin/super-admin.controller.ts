import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import {
  TenantOnboardingDto,
  UpdateTenantStatusDto,
  UpdateSubscriptionDto,
} from './dto/super-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller(['admin', 'api/admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ROLE_SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: TenantOnboardingDto) {
    return this.superAdminService.provisionTenant(dto);
  }

  @Get('tenants')
  async getTenants(
    @Query('status') status?: string,
    @Query('planTier') planTier?: string,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const sizeNum = size ? parseInt(size, 10) : 20;
    return this.superAdminService.getTenants(status, planTier, query, pageNum, sizeNum);
  }

  @Get('tenants/:id')
  async getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  @Put('tenants/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.superAdminService.updateStatus(id, dto.status);
  }

  @Put('tenants/:id/subscription')
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.superAdminService.updateSubscription(id, dto);
  }

  @Get('metrics')
  async getPlatformMetrics() {
    return this.superAdminService.getPlatformMetrics();
  }

  @Get('tenants/:id/settings')
  async getSettings(@Param('id') id: string) {
    return this.superAdminService.getSettings(id);
  }

  @Put('tenants/:id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.superAdminService.updateSettings(id, data);
  }
}
