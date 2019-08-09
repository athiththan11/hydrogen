const { Command, flags } = require('@oclif/command');
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
				await Postgres.configure(this);
			else if (datasource === 'mysql')
				await MySQL.configure(this);
			else if (datasource === 'oracle') {
				await Oracle.configure(this);
			}
		}
	}
}

DatasourceCommand.usage = [
	'datasource [FLAGS] [ARGS]',
];

DatasourceCommand.description = `Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
...
Alter datasource configurations of WSO2 products based on your preference.

As of now, Hydrogen only supports replacing the default H2 datasource with a variety
of available datasources supported. To replace the default shipped H2 datasource,
use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).
`;

DatasourceCommand.examples = [
	`Replace H2 with Postgres
$ hydrogen datasource -R -d postgres -p is -v 5.7`,
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
		char: 'R',
		description: 'replace h2 datasource',
		hidden: false,
		multiple: false,
	}),
};

module.exports = DatasourceCommand;
