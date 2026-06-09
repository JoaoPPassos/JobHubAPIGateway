import { Controller, All, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-apply/auth/* requests to the JobApply Service.
 * No authentication required — signUp, login, refresh, and email confirmation
 * are all public endpoints.
 */
@ApiTags('JobApply — Auth')
@Controller('job-apply/auth')
export class AuthProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Public()
  @All('*')
  @ApiOperation({
    summary: 'Auth proxy (signUp · login · refresh · confirm)',
    description:
      'Forwards requests to the JobApply Service.\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| POST | /job-apply/auth/signUp | Register user |\n' +
      '| POST | /job-apply/auth/login | Login → access + refresh token |\n' +
      '| POST | /job-apply/auth/refresh | Renew access token |\n' +
      '| GET  | /job-apply/auth/confirm | Confirm email (returns HTML) |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 503, description: 'JobApply Service unavailable' })
  @ApiResponse({ status: 504, description: 'Gateway timeout' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }
}
