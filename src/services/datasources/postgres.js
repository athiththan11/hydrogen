const { configureDatasource } = require('./generic');

let args = {};
args._ = 'PostgresCarbonDB';
args._name = 'Postgres_Carbon_DB';
args._connectionUrl = 'jdbc:postgresql://localhost:5432/wso2postgres';
args._defaultAutoCommit = 'true';
args._driver = 'org.postgresql.Driver';
args._validationQuery = 'SELECT 1; COMMIT';

exports.configure = async function (ocli, product) {
	configureDatasource(ocli, args, product);
};
