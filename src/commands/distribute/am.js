const { Command, flags } = require('@oclif/command');

const Generic = require('../../services/distributed/generic');

class DistributeAMCommand extends Command {
	async run() {
		const { flags } = this.parse(DistributeAMCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		if (flags['multiple-gateway']) {
			this.log(`starting to configure apim-${version} ${datasource ? 'with ' + datasource + ' ' : ''}for multiple gateway setup`);
			await Generic.configure(this, { 'multiple-gateway': true });
		}
		if (flags.distributed) {
			this.log(`starting to configure apim-${version} ${datasource ? 'with ' + datasource + ' ' : ''}for distributed setup`);
			await Generic.configure(this, { distributed: true });
		}

		if (!flags['multiple-gateway'] && !flags.distributed) {
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
$ hydrogen distribute:am -D -v 2.6 -d postgres`,
	`Configure APIM for publish through multiple-gateway setup
$ hydrogen distribute:am -M -v 2.6 -d postgres`,
];

DistributeAMCommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version',
		hidden: true,
		multiple: false,
		required: true,
		default: '2.6',
		options: ['2.6'],
	}),
	datasource: flags.string({
		char: 'd',
		description: 'datasource type',
		hidden: true,
		multiple: false,
		required: false,
		options: ['postgres', 'mysql', 'oracle'],
	}),
	'multiple-gateway': flags.boolean({
		char: 'M',
		description: 'publish through multiple gateway',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['distributed'],
	}),
	distributed: flags.boolean({
		char: 'D',
		description: '5 node distributed setup',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['multiple-gatway'],
	}),
};

module.exports = DistributeAMCommand;
