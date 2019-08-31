const { Command, flags } = require('@oclif/command');

const { configure } = require('../../services/distribute/ei');

class DistributeEICommand extends Command {
	async run() {
		const { flags } = this.parse(DistributeEICommand);
		const version = flags.version;

		if (flags.cluster && flags.profile === 'esb') {
			this.log(`starting to configure ei-${version} (esb profile) for 2 node clustered deployment`);
			await configure(this, { esb: true });
		}

		if (!flags.cluster) {
			this._help();
		}
	}
}

DistributeEICommand.description = `Configure WSO2 EI products (fresh-pack) for deployments
...
Configure WSO2 EI products for deployment setups based on your preference.

As of now, Hydrogen only supports configurations for 2 node clustered deployment setup
for ESB profile. Use --cluster (-C) flag with the --profile flag specifiying esb as its value.
`;

DistributeEICommand.examples = [
	`Configure EI for ESB 2 node clustered setup
$ hydrogen distribute:ei -C -v 6.5 --profile esb`,
];

DistributeEICommand.flags = {
	version: flags.string({
		char: 'v',
		description: 'product version',
		hidden: true,
		multiple: false,
		required: true,
		default: '6.5',
		options: ['6.5'],
	}),
	cluster: flags.boolean({
		char: 'C',
		description: '2 node clustered deployment',
		hidden: false,
		multiple: false,
		required: false,
		dependsOn: ['profile'],
	}),
	profile: flags.string({
		char: 'p',
		description: 'ei profile',
		hidden: false,
		multiple: false,
		required: false,
		options: ['esb', 'bp'],
	}),
};

module.exports = DistributeEICommand;
