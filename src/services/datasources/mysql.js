const { configureDatasource } = require('./generic');

let args = {};
args._ = 'MySQL';
args._connectionUrl = 'jdbc:mysql://localhost:3306/wso2mysql';
args._defaultAutoCommit = 'false';
args._driver = 'com.mysql.jdbc.Driver';
args._validationQuery = 'SELECT 1';

exports.configure = async function (log, cli) {
	configureDatasource(log, cli, args);
};
