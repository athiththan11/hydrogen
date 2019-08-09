const { configureDatasource } = require('./generic');

let args = {};
args._ = 'Oracle';
args._connectionUrl = 'jdbc:oracle:thin:@localhost:1521/orcl';
args._driver = 'oracle.jdbc.OracleDriver';
args._validationQuery = 'SELECT 1 FROM DUAL';

exports.configure = async function (ocli) {
	configureDatasource(ocli, args);
};
