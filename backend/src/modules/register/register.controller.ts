import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { RegisterService } from './register.service';
import { OpenRegisterDto, CloseRegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['register', 'api/register'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  async openSession(@Body() dto: OpenRegisterDto) {
    return this.registerService.openSession(dto);
  }

  @Post('close/:sessionId')
  async closeSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CloseRegisterDto,
  ) {
    return this.registerService.closeSession(sessionId, dto);
  }

  @Get('active')
  async getActiveSession(@Query('userId') userId: string) {
    const uid = parseInt(userId, 10);
    return this.registerService.getActiveSession(uid);
  }

  @Get('daily-summary')
  async getDailySummary(
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.registerService.getDailySummary(targetDate, uid);
  }
}
