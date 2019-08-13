// eslint-disable-next-line node/no-unpublished-require
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logFormat = format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
	format: format.combine(format.colorize(), format.timestamp(), format.align(), logFormat),
	transports: [
		// new transports.File({ filename: '/Users/athiththan/Athiththan/Projects/GitHub/hydrogen/logs/error.log', level: 'error' }),
		// new transports.File({ filename: '/Users/athiththan/Athiththan/Projects/GitHub/hydrogen/logs/hydrogen.log' }),
		new winston.transports.Console({
			format: format.combine(format.timestamp(), logFormat),
		}),
	],
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new winston.transports.Console({
			format: format.combine(format.timestamp(), logFormat),
		})
	);
}

module.exports = { logger };
