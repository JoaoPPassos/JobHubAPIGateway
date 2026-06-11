import { Controller, All, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /auth/* requests to the JobHub Service.
 * No authentication required — signUp, login, refresh, and email confirmation
 * are all public endpoints.
 */
@ApiTags('JobHub — Auth')
@Controller('auth')
export class AuthProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Public()
  @All('*')
  @ApiOperation({
    summary: 'Auth proxy (signUp · login · refresh · confirm)',
    description:
      'Forwards requests to the JobHub Service.\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| POST | /auth/signUp | Register user |\n' +
      '| POST | /auth/login | Login → access + refresh token |\n' +
      '| POST | /auth/refresh | Renew access token |\n' +
      '| GET  | /auth/confirm | Confirm email (returns HTML) |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 503, description: 'JobHub Service unavailable' })
  @ApiResponse({ status: 504, description: 'Gateway timeout' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }
}
