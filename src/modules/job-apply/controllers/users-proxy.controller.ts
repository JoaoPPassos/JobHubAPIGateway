import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProxyService } from '../../../proxy/proxy.service';

/**
 * Forwards all /job-apply/users/* requests to the JobApply Service.
 * Requires a valid JWT Bearer token.
 * Covers: GET /users/me, PATCH /users/email-credentials
 */
@ApiTags('JobApply — Users')
@ApiBearerAuth('Bearer')
@Controller('job-apply/users')
@UseGuards(JwtAuthGuard)
export class UsersProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  @ApiOperation({
    summary: 'User proxy (me · email-credentials)',
    description:
      'Forwards requests to the JobApply Service.\n\n' +
      '| Method | Path | Description |\n' +
      '|--------|------|-------------|\n' +
      '| GET   | /job-apply/users/me | Authenticated user profile |\n' +
      '| PATCH | /job-apply/users/email-credentials | Save IMAP password |',
  })
  @ApiResponse({ status: 200, description: 'Forwarded response from JobApply Service' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 503, description: 'JobApply Service unavailable' })
  proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyService.forwardToJobApply(req, res);
  }
}
