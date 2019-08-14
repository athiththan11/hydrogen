/* eslint-disable no-console */
const { expect, test } = require('@oclif/test');
const fsify = require('fsify')({
	persistent: false,
});

const structure = [
	{
		type: fsify.DIRECTORY,
		name: 'repository',
		contents: [
			{
				type: fsify.DIRECTORY,
				name: 'conf',
				contents: [
					{
						type: fsify.DIRECTORY,
						name: 'datasources',
						contents: [
							{
								type: fsify.FILE,
								name: 'master-datasources.xml',
								contents: `<datasources-configuration xmlns:svns="http://org.wso2.securevault/configuration">
    <datasources>
        <datasource>
            <name>WSO2AM_DB</name>
            <description>The datasource used for API Manager database</description>
            <jndiConfig>
                <name>jdbc/WSO2AM_DB</name>
            </jndiConfig>
            <definition type="RDBMS">
                <configuration>
                    <url>jdbc:h2:repository/database/WSO2AM_DB;DB_CLOSE_ON_EXIT=FALSE</url>
                    <username>wso2carbon</username>
                    <password>wso2carbon</password>
                    <defaultAutoCommit>true</defaultAutoCommit>
                    <driverClassName>org.h2.Driver</driverClassName>
                    <maxActive>50</maxActive>
                    <maxWait>60000</maxWait>
                    <testOnBorrow>true</testOnBorrow>
                    <validationQuery>SELECT 1</validationQuery>
                    <validationInterval>30000</validationInterval>
                </configuration>
            </definition>
        </datasource>
    </datasources>
</datasources-configuration>
`,
							},
						],
					},
				],
			},
		],
	},
];

describe('datasource:am', () => {
	let message = 'starting to alter wso2am-2.6';

	fsify(structure)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['datasource:am', '--replace', '--version', '2.6', '--datasource', 'postgres'])
		.it('runs datasource:am --replace --version 2.6 --datasource postgres', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with postgres configurations');
		});

	fsify(structure)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['datasource:am', '--replace', '--version', '2.6', '--datasource', 'mysql'])
		.it('runs datasource:am --replace --version 2.6 --datasource mysql', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with mysql configurations');
		});

	fsify(structure)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['datasource:am', '--replace', '--version', '2.6', '--datasource', 'oracle'])
		.it('runs datasource:am --replace --version 2.6 --datasource oracle', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with oracle configurations');
		});

	test.stdout()
		.command(['datasource:am', '--version', '2.6', '--datasource', 'postgres'])
		.exit(0)
		.it('run datasource:am --version 2.6 --datasource postgres', ctx => {
			expect(ctx.stdout).to
				.contains('Alter datasources of WSO2 APIM products (fresh-pack) with supported datasource models');
		});
});
