import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ProxyModule } from '../../proxy/proxy.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { AuthProxyController } from './controllers/auth-proxy.controller';
import { UsersProxyController } from './controllers/users-proxy.controller';
import { ApplicationsProxyController } from './controllers/applications-proxy.controller';
import { JobsProxyController } from './controllers/jobs-proxy.controller';
import { JobApplicationProxyController } from './controllers/job-application-proxy.controller';

@Module({
  imports: [AuthModule, ProxyModule],
  controllers: [
    AuthProxyController,
    UsersProxyController,
    ApplicationsProxyController,
    JobsProxyController,
    JobApplicationProxyController,
  ],
  providers: [JwtAuthGuard, ApiKeyGuard],
})
export class JobApplyModule {}
