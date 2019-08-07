const { Command, flags } = require('@oclif/command');
const { cli } = require('cli-ux');
const { logger } = require('../utils/logger');

const Generic = require('../services/distributed/generic');

class DistributeCommand extends Command {
	async run() {
		const { flags } = this.parse(DistributeCommand);
		const product = flags.product;
		const version = flags.version;
		const datasource = flags.datasource;

		const mulitpleGW = flags['multiple-gatway'];

		this.log(`starting to configure ${product}-${version} with ${datasource} for distributed deployment`);

		if (mulitpleGW)
			await Generic.configure(this.log, cli, { 'multiple-gateway': true });
	}
}

DistributeCommand.description = `configure wso2 products for distributed deployments
...
Extra documentation goes here
`;

DistributeCommand.examples = ['$ hydrogen distribute -p am -v 2.6 -d postgres'];

DistributeCommand.flags = {
	product: flags.string({
		char: 'p',
		description: 'wso2 product',
		hidden: false,
		multiple: false,
		required: true,
		options: ['am'],
	}),
	version: flags.string({
		char: 'v',
		description: 'product version',
		hidden: false,
		multiple: false,
		required: true,
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
	'multiple-gatway': flags.boolean({
		char: 'm',
		description: 'publish through multiple gateway',
		hidden: false,
		multiple: false,
		required: false,
	}),
};

module.exports = DistributeCommand;
