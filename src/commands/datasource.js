const { Command, flags } = require('@oclif/command');
const { cli } = require('cli-ux');
const { logger } = require('../utils/logger');

const Postgres = require('../services/datasources/postgres');
const MySQL = require('../services/datasources/mysql');
const Oracle = require('../services/datasources/oracle');

class DatasourceCommand extends Command {
	async run() {
		const { flags } = this.parse(DatasourceCommand);
		const product = flags.product;
		const version = flags.version;
		const datasource = flags.datasource;
		const replace = flags.replace;

		if (replace) {
			this.log(`starting to alter ${product}-${version} with ${datasource} configurations`);

			if (datasource === 'postgres')
				await Postgres.configure(this.log, cli);
			else if (datasource === 'mysql')
				await MySQL.configure(this.log, cli);
			else if (datasource === 'oracle') {
				await Oracle.configure(this.log, cli);
			}
		}
	}
}

DatasourceCommand.description = `alter datasources of wso2 products with available listed datasource vendors
...
Extra documentation goes here
`;

DatasourceCommand.examples = [
	'$ hydrogen datasource --replace -d postgres -p is -v 5.7',
];

DatasourceCommand.flags = {
	product: flags.string({
		char: 'p',
		description: 'wso2 product',
		hidden: false,
		multiple: false,
		required: true,
		options: ['is'],
	}),
	version: flags.string({
		char: 'v',
		description: 'product version. supported versions are [is >= 5.7]',
		hidden: false,
		multiple: false,
		required: true,
	}),
	datasource: flags.string({
		char: 'd',
		description: 'datasource type',
		hidden: false,
		multiple: false,
		required: true,
		options: ['postgres', 'mysql', 'oracle'],
	}),
	replace: flags.boolean({
		char: 'r',
		description: 'replace h2 datasource',
		hidden: false,
		multiple: false,
	}),
};

module.exports = DatasourceCommand;
