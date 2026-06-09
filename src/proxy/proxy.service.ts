import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError, Method } from 'axios';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async forwardToJobApply(req: Request, res: Response): Promise<void> {
    const serviceUrl = this.configService.get<string>(
      'services.jobApply.url',
      'http://localhost:3000',
    );
    const timeoutMs = this.configService.get<number>(
      'services.jobApply.timeout',
      30000,
    );

    // Preserve the original URL (path + query string) for the upstream request
    const targetUrl = `${serviceUrl}${req.originalUrl}`;
    const headers = this.buildForwardHeaders(req);

    this.logger.debug(`→ ${req.method} ${targetUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as Method,
          url: targetUrl,
          headers,
          data: this.hasBody(req) ? req.body : undefined,
          timeout: timeoutMs,
          // Accept any status so upstream errors are forwarded as-is
          validateStatus: () => true,
        }),
      );

      this.copyResponseHeaders(response.headers, res);
      res.status(response.status).json(response.data);
    } catch (error) {
      this.handleUpstreamError(error, res);
    }
  }

  private buildForwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    const allowList = [
      'authorization',
      'content-type',
      'accept',
      'accept-language',
      'x-request-id',
      'x-correlation-id',
      'user-agent',
    ];

    allowList.forEach((name) => {
      const value = req.headers[name];
      if (value) {
        headers[name] = Array.isArray(value) ? value.join(', ') : value;
      }
    });

    const clientIp = req.ip ?? '';
    const existingXff = req.headers['x-forwarded-for'];
    headers['x-forwarded-for'] = existingXff
      ? `${existingXff}, ${clientIp}`
      : clientIp;

    headers['x-forwarded-host'] = req.headers.host ?? '';
    headers['x-forwarded-proto'] = req.protocol;
    headers['x-gateway'] = 'jobhub-api-gateway';

    return headers;
  }

  private copyResponseHeaders(
    upstreamHeaders: Record<string, any>,
    res: Response,
  ): void {
    // Skip HTTP/1.1 hop-by-hop headers that must not be forwarded
    const skip = new Set([
      'connection',
      'keep-alive',
      'transfer-encoding',
      'te',
      'trailer',
      'upgrade',
      'proxy-authorization',
      'proxy-authenticate',
      'content-encoding', // axios already decompressed the body
    ]);

    Object.entries(upstreamHeaders).forEach(([key, value]) => {
      if (!skip.has(key.toLowerCase()) && value !== undefined) {
        res.setHeader(key, value as string | string[]);
      }
    });
  }

  private hasBody(req: Request): boolean {
    return (
      req.body !== undefined &&
      req.body !== null &&
      Object.keys(req.body).length > 0
    );
  }

  private handleUpstreamError(error: unknown, res: Response): void {
    if (res.headersSent) return;

    if (error instanceof AxiosError) {
      if (error.response) {
        // The upstream responded with an error status — forward it
        this.copyResponseHeaders(error.response.headers, res);
        res.status(error.response.status).json(error.response.data);
        return;
      }

      if (error.code === 'ECONNREFUSED') {
        this.logger.error('JobApply service is unreachable (ECONNREFUSED)');
        res.status(503).json({
          statusCode: 503,
          message: 'Service temporarily unavailable',
          error: 'Service Unavailable',
        });
        return;
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        this.logger.error('JobApply service timed out');
        res.status(504).json({
          statusCode: 504,
          message: 'Gateway timeout — upstream service did not respond in time',
          error: 'Gateway Timeout',
        });
        return;
      }
    }

    this.logger.error('Unexpected proxy error', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal gateway error',
      error: 'Internal Server Error',
    });
  }
}
