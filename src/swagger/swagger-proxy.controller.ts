import {
  Controller,
  Get,
  Param,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Public } from '../common/decorators/public.decorator';

interface SwaggerServiceConfig {
  key: string;
  name: string;
  url: string;
  docsPath: string;
}

@Controller('api')
export class SwaggerProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Probes all configured swagger services in parallel and returns
   * only the ones currently available, as a Swagger UI `urls` array.
   */
  @Public()
  @Get('docs-services')
  async getAvailableServices(): Promise<{ url: string; name: string }[]> {
    const services =
      this.configService.get<SwaggerServiceConfig[]>('swagger.services') ?? [];

    const probes = services.map(async (svc) => {
      try {
        await firstValueFrom(
          this.httpService.get(`${svc.url}${svc.docsPath}`, { timeout: 3000 }),
        );
        return { url: `/api/docs-json/${svc.key}`, name: svc.name };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(probes);
    return results.filter((r): r is { url: string; name: string } => r !== null);
  }

  /**
   * Proxies the OpenAPI spec from the named service without rewriting servers,
   * so "Try it out" hits the service directly.
   */
  @Public()
  @Get('docs-json/:service')
  async getSpec(@Param('service') serviceKey: string) {
    const services =
      this.configService.get<SwaggerServiceConfig[]>('swagger.services') ?? [];
    const svc = services.find((s) => s.key === serviceKey);

    if (!svc) {
      throw new NotFoundException(`Unknown service: ${serviceKey}`);
    }

    const { data } = await firstValueFrom(
      this.httpService.get(`${svc.url}${svc.docsPath}`, { timeout: 5000 }),
    );

    return data;
  }

  /**
   * Serves the Swagger UI HTML. The page fetches /api/docs-services at load
   * time to build the service dropdown dynamically.
   */
  @Public()
  @Get('docs')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSwaggerUi(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>JobHub API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/swagger-ui-assets/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="/swagger-ui-assets/swagger-ui-bundle.js"></script>
<script src="/swagger-ui-assets/swagger-ui-standalone-preset.js"></script>
<script>
  window.onload = async () => {
    let urls = [];
    try {
      const res = await fetch('/api/docs-services');
      urls = await res.json();
    } catch (e) {
      console.error('Failed to load API services list', e);
    }

    if (urls.length === 0) {
      document.getElementById('swagger-ui').innerHTML =
        '<p style="padding:2rem;font-family:sans-serif">No API services are currently available.</p>';
      return;
    }

    SwaggerUIBundle({
      urls,
      'urls.primaryName': urls[0].name,
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      layout: 'StandaloneLayout',
      persistAuthorization: true,
    });
  };
</script>
</body>
</html>`;
  }
}
