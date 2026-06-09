import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-apply/job-application requests to the JobApply Service.
 * Protected by X-API-Key header — internal/worker-only endpoint.
 * Covers: GET, POST /job-application | GET, PATCH, DELETE /job-application/:id
 */
@ApiTags('JobApply — Job Applications (Internal)')
@ApiSecurity('api-key')
@Controller('job-apply/job-application')
@UseGuards(ApiKeyGuard)
export class JobApplicationProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // Matches /job-apply/job-application (list + create)
  @All()
  @ApiOperation({
    summary: 'Job Applications proxy — list & create (worker only)',
    description:
      '**Internal endpoint — requires `X-API-Key` header.**\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET  | /job-apply/job-application | List job applications |\n' +
      '| POST | /job-apply/job-application | Create job application |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxyRoot(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }

  // Matches /job-apply/job-application/:id
  @All('*')
  @ApiOperation({
    summary: 'Job Applications proxy — single resource (worker only)',
    description:
      '**Internal endpoint — requires `X-API-Key` header.**\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET    | /job-apply/job-application/:id | Fetch by UUID |\n' +
      '| PATCH  | /job-apply/job-application/:id | Update |\n' +
      '| DELETE | /job-apply/job-application/:id | Remove |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }
}
