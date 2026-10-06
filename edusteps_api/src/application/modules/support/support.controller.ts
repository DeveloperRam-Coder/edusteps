import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a support ticket' })
  create(@Req() req: any, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.create(req.user.id, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List all support tickets for current user' })
  findAll(@Req() req: any) {
    return this.supportService.findAll(req.user.id);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a single support ticket' })
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.supportService.findOne(req.user.id, id);
  }
}
