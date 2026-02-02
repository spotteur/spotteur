import winston from 'winston'

const { combine, timestamp, errors, json } = winston.format

const excludeError = winston.format((info) => (info.level === 'error' ? false : info))()

export const logger = winston.createLogger({
  level: 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/debug.log',
      format: excludeError,
    }),
  ],
})
