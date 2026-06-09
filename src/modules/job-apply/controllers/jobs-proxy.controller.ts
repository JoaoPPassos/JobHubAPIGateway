import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-apply/jobs/* requests to the JobApply Service.
 * Protected by X-API-Key header — internal/worker-only endpoint.
 * Covers: PATCH /jobs/:id/metadata
 */
@ApiTags('JobApply — Jobs (Internal)')
@ApiSecurity('api-key')
@Controller('job-apply/jobs')
@UseGuards(ApiKeyGuard)
export class JobsProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  @ApiOperation({
    summary: 'Jobs proxy — metadata update (worker only)',
    description:
      '**Internal endpoint — requires `X-API-Key` header.**\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| PATCH | /job-apply/jobs/:id/metadata | Update job metadata (called by enrichment worker) |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }
}
