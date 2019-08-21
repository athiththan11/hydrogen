const { Command } = require('@oclif/command');

class DatasoureCommand extends Command {
	async run() {
		this._help();
	}
}

DatasoureCommand.usage = [
	'[COMMAND]',
];

DatasoureCommand.description = `Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
...
Alter datasource configurations of WSO2 products based on your preference.

List all available datasource commands using
$ hydrogen datasource --help
`;

DatasoureCommand.examples = ['$ hydrogen datasource:is [FLAGS] [ARGS]'];

module.exports = DatasoureCommand;
