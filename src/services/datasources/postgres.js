const { configureDatasource } = require('./generic');

let args = {};
args._ = 'Postgres';
args._connectionUrl = 'jdbc:postgresql://localhost:5432/wso2postgres';
args._defaultAutoCommit = 'true';
args._driver = 'org.postgresql.Driver';
args._validationQuery = 'SELECT 1; COMMIT';

exports.configure = async function (ocli) {
	configureDatasource(ocli, args);
};
