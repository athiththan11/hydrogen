const { expect, test } = require('@oclif/test');

describe('datasource:is', () => {
	let message = 'starting to alter wso2is-5.7';

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'postgres'])
		.it('runs datasource:is --replace --version 5.7 --datasource postgres', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with postgres configurations');
		});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'mysql'])
		.it('runs datasource:is --replace --version 5.7 --datasource mysql', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with mysql configurations');
		});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'oracle'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with oracle configurations');
		});
});
