import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-hub/users/* requests to the JobHub Service.
 * Requires a valid JWT Bearer token.
 * Covers: GET /users/me, PATCH /users/email-credentials
 */
@ApiTags('JobHub — Users')
@ApiBearerAuth('Bearer')
@Controller('job-hub/users')
@UseGuards(JwtAuthGuard)
export class UsersProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  @ApiOperation({
    summary: 'User proxy (me · email-credentials)',
    description:
      'Forwards requests to the JobHub Service.\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET   | /job-hub/users/me | Authenticated user profile |\n' +
      '| PATCH | /job-hub/users/email-credentials | Save IMAP password |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobHub Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 503, description: 'JobHub Service unavailable' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobHub(req, res);
  }
}
