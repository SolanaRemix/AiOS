export const config = {
  app: { name: 'AiOS', version: '1.0.0', env: process.env.NODE_ENV || 'development' },
  api: { port: Number(process.env.PORT) || 4000, url: process.env.API_URL || 'http://localhost:4000' },
  web: { port: 3000, url: process.env.APP_URL || 'http://localhost:3000' },
  database: { url: process.env.DATABASE_URL || '' },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  llm: {
    openai: { apiKey: process.env.OPENAI_API_KEY || '', defaultModel: 'gpt-4o' },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY || '', defaultModel: 'claude-3-5-sonnet-20241022' },
    groq: { apiKey: process.env.GROQ_API_KEY || '', defaultModel: 'llama-3.3-70b-versatile' },
    ollama: { baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434', defaultModel: 'llama3.2' },
  },
  logging: { level: process.env.LOG_LEVEL || 'info' },
  features: { enableRedis: true, enablePgVector: true, enableWebBrowsing: false },
} as const;

export default config;
