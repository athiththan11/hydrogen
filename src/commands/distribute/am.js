const { Command, flags } = require('@oclif/command');
const { cli } = require('cli-ux');
const { logger } = require('../../utils/logger');

const Generic = require('../../services/distributed/generic');

class DistributeAMCommand extends Command {
	async run() {
		const { flags } = this.parse(DistributeAMCommand);
		const version = flags.version;
		const datasource = flags.datasource;

		const mulitpleGW = flags['multiple-gatway'];

		if (mulitpleGW) {
			this.log(`starting to configure apim-${version} ${datasource ? 'with ' + datasource + ' ' : ''}for multiple gateway setup`);
			await Generic.configure(this.log, { 'multiple-gateway': true });
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
	'multiple-gatway': flags.boolean({
		char: 'm',
		description: 'publish through multiple gateway',
		hidden: false,
		multiple: false,
		required: false,
	}),
};

module.exports = DistributeAMCommand;
