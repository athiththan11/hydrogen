const { Command, flags } = require('@oclif/command');

// const { Postgres } = require('../services/datasources/postgres');

class AlterCommand extends Command {
	async run() {
		const { flags } = this.parse(AlterCommand);
		const product = flags.product;
		const version = flags.version;
		const datasource = flags.datasource;

		this.log(`Starting to alter ${product}-${version} with ${datasource}`);
	}
}

AlterCommand.description = `Alter datasources of a carbon product
...
Extra documentation goes here
`;

AlterCommand.flags = {
	product: flags.string({
		char: 'p',
		description: 'specify the carbon product',
		hidden: false,
		multiple: false,
		default: 'is',
		required: true,
		options: ['is'],
	}),
	version: flags.string({
		char: 'v',
		description: 'specified product version. supported versions are [is >= 5.7]',
		hidden: false,
		multiple: false,
		default: '5.7',
		required: true,
	}),
	datasource: flags.string({
		char: 'd',
		description: 'database vendor',
		hidden: false,
		multiple: false,
		required: true,
		default: 'postgres',
		options: ['postgres'],
	}),
};

module.exports = AlterCommand;
