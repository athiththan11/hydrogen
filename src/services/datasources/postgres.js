const { configureDatasource } = require('./generic');

let args = {};
args._ = 'Postgres';
args._connectionUrl = 'jdbc:postgresql://localhost:5432/wso2postgres';
args._driver = 'org.postgresql.Driver';
args._validationQuery = 'SELECT 1; COMMIT';
args._defaultAutoCommit = 'true';

exports.configure = async function (log, cli) {
	configureDatasource(log, cli, args);
};
