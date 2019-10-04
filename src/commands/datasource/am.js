const { Command, flags } = require('@oclif/command');

const MySQL = require('../../services/datasource/mysql');
const Oracle = require('../../services/datasource/oracle');
const Postgres = require('../../services/datasource/postgres');

class DatasourceAPIMCommand extends Command {
	async run() {
		const { flags } = this.parse(DatasourceAPIMCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		const container = flags.container;
		const generate = flags.generate;

		const replace = flags.replace;

		if (replace) {
			this.log(`starting to alter wso2am-${version} with ${datasource} configurations`);

			if (datasource === 'postgres')
				await Postgres.configure(this, 'am', { container, generate });
			if (datasource === 'mysql')
				await MySQL.configure(this, 'am', { container, generate });
			if (datasource === 'oracle')
				await Oracle.configure(this, 'am', { container, generate });
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
	`Replace H2 with Postgres and generate a container for database
$ hydrogen datasource:am -R -v 2.6 -d postgres --container --generate`,
];

DatasourceAPIMCommand.flags = {
	container: flags.boolean({
		char: 'c',
		description: 'create docker container for datasource',
		hidden: false,
		multiple: false,
		required: false,
	}),
	datasource: flags.string({
		char: 'd',
		description: 'datasource type',
		hidden: false,
		multiple: false,
		required: true,
		options: ['postgres', 'mysql', 'oracle'],
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
	version: flags.string({
		char: 'v',
		description: 'wso2am product version',
		hidden: false,
		multiple: false,
		required: true,
		default: '2.6',
		options: ['2.6'],
	}),
};

module.exports = DatasourceAPIMCommand;
