const { configureDatasource, buildDriverDoc } = require('./generic');
const { configureAMDatasource } = require('../distribute/generic');
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

	if (opts.setup && product === 'am') {
		let confs = { };
		args._connectionUrl = 'jdbc:postgresql://localhost:5432/apimgtdb';
		confs.am = { ...args };

		args._connectionUrl = 'jdbc:postgresql://localhost:5432/userdb';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';
		confs.um = { ...args };

		args._connectionUrl = 'jdbc:postgresql://localhost:5432/regdb';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';
		confs.reg = { ...args };

		// configure api manager with amdb, userdb, and regdb configurations
		configureAMDatasource(ocli, confs).then(() => {
			ocli.log('\n');
			buildDriverDoc(ocli, 'postgres');
		}).then(() => {
			if (product === 'am' && opts.container) {
				ocli.log('\n');
				buildContainer(ocli, 'postgres', product, opts);
			}
		});
	}

	if (opts.replace)
		configureDatasource(ocli, args, product, 'postgres').then(() => {
			if ((product === 'is' || product === 'am') && opts.container) {
				buildContainer(ocli, 'postgres', product, opts);
			}
		});
};
