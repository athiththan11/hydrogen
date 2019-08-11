const { configureDatasource } = require('./generic');

let args = {};
args._ = 'OracleCarbonDB';
args._name = 'Oracle_Carbon_DB';
args._connectionUrl = 'jdbc:oracle:thin:@localhost:1521/orcl';
args._driver = 'oracle.jdbc.OracleDriver';
args._validationQuery = 'SELECT 1 FROM DUAL';

exports.configure = async function (ocli, product) {
	configureDatasource(ocli, args, product);
};
