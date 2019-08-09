const { Command, flags } = require('@oclif/command');

class DistributeCommand extends Command {
	async run() {
		await this._help();
	}
}

DistributeCommand.usage = [
	'[COMMAND]',
];

DistributeCommand.description = `Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
...
Alter datasource configurations of WSO2 products based on your preference.

List all available distribute commands using
$ hydrogen datasource --help
`;

DistributeCommand.examples = ['$ hydrogen datasource:is [FLAGS] [ARGS]'];

module.exports = DistributeCommand;
