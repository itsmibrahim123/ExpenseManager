import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateStaffDto, UpdateStaffRoleDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';
import { TenantContext } from '../../common/context/tenant-context';
import { UserRole } from './entities/user.entity';

@Controller(['staff', 'api/staff', 'users/staff', 'api/users/staff'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class StaffController {
  constructor(private readonly usersService: UsersService) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  private checkStoreAdmin(req: any) {
    const role = req.user?.role;
    if (role !== UserRole.ROLE_STORE_ADMIN && role !== UserRole.ROLE_SUPER_ADMIN) {
      throw new ForbiddenException('Only Store Admins can manage store staff members');
    }
  }

  @Get()
  async getStaff(@Req() req: any) {
    this.checkStoreAdmin(req);
    const tenantId = this.getTenantId();
    return this.usersService.findByTenantId(tenantId);
  }

  @Post()
  async createStaff(@Req() req: any, @Body() dto: CreateStaffDto) {
    this.checkStoreAdmin(req);
    const tenantId = this.getTenantId();
    return this.usersService.createStaff(tenantId, dto);
  }

  @Patch(':id/role')
  async updateRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    this.checkStoreAdmin(req);
    const tenantId = this.getTenantId();
    return this.usersService.updateStaffRole(tenantId, id, dto.role);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.checkStoreAdmin(req);
    const tenantId = this.getTenantId();
    return this.usersService.toggleStaffStatus(tenantId, id);
  }

  @Delete(':id')
  async deleteStaff(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.checkStoreAdmin(req);
    const tenantId = this.getTenantId();
    const currentUserId = req.user?.id || req.user?.userId;
    return this.usersService.deleteStaff(tenantId, id, currentUserId);
  }
}
