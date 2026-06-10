import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-hub/job-application requests to the JobHub Service.
 * Protected by X-API-Key header — internal/worker-only endpoint.
 * Covers: GET, POST /job-application | GET, PATCH, DELETE /job-application/:id
 */
@ApiTags('JobHub — Job Applications (Internal)')
@ApiSecurity('api-key')
@Controller('job-hub/job-application')
@UseGuards(ApiKeyGuard)
export class JobApplicationProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // Matches /job-hub/job-application (list + create)
  @All()
  @ApiOperation({
    summary: 'Job Applications proxy — list & create (worker only)',
    description:
      '**Internal endpoint — requires `X-API-Key` header.**\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET  | /job-hub/job-application | List job applications |\n' +
      '| POST | /job-hub/job-application | Create job application |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxyRoot(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }

  // Matches /job-hub/job-application/:id
  @All('*')
  @ApiOperation({
    summary: 'Job Applications proxy — single resource (worker only)',
    description:
      '**Internal endpoint — requires `X-API-Key` header.**\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET    | /job-hub/job-application/:id | Fetch by UUID |\n' +
      '| PATCH  | /job-hub/job-application/:id | Update |\n' +
      '| DELETE | /job-hub/job-application/:id | Remove |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }
}
