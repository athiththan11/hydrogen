const { configureDatasource } = require('./generic');
const { buildContainer } = require('../docker/datasource/generic');

exports.configure = async function (ocli, product, opts) {
	let args = {
		_connectionUrl: 'jdbc:postgresql://localhost:5432/wso2postgres',
		_defaultAutoCommit: 'true',
		_description: 'The datasource used for registry and user manager',
		_driver: 'org.postgresql.Driver',
		_jndiName: 'jdbc/WSO2PostgresCarbonDB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2_POSTGRES_CARBON_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'postgres',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1; COMMIT',
	};

	if (product === 'am') {
		args._connectionUrl = 'jdbc:postgresql://localhost:5432/wso2amdb';
		args._defaultAutoCommit = 'true';
		args._description = 'The datasource used for API Manager database';
		args._jndiName = 'jdbc/WSO2AM_DB';
		args._name = 'WSO2AM_DB';
	}

	configureDatasource(ocli, args, product, 'postgres').then(() => {
		if ((product === 'is' || product === 'am') && opts.container) {
			buildContainer(ocli, 'postgres', product, opts);
		}
	});
};
