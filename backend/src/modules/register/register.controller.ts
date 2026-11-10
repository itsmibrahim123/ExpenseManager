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
  Req,
} from '@nestjs/common';
import { RegisterService } from './register.service';
import { OpenRegisterDto, CloseRegisterDto, CreateRegisterMovementDto } from './dto/register.dto';
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

  @Post('movement')
  @HttpCode(HttpStatus.CREATED)
  async addMovement(@Body() dto: CreateRegisterMovementDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.registerService.addMovement(dto, userId);
  }

  @Get('movements/:sessionId')
  async getMovements(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.registerService.getMovements(sessionId);
  }

  @Get('active')
  async getActiveSession(@Query('userId') userId?: string, @Req() req?: any) {
    const parsedId = userId ? parseInt(userId, 10) : undefined;
    const uid = (parsedId && !isNaN(parsedId)) ? parsedId : (req?.user?.id || req?.user?.userId);
    return this.registerService.getActiveSession(uid);
  }

  @Get('history')
  async getHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.registerService.getHistory(start, end, uid);
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
