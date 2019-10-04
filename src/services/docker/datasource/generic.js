const { buildPostgresContainer } = require('./postgres');
const { buildMySQLContainer } = require('./mysql');
const { buildMSSQLContainer } = require('./mssql');

let paths = {
	is: {
		pConsent: '/dbscripts/consent',
		pDBScripts: '/dbscripts',
		pIdentity: '/dbscripts/identity',
		pStoredProcedure: '/dbscripts/identity/stored-procedures',
		pUma: '/dbscripts/identity/uma',
	},
	am: {
		pApimgt: '/dbscripts/apimgt',
		pDBScripts: '/dbscripts',
		pMBStore: '/dbscripts/mb-store',
	},
};

exports.buildContainer = async function (ocli, database, product, opts) {
	if (database === 'postgres') {
		await buildPostgresContainer(ocli, paths, product, opts);
	}
	if (database === 'mysql') {
		await buildMySQLContainer(ocli, paths, product, opts);
	}
	if (database === 'mssql') {
		await buildMSSQLContainer(ocli, paths, product, opts);
	}
};
