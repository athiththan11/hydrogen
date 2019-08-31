const { Command, flags } = require('@oclif/command');

const MySQL = require('../../services/datasource/mysql');
const Oracle = require('../../services/datasource/oracle');
const Postgres = require('../../services/datasource/postgres');

const { logger } = require('../../utils/logger');

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
				await Postgres.configure(this, 'is', { container, generate }).catch(error => {
					if (error) logger.error(`Something went wrong when altering wso2is-${version} with ${datasource} configurations\n` + error);
				});
			if (datasource === 'mysql')
				await MySQL.configure(this, 'is', { container, generate }).catch(error => {
					if (error) logger.error(`Something went wrong when altering wso2is-${version} with ${datasource} configurations\n` + error);
				});
			if (datasource === 'oracle')
				await Oracle.configure(this, 'is', { container, generate }).catch(error => {
					if (error) logger.error(`Something went wrong when altering wso2is-${version} with ${datasource} configurations\n` + error);
				});
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
	`Replace H2 with Postgres and generate a container for database
$ hydrogen datasource:is -R -v 5.7 -d postgres --container --generate`,
];

DatasourceISCommand.flags = {
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
		description: 'wso2is product version',
		hidden: false,
		multiple: false,
		required: true,
		default: '5.7',
		options: ['5.7'],
	}),
};

module.exports = DatasourceISCommand;
