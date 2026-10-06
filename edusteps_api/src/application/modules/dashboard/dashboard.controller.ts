import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags("Dashboard")
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
    constructor(
        private readonly service: DashboardService,
        private readonly tenantAccess: TenantAccessService,
    ) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Return aggregated stats for the dashboard' })
    async getStats(@Query('clientId') clientId: string, @Request() req: any) {
        await this.tenantAccess.assertClientAccess(clientId, req.user.id);
        return this.service.getStats(clientId);
    }

    @Get('revenue-chart')
    @ApiOperation({ summary: 'Get 6-month revenue chart data' })
    async getRevenueChart(@Query('clientId') clientId: string, @Request() req: any) {
        await this.tenantAccess.assertClientAccess(clientId, req.user.id);
        return this.service.getRevenueChart(clientId);
    }

    @Get('activity')
    @ApiOperation({ summary: 'Get recent activity' })
    @ApiResponse({ status: 200, description: 'Return recent activities' })
    async getActivity(@Query('clientId') clientId: string, @Request() req: any) {
        await this.tenantAccess.assertClientAccess(clientId, req.user.id);
        return this.service.getActivity(clientId);
    }
}
