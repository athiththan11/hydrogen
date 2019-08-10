const { expect, test } = require('@oclif/test');

describe('distribute', () => {
	test.stdout()
		.command(['distribute'])
		.exit(0)
		.it('runs distribute', ctx => {
			expect(ctx.stdout).to
				.contain('Configure WSO2 products for distributed deployments');
		});
});
