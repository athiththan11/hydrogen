const { configureDatasource } = require('./generic');

let args = {};
args._ = 'MySQLCarbonDB';
args._name = 'MySQL_Carbon_DB';
args._connectionUrl = 'jdbc:mysql://localhost:3306/wso2mysql';
args._defaultAutoCommit = 'false';
args._driver = 'com.mysql.jdbc.Driver';
args._validationQuery = 'SELECT 1';

exports.configure = async function (ocli, product) {
	if (product === 'am') {
		args._maxActive = '50';
	}

	configureDatasource(ocli, args, product);
};
