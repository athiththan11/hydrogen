// eslint-disable-next-line node/no-unpublished-require
const path = require('path');
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logFormat = format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
	format: format.combine(format.colorize(), format.timestamp(), format.align(), logFormat),
	transports: [
		new transports.File({ filename: path.join(__dirname, '/logs', '/hydrogen-error.log'), level: 'error' }),
		new transports.File({ filename: path.join(__dirname, '/logs', '/hydrogen.log') }),
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
