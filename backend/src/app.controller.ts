import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      status: 'UP',
      name: 'ExpenseManager SaaS ERP Backend (NestJS + TypeScript)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
    };
  }

  @Public()
  @Get(['health', 'api/health'])
  getHealth() {
    return {
      status: 'UP',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
