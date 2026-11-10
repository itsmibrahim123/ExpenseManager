import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [StaffController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
