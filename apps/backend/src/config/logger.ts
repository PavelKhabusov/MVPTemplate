import { env } from './env'

export const loggerConfig = {
  level: env.NODE_ENV === 'production' ? 'info' : 'info',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'HH:MM:ss',
            messageFormat: '{reqId} {req.method} {req.url} {res.statusCode} {responseTime}ms',
          },
        }
      : undefined,
  serializers: {
    req(req: any) {
      return { method: req.method, url: req.url }
    },
    res(res: any) {
      return { statusCode: res.statusCode }
    },
  },
}
