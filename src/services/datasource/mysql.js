const { configureDatasource, buildDriverDoc } = require('./generic');
const { configureAMDatasource } = require('../distribute/generic');
const { buildContainer } = require('../docker/datasource/generic');

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

	if (opts.setup && product === 'am') {
		let confs = { };
		args._connectionUrl = 'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true';
		confs.am = { ...args };

		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';
		confs.um = { ...args };

		args._connectionUrl = 'jdbc:mysql://localhost:3306/regdb?autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';
		confs.reg = { ...args };

		// configure api manager with amdb, userdb, and regdb configurations
		configureAMDatasource(ocli, confs).then(() => {
			ocli.log('\n');
			buildDriverDoc(ocli, 'mysql');
		}).then(() => {
			if (product === 'am' && opts.container) {
				ocli.log('\n');
				buildContainer(ocli, 'mysql', product, opts);
			}
		});
	}

	if (opts.replace)
		configureDatasource(ocli, args, product, 'mysql').then(() => {
			if ((product === 'is' || product === 'am') && opts.container) {
				buildContainer(ocli, 'mysql', product, opts);
			}
		});
};
