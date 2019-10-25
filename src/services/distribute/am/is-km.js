const { configure } = require('../generic');
const { buildDriverDoc } = require('../../datasource/generic');
const { buildContainer } = require('../../docker/datasource/generic');

const MSSQL = require('../../datasource/mssql');
const MySQL = require('../../datasource/mysql');
const Postgres = require('../../datasource/postgres');

exports.configure = async function (ocli, opts) {
	opts.setup = true;
	opts['is-km'] = true;
	if (opts.datasource === 'mssql' || opts.datasource === 'mysql' || opts.datasource === 'postgres') {
		let confs = {};
		if (opts.datasource === 'mssql')
			confs = MSSQL.getConfigs('am', opts);
		if (opts.datasource === 'mysql')
			confs = MySQL.getConfigs('am', opts);
		if (opts.datasource === 'postgres')
			confs = Postgres.getConfigs('am', opts);

		await configure(ocli, { 'is-km': true, args: confs });
		buildDriverDoc(ocli, opts.datasource);
		if (opts.container) {
			ocli.log('\n');
			buildContainer(ocli, opts.datasource, 'am', opts);
		}
	}
};
