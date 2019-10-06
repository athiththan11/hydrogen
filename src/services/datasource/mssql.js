const { configureDatasource, buildDriverDoc } = require('./generic');
const { configureAMDatasource } = require('../distribute/generic');
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

	if (opts.setup && product === 'am') {
		let confs = { };
		args._connectionUrl = 'jdbc:sqlserver://localhost:1433;databaseName=apimgtdb;SendStringParametersAsUnicode=false';
		confs.am = { ...args };

		args._connectionUrl = 'jdbc:sqlserver://localhost:1433;databaseName=userdb;SendStringParametersAsUnicode=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';
		confs.um = { ...args };

		args._connectionUrl = 'jdbc:sqlserver://localhost:1433;databaseName=regdb;SendStringParametersAsUnicode=false';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';
		confs.reg = { ...args };

		// configure api manager with amdb, userdb, and regdb configurations
		configureAMDatasource(ocli, confs).then(() => {
			ocli.log('\n');
			buildDriverDoc(ocli, 'mssql');
		}).then(() => {
			if (product === 'am' && opts.container) {
				ocli.log('\n');
				buildContainer(ocli, 'mssql', product, opts);
			}
		});
	}

	if (opts.replace)
		configureDatasource(ocli, args, product, 'mssql').then(() => {
			if ((product === 'is' || product === 'am') && opts.container) {
				buildContainer(ocli, 'mssql', product, opts);
			}
		});
};
