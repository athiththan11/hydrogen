const { expect, test } = require('@oclif/test');

describe('distribute:am', () => {
	test.stdout()
		.command(['distribute:am', '--multiple-gateway', '--version', '2.6'])
		.it('runs distribute:am --multiple-gateway --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure apim-2.6 for multiple gateway setup');
		});

	test.stdout()
		.command(['distribute:am', '--distributed', '--version', '2.6'])
		.it('runs distribute:am --distributed --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure apim-2.6 for distributed setup');
		});
});
