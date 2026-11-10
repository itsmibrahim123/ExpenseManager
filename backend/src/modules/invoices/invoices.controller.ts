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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, RecordPaymentDto } from './dto/invoice.dto';
import { InvoiceType } from './entities/invoice.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['invoices', 'api/invoices'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(dto);
  }

  @Get()
  async getInvoices(
    @Query('status') status?: string,
    @Query('type') type?: InvoiceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.invoicesService.getAllInvoices(status, type, start, end);
  }

  @Get('number/:invoiceNumber')
  async getInvoiceByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.getInvoiceByNumber(invoiceNumber);
  }

  @Post(':id/payments')
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.invoicesService.recordPayment(id, dto, userId);
  }

  @Get(':id/pdf')
  async getInvoicePdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoicesService.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':id')
  async getInvoiceById(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.getInvoiceById(id);
  }
}
