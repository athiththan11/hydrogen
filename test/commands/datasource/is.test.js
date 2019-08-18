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
					{
						type: fsify.DIRECTORY,
						name: 'identity',
						contents: [
							{
								type: fsify.FILE,
								name: 'identity.xml',
								contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<Server xmlns="http://wso2.org/projects/carbon/carbon.xml">
    <JDBCPersistenceManager>
        <DataSource>
            <!-- Include a data source name (jndiConfigName) from the set of data
            sources defined in master-datasources.xml -->
            <Name>jdbc/WSO2CarbonDB</Name>
        </DataSource>
    </JDBCPersistenceManager>
</Server>
`,
							},
						],
					},
					{
						type: fsify.FILE,
						name: 'registry.xml',
						contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<wso2registry>
    <currentDBConfig>wso2registry</currentDBConfig>
    <readOnly>false</readOnly>
    <enableCache>true</enableCache>
    <registryRoot>/</registryRoot>
    <dbConfig name="wso2registry">
        <dataSource>jdbc/WSO2CarbonDB</dataSource>
    </dbConfig>
</wso2registry>
`,
					},
				],
			},
		],
	},
];

describe('datasource:is', () => {
	let message = 'starting to alter wso2is-5.7';

	fsify(structure)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'postgres'])
		.it('runs datasource:is --replace --version 5.7 --datasource postgres', ctx => {
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
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'mysql'])
		.it('runs datasource:is --replace --version 5.7 --datasource mysql', ctx => {
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
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'oracle'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle', ctx => {
			expect(ctx.stdout).to
				.contains(message + ' with oracle configurations');
		});

	// --container

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'postgres', '--container'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container', ctx => {});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'mysql', '--container'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container', ctx => {});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'oracle', '--container'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container', ctx => { });

	// -- container --generate

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'postgres', '--container', '--generate'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container --generate', ctx => {});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'mysql', '--container', '--generate'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container --generate', ctx => {});

	test.stdout()
		.command(['datasource:is', '--replace', '--version', '5.7', '--datasource', 'oracle', '--container', '--generate'])
		.it('runs datasource:is --replace --version 5.7 --datasource oracle --container --generate', ctx => {});

	test.stdout()
		.command(['datasource:is', '--version', '5.7', '--datasource', 'postgres'])
		.exit(0)
		.it('run datasource:is --version 5.7 --datasource postgres', ctx => {
			expect(ctx.stdout).to
				.contains('Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models');
		});
});
