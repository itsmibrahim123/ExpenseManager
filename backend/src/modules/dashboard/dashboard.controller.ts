import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['dashboard', 'api/dashboard'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Query('userId') userId?: string) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getSummary(uid);
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getCategoryBreakdown(uid, type);
  }

  @Get('account-summary')
  async getAccountSummary(@Query('userId') userId?: string) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getAccountSummary(uid);
  }

  @Get('spending-trends')
  async getSpendingTrends(@Query('userId') userId?: string) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getSpendingTrends(uid);
  }

  @Get('income-expense-comparison')
  async getIncomeExpenseComparison(@Query('userId') userId?: string) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getIncomeExpenseComparison(uid);
  }

  @Get('top-categories')
  async getTopCategories(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getTopCategories(uid, type);
  }

  @Get('budget-progress')
  async getBudgetProgress(@Query('userId') userId?: string) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.dashboardService.getBudgetProgress(uid);
  }
}
