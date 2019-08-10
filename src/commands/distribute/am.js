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
		} else if (flags.distributed) {
			this.log(`starting to configure apim-${version} ${datasource ? 'with ' + datasource + ' ' : ''}for distributed setup`);
			await Generic.configure(this, { distributed: true });
		}
	}
}

DistributeAMCommand.description = `configure wso2 products for distributed deployments
...
Extra documentation goes here
`;

DistributeAMCommand.examples = ['$ hydrogen distribute:am -v 2.6 -d postgres'];

DistributeAMCommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version',
		hidden: true,
		multiple: false,
		required: false,
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
		description: 'distributed setup',
		hidden: false,
		multiple: false,
		required: false,
		exclusive: ['multiple-gatway'],
	}),
};

module.exports = DistributeAMCommand;
