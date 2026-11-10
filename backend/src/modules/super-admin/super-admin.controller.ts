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
  HttpStatus,
  HttpCode,
  Req,
  ParseIntPipe,
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

  @Get('users')
  async getAllUsers(
    @Query('query') query?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.getAllUsers(query, role, status);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createPlatformUser(@Body() data: any) {
    return this.superAdminService.createPlatformUser(data);
  }

  @Put('users/:id/access')
  async updateUserAccess(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.superAdminService.updateUserAccess(id, data);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const currentUserId = req.user?.id || req.user?.userId;
    return this.superAdminService.deletePlatformUser(id, currentUserId);
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
