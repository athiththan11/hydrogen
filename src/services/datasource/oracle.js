const { configureDatasource } = require('./generic');
const { buildContainer } = require('../docker/datasource/generic');

const { logger } = require('../../utils/logger');

exports.configure = async function (ocli, product, opts) {
	let args = {
		_connectionUrl: 'jdbc:oracle:thin:@localhost:1521/wso2oracle',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for registry and user manager',
		_driver: 'oracle.jdbc.OracleDriver',
		_jndiName: 'jdbc/WSO2OracleCarbonDB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2_ORACLE_CARBON_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'oracle',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1 FROM DUAL',
	};

	if (product === 'am') {
		args._connectionUrl = 'jdbc:oracle:thin:@localhost:1521/wso2oracle';
		args._defaultAutoCommit = 'true';
		args._description = 'The datasource used for API Manager database';
		args._jndiName = 'jdbc/WSO2AM_DB';
		args._maxActive = '100';
		args._name = 'WSO2AM_DB';
	}

	configureDatasource(ocli, args, product, 'oracle').then(() => {
		if (product === 'is' && opts.container)
			buildContainer(ocli, 'oracle', opts).catch(error => {
				if (error) logger.error('Something went wrong while building container for oracle\n' + error);
			});
	}).catch(error => {
		if (error) logger.error(error);
	});
};
