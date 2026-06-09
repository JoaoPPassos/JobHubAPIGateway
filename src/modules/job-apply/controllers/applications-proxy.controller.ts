import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-apply/applications requests to the JobApply Service.
 * Requires a valid JWT Bearer token.
 * Covers: GET, POST /applications | GET, PATCH, DELETE /applications/:id
 */
@ApiTags('JobApply — Applications')
@ApiBearerAuth('Bearer')
@Controller('job-apply/applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // Matches /job-apply/applications (list + create)
  @All()
  @ApiOperation({
    summary: 'Applications proxy — list & create',
    description:
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET  | /job-apply/applications | List (filters: user_id, job_id, status) |\n' +
      '| POST | /job-apply/applications | Create application |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  proxyRoot(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }

  // Matches /job-apply/applications/:id
  @All('*')
  @ApiOperation({
    summary: 'Applications proxy — single resource',
    description:
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET    | /job-apply/applications/:id | Fetch by UUID |\n' +
      '| PATCH  | /job-apply/applications/:id | Update |\n' +
      '| DELETE | /job-apply/applications/:id | Remove |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }
}
