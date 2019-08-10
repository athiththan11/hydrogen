const { expect, test } = require('@oclif/test');

describe('datasource', () => {
	test.stdout()
		.command(['datasource'])
		.exit(0)
		.it('runs datasource', ctx => {
			expect(ctx.stdout).to
				.contain('Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors');
		});
});
