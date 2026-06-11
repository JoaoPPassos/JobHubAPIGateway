import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /jobs/* requests to the JobHub Service.
 * Protected by X-API-Key header — internal/worker-only endpoint.
 * Covers: PATCH /jobs/:id/metadata
 */
@ApiTags('JobHub — Jobs (Internal)')
@ApiSecurity('api-key')
@Controller('jobs')
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
      '| PATCH | /jobs/:id/metadata | Update job metadata (called by enrichment worker) |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-API-Key' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }
}
