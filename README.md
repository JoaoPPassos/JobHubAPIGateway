# JobHub API Gateway

API Gateway for the JobHub platform. Handles authentication, rate limiting, and request proxying to upstream services.

## Overview

The gateway sits in front of the JobHub Service and is the single entry point for all client requests. It validates JWT tokens and API keys, enforces rate limits, and transparently forwards requests to the appropriate upstream service.

```
Client → API Gateway (:4000) → JobHub Service (:3000)
```

## Routes

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signUp` | Register a new user |
| POST | `/auth/login` | Login — returns access + refresh token |
| POST | `/auth/refresh` | Renew access token |
| GET | `/auth/confirm` | Confirm email address |
| GET | `/health` | Health check |
| GET | `/api/docs` | Swagger UI |

### JWT Protected — requires `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Authenticated user profile |
| PATCH | `/users/email-credentials` | Save IMAP credentials |
| GET | `/applications` | List applications |
| POST | `/applications` | Create application |
| GET | `/applications/:id` | Fetch application by ID |
| PATCH | `/applications/:id` | Update application |
| DELETE | `/applications/:id` | Remove application |

### Internal — requires `X-API-Key` header (worker only)

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/jobs/:id/metadata` | Update job metadata (enrichment worker) |
| GET | `/job-application` | List job applications |
| POST | `/job-application` | Create job application |
| GET | `/job-application/:id` | Fetch by ID |
| PATCH | `/job-application/:id` | Update |
| DELETE | `/job-application/:id` | Remove |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `PROXY_TIMEOUT` | `30000` | Upstream request timeout (ms) |
| `HASH_TOKEN` | — | JWT secret — must match the JobHub Service |
| `INTERNAL_API_KEY` | — | Shared secret for internal/worker endpoints |
| `JOB_HUB_SERVICE_URL` | `http://localhost:3000` | JobHub Service base URL |
| `THROTTLE_TTL` | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | `100` | Max requests per window |

## Running Locally

```bash
npm install
cp .env.example .env
# fill in .env values
npm run start:dev
```

Swagger UI available at `http://localhost:4000/api/docs`.

## Docker

```bash
docker build -t jobhub-api-gateway .
docker run -p 4000:4000 --env-file .env jobhub-api-gateway
```

Or with Docker Compose:

```bash
docker compose up
```

## Deployment

Push to `main` triggers the GitHub Actions workflow which:

1. Builds and pushes the Docker image to `ghcr.io/joaoppassos/jobhub-api-gateway:latest`
2. Deploys to Hostinger VPS via `hostinger/deploy-on-vps`

Required GitHub secrets and variables: `HOSTINGER_API_KEY`, `PERSONAL_ACCESS_TOKEN`, `HOSTINGER_VM_ID`, `HASH_TOKEN`, `INTERNAL_API_KEY`, `JOB_HUB_SERVICE_URL`, `CORS_ORIGIN`, `PROXY_TIMEOUT`, `THROTTLE_TTL`, `THROTTLE_LIMIT`.

## Architecture

```
src/
├── auth/               # JWT strategy and AuthModule
├── common/
│   ├── decorators/     # @Public() decorator
│   ├── filters/        # Global HTTP exception filter
│   ├── guards/         # JwtAuthGuard, ApiKeyGuard
│   └── middleware/     # Request logger
├── config/             # configuration.ts — maps env vars to config object
├── health/             # GET /health
├── modules/
│   └── job-hub/        # Proxy controllers for all JobHub Service routes
├── proxy/              # ProxyService — forwards requests to upstream
└── swagger/            # Swagger UI + OpenAPI spec proxy
```

### Proxy behaviour

`ProxyService` forwards every request to the upstream service preserving the original path, query string, and a forwarded headers allowlist (`authorization`, `content-type`, `accept`, `user-agent`, `x-request-id`, `x-correlation-id`). It also adds `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-proto`, and `x-gateway: jobhub-api-gateway`.

Upstream errors are forwarded as-is. Network errors return `503` (unreachable) or `504` (timeout).

### Generating the `INTERNAL_API_KEY`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
