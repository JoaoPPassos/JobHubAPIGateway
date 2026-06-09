import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'] as string | undefined;
    const validKey = this.configService.get<string>('internalApiKey');

    if (!validKey) {
      throw new UnauthorizedException(
        'Internal API key is not configured on the gateway',
      );
    }

    if (!providedKey || providedKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing X-API-Key header');
    }

    return true;
  }
}
