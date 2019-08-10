const { Command, flags } = require('@oclif/command');

const Postgres = require('../../services/datasources/postgres');
const MySQL = require('../../services/datasources/mysql');
const Oracle = require('../../services/datasources/oracle');

class DatasourceISCommand extends Command {
	async run() {
		const { flags } = this.parse(DatasourceISCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		const replace = flags.replace;

		if (replace) {
			this.log(`starting to alter wso2is-${version} with ${datasource} configurations`);

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

DatasourceISCommand.usage = [
	'datasource:is [FLAGS] [ARGS]',
];

DatasourceISCommand.description = `Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
...
Alter datasource configurations of WSO2 products based on your preference.

As of now, Hydrogen only supports replacing the default H2 datasource with a variety
of available datasources supported. To replace the default shipped H2 datasource,
use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).
`;

DatasourceISCommand.examples = [
	`Replace H2 with Postgres
$ hydrogen datasource:is -R -v 5.7 -d postgres`,
];

DatasourceISCommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version. supported versions are [is >= 5.7]',
		hidden: false,
		multiple: false,
		required: false,
		options: ['5.7'],
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

module.exports = DatasourceISCommand;
