const { Command, flags } = require('@oclif/command');

class DistributeCommand extends Command {
	async run() {}
}

DistributeCommand.description = `configure wso2 products for distributed deployments
...
Extra documentation goes here
`;

DistributeCommand.examples = ['$ hydrogen distribute -p am -v 2.6 -d postgres'];

DistributeCommand.flags = {};

module.exports = DistributeCommand;
