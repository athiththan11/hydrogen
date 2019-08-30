/* eslint-disable no-console */
const { expect, test } = require('@oclif/test');
const fsify = require('fsify')({
	persistent: false,
});

const esb = [
	{
		type: fsify.DIRECTORY,
		name: 'clustered',
		contents: [
			{
				type: fsify.DIRECTORY,
				name: '.DS_Store',
				contents: [],
			},
			{
				type: fsify.DIRECTORY,
				name: 'wso2ei-6.5.0',
				contents: [
					{
						type: fsify.DIRECTORY,
						name: 'conf',
						contents: [
							{
								type: fsify.DIRECTORY,
								name: 'axis2',
								contents: [
									{
										type: fsify.FILE,
										name: 'axis2.xml',
										contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<transportReceiver name="http" class="org.apache.synapse.transport.passthru.PassThroughHttpListener">
</transportReceiver>
<transportReceiver name="https" class="org.apache.synapse.transport.passthru.PassThroughHttpSSLListener">
</transportReceiver>

<clustering class="org.wso2.carbon.core.clustering.hazelcast.HazelcastClusteringAgent" enable="false">
<parameter name="domain">wso2.carbon.domain</parameter>
<parameter name="localMemberPort">4100</parameter>
<members>
	<member>
		<hostName>127.0.0.1</hostName>
		<port>4000</port>
	</member>
</members>
</clustering>`,
									},
								],
							},
							{
								type: fsify.FILE,
								name: 'carbon.xml',
								contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<Server xmlns="http://wso2.org/projects/carbon/carbon.xml">
	<Version>6.5.0</Version>
    <Ports>
        <Offset>0</Offset>
    </Ports>
</Server>
`,
							},
							{
								type: fsify.DIRECTORY,
								name: 'tomcat',
								contents: [
									{
										type: fsify.FILE,
										name: 'catalina-server.xml',
										contents: `<?xml version="1.0" encoding="UTF-8"?>
<Service className="org.wso2.carbon.tomcat.ext.service.ExtendedStandardService" name="Catalina">
	<Connector 	protocol="org.apache.coyote.http11.Http11NioProtocol"
				port="9763"
				redirectPort="9443"
				bindOnInit="false"
				maxHttpHeaderSize="8192"
				acceptorThreadCount="2"
				maxThreads="250"
				minSpareThreads="50"
				disableUploadTimeout="false"
				connectionUploadTimeout="120000"
				maxKeepAliveRequests="200"
				acceptCount="200"
				server="WSO2 Carbon Server"
				compression="on"
				compressionMinSize="2048"
				noCompressionUserAgents="gozilla, traviata"
				compressableMimeType="text/html,text/javascript,application/x-javascript,application/javascript,application/xml,text/css,application/xslt+xml,text/xsl,image/gif,image/jpg,image/jpeg"
				URIEncoding="UTF-8"/>

	<Connector 	protocol="org.apache.coyote.http11.Http11NioProtocol"
				port="9443"
				bindOnInit="false"
				sslEnabledProtocols="TLSv1,TLSv1.1,TLSv1.2"
				maxHttpHeaderSize="8192"
				acceptorThreadCount="2"
				maxThreads="250"
				minSpareThreads="50"
				disableUploadTimeout="false"
				enableLookups="false"
				connectionUploadTimeout="120000"
				maxKeepAliveRequests="200"
				acceptCount="200"
				server="WSO2 Carbon Server"
				clientAuth="false"
				compression="on"
				scheme="https"
				secure="true"
				SSLEnabled="true"
				keystoreFile="/repository/resources/security/wso2carbon.jks"
				keystorePass="wso2carbon"
				compressionMinSize="2048"
				noCompressionUserAgents="gozilla, traviata"
				compressableMimeType="text/html,text/javascript,application/x-javascript,application/javascript,application/xml,text/css,application/xslt+xml,text/xsl,image/gif,image/jpg,image/jpeg"
				URIEncoding="UTF-8"/>
`,
									},
								],
							},
						],
					},
				],
			},
		],
	},
];

describe('distribute:ei', () => {
	fsify(esb)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['distribute:ei', '--cluster', '--profile', 'esb'])
		.it('runs distribute:ei --cluster --profile esb', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure ei-6.5 (esb profile) for 2 node clustered deployment');
		});

	test.stdout()
		.command(['distribute:ei'])
		.exit(0)
		.it('run distribute:ei', ctx => {
			expect(ctx.stdout).to
				.contains('Configure WSO2 EI products (fresh-pack) for deployments');
		});
});
