const { Command, flags } = require('@oclif/command');

const { configure } = require('../../services/distribute/generic');
const ISKM = require('../../services/distribute/am/is-km');

class DistributeAMCommand extends Command {
	async run() {
		const { flags } = this.parse(DistributeAMCommand);
		const container = flags.container;
		const datasource = flags.datasource;
		const generate = flags.generate;
		const version = flags.version;

		let message = `starting to configure apim-${version} ${datasource ? 'with ' + datasource + ' ' : ''}`;

		if (flags['multiple-gateway']) {
			this.log(`${message}for multiple gateway setup`);
			await configure(this, { 'multiple-gateway': true });
		}
		if (flags.distributed) {
			this.log(`${message}for distributed setup`);
			await configure(this, { distributed: true });
		}
		if (flags['is-km']) {
			this.log(`${message}with IS as Keymanager`);
			await ISKM.configure(this, { container, datasource, generate });
		}

		if (!flags['multiple-gateway'] && !flags.distributed && !flags['is-km']) {
			this._help();
		}
	}
}

DistributeAMCommand.description = `Configure WSO2 APIM products (fresh-pack) for distributed deployments
...
Configure WSO2 APIM products for distributed deployments setup based on your preference.

As of now, Hydrogen only supports configurations for 5 node distributed deployment setup,
and publish through multiple-gateway node setup. For 5 node distribution, use --distributed (-D)
flag, and for multiple-gateway node, use --multiple-gateway (-M) flag.
`;

DistributeAMCommand.examples = [
	`Configure APIM for 5 node distributed setup
$ hydrogen distribute:am --distributed -v 2.6`,
	`Configure APIM for publish through multiple-gateway setup
$ hydrogen distribute:am --multiple-gateway -v 2.6`,
	`Configure APIM with IS-KM setup with Postgres datasource
$ hydrogen distribute:am --is-km -v 2.6 --datasource postgres`,
	`Configure APIM with IS-KM setup and generate container for database
$ hydrogen distribute:am --is-km -v 2.6 --datasource postgres --container --generate`,
];

DistributeAMCommand.flags = {
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
		options: ['mssql', 'mysql', 'postgres'],
	}),
	distributed: flags.boolean({
		char: 'D',
		description: '5 node distributed setup',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['multiple-gateway', 'is-km'],
	}),
	generate: flags.boolean({
		char: 'g',
		description: 'generate database and tables in run-time created container',
		hidden: false,
		multiple: false,
		required: false,
		dependsOn: ['container'],
	}),
	'is-km': flags.boolean({
		char: 'I',
		description: 'IS as Keymanager setup',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['multiple-gateway', 'distributed'],
	}),
	'multiple-gateway': flags.boolean({
		char: 'M',
		description: 'publish through multiple gateway',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['distributed', 'is-km'],
	}),
	version: flags.string({
		char: 'v',
		description: 'product version',
		hidden: true,
		multiple: false,
		required: true,
		default: '2.6',
		options: ['2.6'],
	}),
};

module.exports = DistributeAMCommand;
