export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwtSecret: process.env.HASH_TOKEN,
  internalApiKey: process.env.INTERNAL_API_KEY,
  services: {
    jobHub: {
      url: process.env.JOB_HUB_SERVICE_URL ?? 'http://localhost:3000',
      timeout: parseInt(process.env.PROXY_TIMEOUT ?? '30000', 10),
    },
  },
  swagger: {
    // To register a new API service, add an entry here + the corresponding env var.
    services: [
      {
        key: 'job-hub',
        name: 'JobHub Service',
        url: process.env.JOB_HUB_SERVICE_URL ?? 'http://localhost:3000',
        docsPath: '/api/docs-json',
      },
    ],
  },
});
