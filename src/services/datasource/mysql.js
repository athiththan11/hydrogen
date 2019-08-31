const { configureDatasource } = require('./generic');
const { buildContainer } = require('../docker/datasource/generic');

const { logger } = require('../../utils/logger');

exports.configure = async function (ocli, product, opts) {
	let args = {
		_connectionUrl: 'jdbc:mysql://localhost:3306/wso2mysql?autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for registry and user manager',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2MySQLCarbonDB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2_MYSQL_CARBON_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	if (product === 'am') {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/wso2amdb?autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true';
		args._description = 'The datasource used for API Manager database';
		args._jndiName = 'jdbc/WSO2AM_DB';
		args._name = 'WSO2AM_DB';
	}

	configureDatasource(ocli, args, product, 'mysql').then(() => {
		if (product === 'is' && opts.container) {
			buildContainer(ocli, 'mysql', opts).catch(error => {
				if (error) logger.error('Something went wrong while building container for mysql\n' + error);
			});
		}
	}).catch(error => {
		if (error) logger.error(error);
	});
};
