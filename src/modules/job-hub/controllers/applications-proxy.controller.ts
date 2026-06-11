import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /applications requests to the JobHub Service.
 * Requires a valid JWT Bearer token.
 * Covers: GET, POST /applications | GET, PATCH, DELETE /applications/:id
 */
@ApiTags('JobHub — Applications')
@ApiBearerAuth('Bearer')
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // Matches /applications (list + create)
  @All()
  @ApiOperation({
    summary: 'Applications proxy — list & create',
    description:
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET  | /applications | List (filters: user_id, job_id, status) |\n' +
      '| POST | /applications | Create application |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  proxyRoot(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }

  // Matches /applications/:id
  @All('*')
  @ApiOperation({
    summary: 'Applications proxy — single resource',
    description:
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET    | /applications/:id | Fetch by UUID |\n' +
      '| PATCH  | /applications/:id | Update |\n' +
      '| DELETE | /applications/:id | Remove |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }
}
