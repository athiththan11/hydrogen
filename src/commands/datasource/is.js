const { Command, flags } = require('@oclif/command');

const Postgres = require('../../services/datasources/postgres');
const MySQL = require('../../services/datasources/mysql');
const Oracle = require('../../services/datasources/oracle');

class DatasourceISCommand extends Command {
	async run() {
		const { flags } = this.parse(DatasourceISCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		const container = flags.container;
		const generate = flags.generate;

		const replace = flags.replace;

		if (replace) {
			this.log(`starting to alter wso2is-${version} with ${datasource} configurations`);

			if (datasource === 'postgres')
				await Postgres.configure(this, 'is', { container, generate });
			if (datasource === 'mysql')
				await MySQL.configure(this, 'is', { container, generate });
			if (datasource === 'oracle') {
				await Oracle.configure(this, 'is', { container, generate });
			}
		} else {
			this._help();
		}
	}
}

DatasourceISCommand.usage = [
	'datasource:is [FLAGS] [ARGS]',
];

DatasourceISCommand.description = `Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models
...
Alter datasource configurations of WSO2 IS products based on your preference.

As of now, Hydrogen only supports replacing the default H2 datasource with a variety
of available supported datasource models. To replace the default shipped H2 datasource,
use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).
`;

DatasourceISCommand.examples = [
	`Replace H2 with Postgres
$ hydrogen datasource:is -R -v 5.7 -d postgres`,
	`Replace H2 with MySQL
$ hydrogen datasource:is -R -v 5.7 -d mysql`,
	`Replace H2 with Oracle
$ hydrogen datasource:is -R -v 5.7 -d oracle`,
];

DatasourceISCommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version. supported versions are [is >= 5.7]',
		hidden: false,
		multiple: false,
		required: true,
		default: '5.7',
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
	container: flags.boolean({
		char: 'c',
		description: 'create docker container for datasource',
		hidden: false,
		multiple: false,
		required: false,
	}),
	generate: flags.boolean({
		char: 'g',
		description: 'generate database and tables in run-time created container',
		hidden: false,
		multiple: false,
		required: false,
		dependsOn: ['container'],
	}),
	replace: flags.boolean({
		char: 'R',
		description: 'replace h2 datasource',
		hidden: false,
		multiple: false,
	}),
};

module.exports = DatasourceISCommand;
