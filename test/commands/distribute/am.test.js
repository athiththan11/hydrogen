/* eslint-disable no-console */
const { expect, test } = require('@oclif/test');
const fsify = require('fsify')({
	persistent: false,
});

const distributed = [
	{
		type: fsify.DIRECTORY,
		name: 'distributed',
		contents: [
			{
				type: fsify.DIRECTORY,
				name: '.DS_Store',
				contents: [],
			},
			{
				type: fsify.DIRECTORY,
				name: 'wso2am-2.6.0',
				contents: [
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
										type: fsify.FILE,
										name: 'api-manager.xml',
										contents: `<APIManager>
    <AuthManager>
        <ServerURL>https://localhost:services/</ServerURL>
    </AuthManager>
    <APIGateway>
        <Environments>
            <Environment type="hybrid" api-console="true">
                <Name>Production and Sandbox</Name>
                <Description>This is a hybrid gateway that handles both production and sandbox token traffic.</Description>
                <!-- Server URL of the API gateway -->
                <ServerURL>https://localhost:services/</ServerURL>
		        <!-- Admin username for the API gateway. -->
                <Username></Username>
                <!-- Admin password for the API gateway.-->
                <Password></Password>
                <!-- Endpoint URLs for the APIs hosted in this API gateway.-->
                <GatewayEndpoint>http://:,https://:</GatewayEndpoint>
                <!-- Endpoint of the Websocket APIs hosted in this API Gateway -->
                <GatewayWSEndpoint>ws://:9099</GatewayWSEndpoint>
            </Environment>
        </Environments>
    </APIGateway>
    <APIKeyValidator>
        <!-- Server URL of the API key manager -->
        <ServerURL>https://localhost:services/</ServerURL>
        <KeyValidatorClientType>ThriftClient</KeyValidatorClientType>
        <ThriftClientConnectionTimeOut>10000</ThriftClientConnectionTimeOut>
        <!--ThriftClientPort>10397</ThriftClientPort-->
        <EnableThriftServer>true</EnableThriftServer>
        <ThriftServerHost>localhost</ThriftServerHost>
        <!--ThriftServerPort>10397</ThriftServerPort-->
        <KeyValidationHandlerClassName>org.wso2.carbon.apimgt.keymgt.handlers.DefaultKeyValidationHandler</KeyValidationHandlerClassName>
    </APIKeyValidator>
    <OAuthConfigurations>
        <ApplicationTokenScope>am_application_scope</ApplicationTokenScope>
        <TokenEndPointName>/oauth2/token</TokenEndPointName>
        <RevokeAPIURL>https://localhost:/revoke</RevokeAPIURL>
        <EncryptPersistedTokens>false</EncryptPersistedTokens>
        <EnableTokenHashMode>false</EnableTokenHashMode>
    </OAuthConfigurations>
    <APIStore>
        <CompareCaseInsensitively>true</CompareCaseInsensitively>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/store</URL>
        <ServerURL>https://localhost:services/</ServerURL>
        <Username></Username>
        <Password></Password>
        <DisplayMultipleVersions>false</DisplayMultipleVersions>
        <DisplayAllAPIs>false</DisplayAllAPIs>
        <DisplayComments>true</DisplayComments>
        <DisplayRatings>true</DisplayRatings>
    </APIStore>
    <APIPublisher>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/publisher</URL>
        <EnableAccessControl>true</EnableAccessControl>
    </APIPublisher>
    <ThrottlingConfigurations>
        <EnableAdvanceThrottling>true</EnableAdvanceThrottling>
        <TrafficManager>
            <Type>Binary</Type>
            <ReceiverUrlGroup>tcp://:</ReceiverUrlGroup>
            <AuthUrlGroup>ssl://:</AuthUrlGroup>
            <Username></Username>
            <Password></Password>
        </TrafficManager>
        <DataPublisher>
            <Enabled>true</Enabled>
            <DataPublisherPool>
                <MaxIdle>1000</MaxIdle>
                <InitIdleCapacity>200</InitIdleCapacity>
            </DataPublisherPool>
            <DataPublisherThreadPool>
                <CorePoolSize>200</CorePoolSize>
                <MaxmimumPoolSize>1000</MaxmimumPoolSize>
                <KeepAliveTime>200</KeepAliveTime>
            </DataPublisherThreadPool>
        </DataPublisher>
        <PolicyDeployer>
            <Enabled>true</Enabled>
            <ServiceURL>https://localhost:services/</ServiceURL>
            <Username></Username>
            <Password></Password>
        </PolicyDeployer>
        <BlockCondition>
            <Enabled>true</Enabled>
        </BlockCondition>
        <JMSConnectionDetails>
            <Enabled>true</Enabled>
            <Destination>throttleData</Destination>
            <JMSConnectionParameters>
                <transport.jms.ConnectionFactoryJNDIName>TopicConnectionFactory</transport.jms.ConnectionFactoryJNDIName>
                <transport.jms.DestinationType>topic</transport.jms.DestinationType>
                <java.naming.factory.initial>org.wso2.andes.jndi.PropertiesFileInitialContextFactory</java.naming.factory.initial>
                <connectionfactory.TopicConnectionFactory>amqp://:@clientid/carbon?brokerlist='tcp://:'</connectionfactory.TopicConnectionFactory>
            </JMSConnectionParameters>
        </JMSConnectionDetails>
    </ThrottlingConfigurations>
</APIManager>
`,
									},
									{
										type: fsify.FILE,
										name: 'registry_TM.xml',
										contents: '<somethinghere></somethinghere>',
									},
									{
										type: fsify.FILE,
										name: 'registry.xml',
										contents: '<something></something>',
									},
									{
										type: fsify.DIRECTORY,
										name: 'axis2',
										contents: [
											{
												type: fsify.FILE,
												name: 'axis2_TM.xml',
												contents: '<something></something>',
											},
											{
												type: fsify.FILE,
												name: 'axis2.xml',
												contents: '<something></something>',
											},
										],
									},
									{
										type: fsify.FILE,
										name: 'user-mgt.xml',
										contents: `<?xml version="1.0" encoding="UTF-8"?>
<UserManager>
    <Realm>
        <Configuration>
            <Property name="dataSource">jdbc/WSO2CarbonDB</Property>
        </Configuration>
    </Realm>
</UserManager>`,
									},
									{
										type: fsify.FILE,
										name: 'carbon.xml',
										contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<Server xmlns="http://wso2.org/projects/carbon/carbon.xml">
    <Ports>
        <Offset>0</Offset>
    </Ports>
</Server>
`,
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
				],
			},
		],
	},
];

const multipleGateway = [
	{
		type: fsify.DIRECTORY,
		name: 'multiple-gateway',
		contents: [
			{
				type: fsify.DIRECTORY,
				name: '.DS_Store',
				contents: [],
			},
			{
				type: fsify.DIRECTORY,
				name: 'wso2am-2.6.0',
				contents: [
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
										type: fsify.FILE,
										name: 'api-manager.xml',
										contents: `<APIManager>
    <AuthManager>
        <ServerURL>https://localhost:services/</ServerURL>
    </AuthManager>
    <APIGateway>
        <Environments>
            <Environment type="hybrid" api-console="true">
                <Name>Production and Sandbox</Name>
                <Description>This is a hybrid gateway that handles both production and sandbox token traffic.</Description>
                <!-- Server URL of the API gateway -->
                <ServerURL>https://localhost:services/</ServerURL>
		        <!-- Admin username for the API gateway. -->
                <Username></Username>
                <!-- Admin password for the API gateway.-->
                <Password></Password>
                <!-- Endpoint URLs for the APIs hosted in this API gateway.-->
                <GatewayEndpoint>http://:,https://:</GatewayEndpoint>
                <!-- Endpoint of the Websocket APIs hosted in this API Gateway -->
                <GatewayWSEndpoint>ws://:9099</GatewayWSEndpoint>
            </Environment>
        </Environments>
    </APIGateway>
    <APIKeyValidator>
        <!-- Server URL of the API key manager -->
        <ServerURL>https://localhost:services/</ServerURL>
        <KeyValidatorClientType>ThriftClient</KeyValidatorClientType>
        <ThriftClientConnectionTimeOut>10000</ThriftClientConnectionTimeOut>
        <!--ThriftClientPort>10397</ThriftClientPort-->
        <EnableThriftServer>true</EnableThriftServer>
        <ThriftServerHost>localhost</ThriftServerHost>
        <!--ThriftServerPort>10397</ThriftServerPort-->
        <KeyValidationHandlerClassName>org.wso2.carbon.apimgt.keymgt.handlers.DefaultKeyValidationHandler</KeyValidationHandlerClassName>
    </APIKeyValidator>
    <OAuthConfigurations>
        <ApplicationTokenScope>am_application_scope</ApplicationTokenScope>
        <TokenEndPointName>/oauth2/token</TokenEndPointName>
        <RevokeAPIURL>https://localhost:/revoke</RevokeAPIURL>
        <EncryptPersistedTokens>false</EncryptPersistedTokens>
        <EnableTokenHashMode>false</EnableTokenHashMode>
    </OAuthConfigurations>
    <APIStore>
        <CompareCaseInsensitively>true</CompareCaseInsensitively>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/store</URL>
        <ServerURL>https://localhost:services/</ServerURL>
        <Username></Username>
        <Password></Password>
        <DisplayMultipleVersions>false</DisplayMultipleVersions>
        <DisplayAllAPIs>false</DisplayAllAPIs>
        <DisplayComments>true</DisplayComments>
        <DisplayRatings>true</DisplayRatings>
    </APIStore>
    <APIPublisher>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/publisher</URL>
        <EnableAccessControl>true</EnableAccessControl>
    </APIPublisher>
    <ThrottlingConfigurations>
        <EnableAdvanceThrottling>true</EnableAdvanceThrottling>
        <TrafficManager>
            <Type>Binary</Type>
            <ReceiverUrlGroup>tcp://:</ReceiverUrlGroup>
            <AuthUrlGroup>ssl://:</AuthUrlGroup>
            <Username></Username>
            <Password></Password>
        </TrafficManager>
        <DataPublisher>
            <Enabled>true</Enabled>
            <DataPublisherPool>
                <MaxIdle>1000</MaxIdle>
                <InitIdleCapacity>200</InitIdleCapacity>
            </DataPublisherPool>
            <DataPublisherThreadPool>
                <CorePoolSize>200</CorePoolSize>
                <MaxmimumPoolSize>1000</MaxmimumPoolSize>
                <KeepAliveTime>200</KeepAliveTime>
            </DataPublisherThreadPool>
        </DataPublisher>
        <PolicyDeployer>
            <Enabled>true</Enabled>
            <ServiceURL>https://localhost:services/</ServiceURL>
            <Username></Username>
            <Password></Password>
        </PolicyDeployer>
        <BlockCondition>
            <Enabled>true</Enabled>
        </BlockCondition>
        <JMSConnectionDetails>
            <Enabled>true</Enabled>
            <Destination>throttleData</Destination>
            <JMSConnectionParameters>
                <transport.jms.ConnectionFactoryJNDIName>TopicConnectionFactory</transport.jms.ConnectionFactoryJNDIName>
                <transport.jms.DestinationType>topic</transport.jms.DestinationType>
                <java.naming.factory.initial>org.wso2.andes.jndi.PropertiesFileInitialContextFactory</java.naming.factory.initial>
                <connectionfactory.TopicConnectionFactory>amqp://:@clientid/carbon?brokerlist='tcp://:'</connectionfactory.TopicConnectionFactory>
            </JMSConnectionParameters>
        </JMSConnectionDetails>
    </ThrottlingConfigurations>
</APIManager>
`,
									},
									{
										type: fsify.FILE,
										name: 'registry_TM.xml',
										contents: '<somethinghere></somethinghere>',
									},
									{
										type: fsify.FILE,
										name: 'registry.xml',
										contents: '<something></something>',
									},
									{
										type: fsify.DIRECTORY,
										name: 'axis2',
										contents: [
											{
												type: fsify.FILE,
												name: 'axis2_TM.xml',
												contents: '<something></something>',
											},
											{
												type: fsify.FILE,
												name: 'axis2.xml',
												contents: '<something></something>',
											},
										],
									},
									{
										type: fsify.FILE,
										name: 'user-mgt.xml',
										contents: `<?xml version="1.0" encoding="UTF-8"?>
<UserManager>
    <Realm>
        <Configuration>
            <Property name="dataSource">jdbc/WSO2CarbonDB</Property>
        </Configuration>
    </Realm>
</UserManager>`,
									},
									{
										type: fsify.FILE,
										name: 'carbon.xml',
										contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<Server xmlns="http://wso2.org/projects/carbon/carbon.xml">
    <Ports>
        <Offset>0</Offset>
    </Ports>
</Server>
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

const isKM = [
	{
		type: fsify.DIRECTORY,
		name: 'is-km',
		contents: [
			{
				type: fsify.DIRECTORY,
				name: '.DS_Store',
				contents: [],
			},
			{
				type: fsify.DIRECTORY,
				name: 'wso2am-2.6.0',
				contents: [
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
										type: fsify.FILE,
										name: 'api-manager.xml',
										contents: `<APIManager>
    <AuthManager>
        <ServerURL>https://localhost:services/</ServerURL>
    </AuthManager>
    <APIGateway>
        <Environments>
            <Environment type="hybrid" api-console="true">
                <Name>Production and Sandbox</Name>
                <Description>This is a hybrid gateway that handles both production and sandbox token traffic.</Description>
                <!-- Server URL of the API gateway -->
                <ServerURL>https://localhost:services/</ServerURL>
		        <!-- Admin username for the API gateway. -->
                <Username></Username>
                <!-- Admin password for the API gateway.-->
                <Password></Password>
                <!-- Endpoint URLs for the APIs hosted in this API gateway.-->
                <GatewayEndpoint>http://:,https://:</GatewayEndpoint>
                <!-- Endpoint of the Websocket APIs hosted in this API Gateway -->
                <GatewayWSEndpoint>ws://:9099</GatewayWSEndpoint>
            </Environment>
        </Environments>
    </APIGateway>
    <APIKeyValidator>
        <!-- Server URL of the API key manager -->
        <ServerURL>https://localhost:services/</ServerURL>
        <KeyValidatorClientType>ThriftClient</KeyValidatorClientType>
        <ThriftClientConnectionTimeOut>10000</ThriftClientConnectionTimeOut>
        <!--ThriftClientPort>10397</ThriftClientPort-->
        <EnableThriftServer>true</EnableThriftServer>
        <ThriftServerHost>localhost</ThriftServerHost>
        <!--ThriftServerPort>10397</ThriftServerPort-->
        <KeyValidationHandlerClassName>org.wso2.carbon.apimgt.keymgt.handlers.DefaultKeyValidationHandler</KeyValidationHandlerClassName>
    </APIKeyValidator>
    <OAuthConfigurations>
        <ApplicationTokenScope>am_application_scope</ApplicationTokenScope>
        <TokenEndPointName>/oauth2/token</TokenEndPointName>
        <RevokeAPIURL>https://localhost:/revoke</RevokeAPIURL>
        <EncryptPersistedTokens>false</EncryptPersistedTokens>
        <EnableTokenHashMode>false</EnableTokenHashMode>
    </OAuthConfigurations>
    <APIStore>
        <CompareCaseInsensitively>true</CompareCaseInsensitively>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/store</URL>
        <ServerURL>https://localhost:services/</ServerURL>
        <Username></Username>
        <Password></Password>
        <DisplayMultipleVersions>false</DisplayMultipleVersions>
        <DisplayAllAPIs>false</DisplayAllAPIs>
        <DisplayComments>true</DisplayComments>
        <DisplayRatings>true</DisplayRatings>
    </APIStore>
    <APIPublisher>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/publisher</URL>
        <EnableAccessControl>true</EnableAccessControl>
    </APIPublisher>
    <ThrottlingConfigurations>
        <EnableAdvanceThrottling>true</EnableAdvanceThrottling>
        <TrafficManager>
            <Type>Binary</Type>
            <ReceiverUrlGroup>tcp://:</ReceiverUrlGroup>
            <AuthUrlGroup>ssl://:</AuthUrlGroup>
            <Username></Username>
            <Password></Password>
        </TrafficManager>
        <DataPublisher>
            <Enabled>true</Enabled>
            <DataPublisherPool>
                <MaxIdle>1000</MaxIdle>
                <InitIdleCapacity>200</InitIdleCapacity>
            </DataPublisherPool>
            <DataPublisherThreadPool>
                <CorePoolSize>200</CorePoolSize>
                <MaxmimumPoolSize>1000</MaxmimumPoolSize>
                <KeepAliveTime>200</KeepAliveTime>
            </DataPublisherThreadPool>
        </DataPublisher>
        <PolicyDeployer>
            <Enabled>true</Enabled>
            <ServiceURL>https://localhost:services/</ServiceURL>
            <Username></Username>
            <Password></Password>
        </PolicyDeployer>
        <BlockCondition>
            <Enabled>true</Enabled>
        </BlockCondition>
        <JMSConnectionDetails>
            <Enabled>true</Enabled>
            <Destination>throttleData</Destination>
            <JMSConnectionParameters>
                <transport.jms.ConnectionFactoryJNDIName>TopicConnectionFactory</transport.jms.ConnectionFactoryJNDIName>
                <transport.jms.DestinationType>topic</transport.jms.DestinationType>
                <java.naming.factory.initial>org.wso2.andes.jndi.PropertiesFileInitialContextFactory</java.naming.factory.initial>
                <connectionfactory.TopicConnectionFactory>amqp://:@clientid/carbon?brokerlist='tcp://:'</connectionfactory.TopicConnectionFactory>
            </JMSConnectionParameters>
        </JMSConnectionDetails>
    </ThrottlingConfigurations>
</APIManager>
`,
									},
									{
										type: fsify.FILE,
										name: 'user-mgt.xml',
										contents: `<?xml version="1.0" encoding="UTF-8"?>
<UserManager>
    <Realm>
        <Configuration>
            <Property name="dataSource">jdbc/WSO2CarbonDB</Property>
        </Configuration>
    </Realm>
</UserManager>`,
									},
								],
							},
						],
					},
				],
			},
			{
				type: fsify.DIRECTORY,
				name: 'wso2is-km-5.7.0',
				contents: [
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
										type: fsify.FILE,
										name: 'api-manager.xml',
										contents: `<APIManager>
    <AuthManager>
        <ServerURL>https://localhost:services/</ServerURL>
    </AuthManager>
    <APIGateway>
        <Environments>
            <Environment type="hybrid" api-console="true">
                <Name>Production and Sandbox</Name>
                <Description>This is a hybrid gateway that handles both production and sandbox token traffic.</Description>
                <!-- Server URL of the API gateway -->
                <ServerURL>https://localhost:services/</ServerURL>
		        <!-- Admin username for the API gateway. -->
                <Username></Username>
                <!-- Admin password for the API gateway.-->
                <Password></Password>
                <!-- Endpoint URLs for the APIs hosted in this API gateway.-->
                <GatewayEndpoint>http://:,https://:</GatewayEndpoint>
                <!-- Endpoint of the Websocket APIs hosted in this API Gateway -->
                <GatewayWSEndpoint>ws://:9099</GatewayWSEndpoint>
            </Environment>
        </Environments>
    </APIGateway>
    <APIKeyValidator>
        <!-- Server URL of the API key manager -->
        <ServerURL>https://localhost:services/</ServerURL>
        <KeyValidatorClientType>ThriftClient</KeyValidatorClientType>
        <ThriftClientConnectionTimeOut>10000</ThriftClientConnectionTimeOut>
        <!--ThriftClientPort>10397</ThriftClientPort-->
        <EnableThriftServer>true</EnableThriftServer>
        <ThriftServerHost>localhost</ThriftServerHost>
        <!--ThriftServerPort>10397</ThriftServerPort-->
        <KeyValidationHandlerClassName>org.wso2.carbon.apimgt.keymgt.handlers.DefaultKeyValidationHandler</KeyValidationHandlerClassName>
    </APIKeyValidator>
    <OAuthConfigurations>
        <ApplicationTokenScope>am_application_scope</ApplicationTokenScope>
        <TokenEndPointName>/oauth2/token</TokenEndPointName>
        <RevokeAPIURL>https://localhost:/revoke</RevokeAPIURL>
        <EncryptPersistedTokens>false</EncryptPersistedTokens>
        <EnableTokenHashMode>false</EnableTokenHashMode>
    </OAuthConfigurations>
    <APIStore>
        <CompareCaseInsensitively>true</CompareCaseInsensitively>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/store</URL>
        <ServerURL>https://localhost:services/</ServerURL>
        <Username></Username>
        <Password></Password>
        <DisplayMultipleVersions>false</DisplayMultipleVersions>
        <DisplayAllAPIs>false</DisplayAllAPIs>
        <DisplayComments>true</DisplayComments>
        <DisplayRatings>true</DisplayRatings>
    </APIStore>
    <APIPublisher>
        <DisplayURL>false</DisplayURL>
        <URL>https://localhost:/publisher</URL>
        <EnableAccessControl>true</EnableAccessControl>
    </APIPublisher>
    <ThrottlingConfigurations>
        <EnableAdvanceThrottling>true</EnableAdvanceThrottling>
        <TrafficManager>
            <Type>Binary</Type>
            <ReceiverUrlGroup>tcp://:</ReceiverUrlGroup>
            <AuthUrlGroup>ssl://:</AuthUrlGroup>
            <Username></Username>
            <Password></Password>
        </TrafficManager>
        <DataPublisher>
            <Enabled>true</Enabled>
            <DataPublisherPool>
                <MaxIdle>1000</MaxIdle>
                <InitIdleCapacity>200</InitIdleCapacity>
            </DataPublisherPool>
            <DataPublisherThreadPool>
                <CorePoolSize>200</CorePoolSize>
                <MaxmimumPoolSize>1000</MaxmimumPoolSize>
                <KeepAliveTime>200</KeepAliveTime>
            </DataPublisherThreadPool>
        </DataPublisher>
        <PolicyDeployer>
            <Enabled>true</Enabled>
            <ServiceURL>https://localhost:services/</ServiceURL>
            <Username></Username>
            <Password></Password>
        </PolicyDeployer>
        <BlockCondition>
            <Enabled>true</Enabled>
        </BlockCondition>
        <JMSConnectionDetails>
            <Enabled>true</Enabled>
            <Destination>throttleData</Destination>
            <JMSConnectionParameters>
                <transport.jms.ConnectionFactoryJNDIName>TopicConnectionFactory</transport.jms.ConnectionFactoryJNDIName>
                <transport.jms.DestinationType>topic</transport.jms.DestinationType>
                <java.naming.factory.initial>org.wso2.andes.jndi.PropertiesFileInitialContextFactory</java.naming.factory.initial>
                <connectionfactory.TopicConnectionFactory>amqp://:@clientid/carbon?brokerlist='tcp://:'</connectionfactory.TopicConnectionFactory>
            </JMSConnectionParameters>
        </JMSConnectionDetails>
    </ThrottlingConfigurations>
</APIManager>
`,
									},
									{
										type: fsify.FILE,
										name: 'user-mgt.xml',
										contents: `<?xml version="1.0" encoding="UTF-8"?>
<UserManager>
    <Realm>
        <Configuration>
            <Property name="dataSource">jdbc/WSO2CarbonDB</Property>
        </Configuration>
    </Realm>
</UserManager>`,
									},
									{
										type: fsify.FILE,
										name: 'carbon.xml',
										contents: `<?xml version="1.0" encoding="ISO-8859-1"?>
<Server xmlns="http://wso2.org/projects/carbon/carbon.xml">
    <Ports>
        <Offset>0</Offset>
    </Ports>
</Server>
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

describe('distribute:am', () => {
	fsify(multipleGateway)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['distribute:am', '--multiple-gateway', '--version', '2.6'])
		.it('runs distribute:am --multiple-gateway --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure apim-2.6 for multiple gateway setup');
		});

	fsify(distributed)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['distribute:am', '--distributed', '--version', '2.6'])
		.it('runs distribute:am --distributed --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure apim-2.6 for distributed setup');
		});

	fsify(isKM)
		.then(structure => {
			console.log(structure);
		}).catch(error => {
			console.error(error);
		});

	test.stdout()
		.command(['distribute:am', '--is-km', '--version', '2.6'])
		.it('runs distribute:am --distributed --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contain('starting to configure apim-2.6 with IS as Keymanager');
		});

	test.stdout()
		.command(['distribute:am', '--version', '2.6'])
		.exit(0)
		.it('run distribute:am --version 2.6', ctx => {
			expect(ctx.stdout).to
				.contains('Configure WSO2 APIM products (fresh-pack) for distributed deployments');
		});
});
