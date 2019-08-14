const { Command, flags } = require('@oclif/command');
const { logger } = require('../../utils/logger');

const Postgres = require('../../services/datasources/postgres');
const MySQL = require('../../services/datasources/mysql');
const Oracle = require('../../services/datasources/oracle');

class DatasourceAPIMCommand extends Command {
	async run() {
		const { flags } = this.parse(DatasourceAPIMCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		const replace = flags.replace;

		if (replace) {
			this.log(`starting to alter wso2am-${version} with ${datasource} configurations`);

			if (datasource === 'postgres')
				await Postgres.configure(this, 'am');
			else if (datasource === 'mysql')
				await MySQL.configure(this, 'am');
			else if (datasource === 'oracle')
				await Oracle.configure(this, 'am');
		} else {
			this._help();
		}
	}
}

DatasourceAPIMCommand.usage = [
	'datasource:am [FLAGS] [ARGS]',
];

DatasourceAPIMCommand.description = `Alter datasources of WSO2 APIM products (fresh-pack) with supported datasource models
...
Alter datasource configurations of WSO2 APIM products based on your preference.

As of now, Hydrogen only supports replacing the default H2 datasource with a variety
of available datasource models. To replace the default shipped H2 datasource,
use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).
`;

DatasourceAPIMCommand.examples = [
	`Replace H2 with Postgres
$ hydrogen datasource:am -R -v 2.6 -d postgres`,
	`Replace H2 with MySQL
$ hydrogen datasource:am -R -v 2.6 -d mysql`,
	`Replace H2 with Oracle
$ hydrogen datasource:am -R -v 2.6 -d oracle`,
];

DatasourceAPIMCommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version. supported versions are [apim >= 2.6]',
		hidden: false,
		multiple: false,
		required: true,
		default: '2.6',
		options: ['2.6'],
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

module.exports = DatasourceAPIMCommand;
