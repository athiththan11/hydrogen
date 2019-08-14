const { configureDatasource } = require('./generic');

exports.configure = async function (ocli, product) {
	let args = {
		_connectionUrl: 'jdbc:mysql://localhost:3306/wso2mysql',
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
		args._connectionUrl = 'jdbc:mysql://localhost:3306/wso2amdb';
		args._description = 'The datasource used for API Manager database';
		args._jndiName = 'jdbc/WSO2AM_DB';
		args._name = 'WSO2AM_DB';
	}

	configureDatasource(ocli, args, product, 'mysql');
};
