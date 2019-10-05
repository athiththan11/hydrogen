const { configureDatasource } = require('./generic');
const { buildContainer } = require('../docker/datasource/generic');

exports.configure = async function (ocli, product, opts) {
	let args = {
		_connectionUrl: 'jdbc:sqlserver://localhost:1433;databaseName=wso2mssql;SendStringParametersAsUnicode=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for registry and user manager',
		_driver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
		_jndiName: 'jdbc/WSO2MSSQLCarbonDB',
		_maxActive: '50',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2_MSSQL_CARBON_DB',
		_password: 'Hydr0g@n',
		_testOnBorrow: 'true',
		_username: 'sa',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	if (product === 'am') {
		args._connectionUrl = 'jdbc:sqlserver://localhost:1433;databaseName=wso2amdb;SendStringParametersAsUnicode=false';
		args._defaultAutoCommit = 'true';
		args._description = 'The datasource used for API Manager database';
		args._jndiName = 'jdbc/WSO2AM_DB';
		args._name = 'WSO2AM_DB';
	}

	configureDatasource(ocli, args, product, 'mssql').then(() => {
		if ((product === 'is' || product === 'am') && opts.container) {
			buildContainer(ocli, 'mssql', product, opts);
		}
	});
};
