import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['customers', 'api/customers'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers(@Query('query') query?: string) {
    return this.customersService.getCustomers(query);
  }

  @Get(':id')
  async getCustomerById(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.getCustomerById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(@Body() dto: CustomerDto) {
    return this.customersService.createCustomer(dto);
  }

  @Put(':id')
  async updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CustomerDto>,
  ) {
    return this.customersService.updateCustomer(id, dto);
  }
}
