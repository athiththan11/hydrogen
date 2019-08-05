const { Command, flags } = require('@oclif/command');
const { cli } = require('cli-ux');
const { logger } = require('../utils/logger');

const Postgres = require('../services/datasources/postgres');
const MySQL = require('../services/datasources/mysql');

class AlterCommand extends Command {
	async run() {
		const { flags } = this.parse(AlterCommand);
		const product = flags.product;
		const version = flags.version;
		const datasource = flags.datasource;

		this.log(`starting to alter ${product}-${version} with ${datasource} configurations`);

		cli.action.start('\taltering master-datasources.xml');
		if (datasource === 'postgres')
			await Postgres.configPostgres(this.log, cli);
		else if (datasource === 'mysql')
			await MySQL.configMySQL(this.log, cli);
	}
}

AlterCommand.description = `alter wso2 products with different datasources
...
Extra documentation goes here
`;

AlterCommand.flags = {
	product: flags.string({
		char: 'p',
		description: 'wso2 product',
		hidden: false,
		multiple: false,
		default: 'is',
		required: true,
		options: ['is'],
	}),
	version: flags.string({
		char: 'v',
		description: 'product version. supported versions are [is >= 5.7]',
		hidden: false,
		multiple: false,
		default: '5.7',
		required: true,
	}),
	datasource: flags.string({
		char: 'd',
		description: 'datasource type',
		hidden: false,
		multiple: false,
		required: true,
		default: 'mysql',
		options: ['postgres', 'mysql'],
	}),
};

module.exports = AlterCommand;
