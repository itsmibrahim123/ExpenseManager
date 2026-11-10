import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { tenantId },
      select: ['id', 'tenantId', 'fullName', 'email', 'role', 'userStatus', 'status', 'preferredCurrency'],
      order: { id: 'ASC' },
    });
  }

  async createStaff(tenantId: string, dto: CreateStaffDto): Promise<Partial<User>> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`Email '${dto.email}' is already registered`);
    }

    if (dto.role === UserRole.ROLE_SUPER_ADMIN) {
      throw new BadRequestException('Cannot assign Super Admin role to store staff');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      tenantId,
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      userStatus: UserStatus.ACTIVE,
      status: 'ACTIVE',
    });

    const saved = await this.userRepo.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async updateStaffRole(tenantId: string, id: number, role: UserRole): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException(`Staff member not found with id ${id}`);
    }

    if (role === UserRole.ROLE_SUPER_ADMIN) {
      throw new BadRequestException('Cannot elevate store staff to Super Admin');
    }

    user.role = role;
    return this.userRepo.save(user);
  }

  async toggleStaffStatus(tenantId: string, id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException(`Staff member not found with id ${id}`);
    }

    const newStatus = user.userStatus === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    user.userStatus = newStatus;
    user.status = newStatus;
    return this.userRepo.save(user);
  }

  async deleteStaff(tenantId: string, id: number, currentUserId: number): Promise<{ success: boolean; message: string }> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own user account');
    }

    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException(`Staff member not found with id ${id}`);
    }

    await this.userRepo.delete({ id, tenantId });
    return { success: true, message: `Staff member '${user.fullName}' removed successfully` };
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }
}
