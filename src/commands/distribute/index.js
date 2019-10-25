const { Command } = require('@oclif/command');

class DistributeCommand extends Command {
	async run() {
		this._help();
	}
}

DistributeCommand.usage = [
	'[COMMAND]',
];

DistributeCommand.description = `Configure WSO2 products for distributed deployments
...
Configure WSO2 products for supported distributed deployment setups.

List all available distribute commands using
$ hydrogen distribute --help
`;

DistributeCommand.examples = ['$ hydrogen distribute:am [FLAGS] [ARGS]'];

module.exports = DistributeCommand;
