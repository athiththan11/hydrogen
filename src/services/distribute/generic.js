const fs = require('fs-extra');
const libxmljs = require('libxmljs');
const path = require('path');
const prettify = require('prettify-xml');
const Table = require('cli-table');

const { exec } = require('shelljs');
const { cli } = require('cli-ux');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let pApiManager = '/repository/conf/api-manager.xml';
let pAxis2 = '/repository/conf/axis2/axis2.xml';
let pAxis2TM = '/repository/conf/axis2/axis2_TM.xml';
let pCarbon = '/repository/conf/carbon.xml';
let pIdentity = '/repository/conf/identity/identity.xml';
let pMasterDatasource = '/repository/conf/datasources/master-datasources.xml';
let pRegistry = '/repository/conf/registry.xml';
let pRegistryTM = '/repository/conf/registry_TM.xml';
let pUserMgt = '/repository/conf/user-mgt.xml';

let _c = {
	'multiple-gateway': [
		'allinone',
		'gatewayone',
		'gatewaytwo',
	],
	distributed: [
		'gateway',
		'keymanager',
		'publisher',
		'store',
		'trafficmanager',
	],
	'is-km': [
		'allinone',
		'iskm',
	],
};

let _comment = 'HYDROGENERATED:';
let _distributed = 'distributed';
let _n = '\n\n';
let _p = process.cwd();
let _t = '\t\t';
let _utf8 = 'utf8';

let _gateway = 0;
let _keymanager = 1;
let _publisher = 2;
let _store = 3;
let _trafficmanager = 4;

let _p5672 = 5672;
let _p8243 = 8243;
let _p8280 = 8280;
let _p9443 = 9443;
let _p9611 = 9611;
let _p9711 = 9711;

exports.configure = async function (ocli, args) {
	cli.log('\n');

	// #region test environments
	if (process.env.NODE_ENV === 'mocha' && args.distributed)
		_p = path.join(process.cwd(), process.env.MOCHA_DISTRIBUTED);
	if (process.env.NODE_ENV === 'mocha' && args['is-km'])
		_p = path.join(process.cwd(), process.env.MOCHA_ISKM);
	if (process.env.NODE_ENV === 'mocha' && args['multiple-gateway'])
		_p = path.join(process.cwd(), process.env.MOCHA_MULTIPLE_GATEWAY);
	// #endregion

	if (args.distributed)
		await configureDistributedDeployment(ocli);
	if (args['is-km'])
		await configureISasKM(ocli);
	if (args['multiple-gateway'])
		await configureMultipleGateway(ocli);
};

// #region publish multiple gateway configurations

async function configureMultipleGateway(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	let sync = fs.readdirSync(_p);
	if (sync.length === 1 && sync[0].startsWith('wso2')) {
		let pDistributed = path.join(_p, _distributed);

		// create distributed folder
		fs.mkdirSync(pDistributed);

		let source = path.join(_p, sync[0]);
		let _count = 0;

		traverseMultipleGateway(ocli, sync[0], source, pDistributed, _count);
	}
}

// eslint-disable-next-line max-params
function traverseMultipleGateway(ocli, pack, source, p, count) {
	if (count < _c['multiple-gateway'].length) {
		let nodeName = _c['multiple-gateway'].sort()[count];
		cli.action.start(`configuring ${pack} as ${nodeName}`);
		fs.copy(source, path.join(p, nodeName)).then(() => {
			if (nodeName.startsWith('gateway')) {
				configureMGW(path.join(p, nodeName), count);
			} else {
				configureMGWAIO(path.join(p, nodeName));
			}
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			traverseMultipleGateway(ocli, pack, source, p, ++count);
		});
	} else {
		buildMGWDoc(ocli);
	}
}

// multiple-gateway all-in-one
async function configureMGWAIO(p) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		// environment node creation
		let envProdNode = buildEnvironment(
			doc,
			'production',
			'Production Gateway',
			'Production Gateway Environment',
			1
		);
		let envHybNode = buildEnvironment(
			doc,
			'hybrid',
			'Production and Sandbox',
			'Hybrid Gateway Environment',
			2
		);

		let defaultElement = apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]')
			.remove();

		let alteredDefault = defaultElement.toString().split('\n');
		let altered = '';
		alteredDefault.forEach(a => {
			if (a.includes('<!--')) {
				altered += a + '\n';
			} else {
				altered += '<!-- ' + a.trim() + ' -->\n';
			}
		});

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]')
			.addChild(envProdNode).addChild(envHybNode);

		let _altered = removeDeclaration(apim.toString());
		let envsElement = _altered.substring(_altered.indexOf('<Environments>'), _altered.indexOf('</Environments>'));

		envsElement = envsElement.substring(0, envsElement.indexOf('<Environment ')) +
			altered +
			`${_n}${_t}<!-- ${_comment} environments added -->\n${_t}` +
			envsElement.substring(envsElement.indexOf('<Environment '), envsElement.lastIndexOf('<Environment ')) +
			'\n\n' +
			envsElement.substring(envsElement.lastIndexOf('<Environment '), envsElement.length);

		_altered = _altered.substring(0, _altered.indexOf('<Environments>')) +
			envsElement +
			_n +
			_altered.substring(_altered.indexOf('</Environments>'), _altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// eslint-disable-next-line max-params
function buildEnvironment(doc, type, name, description, c) {
	let environment = new libxmljs.Element(doc, 'Environment').attr({ type: type, 'api-console': 'true' });
	environment
		.node('Name', name)
		.parent()
		.node('Description', description)
		.parent()
		.node('ServerURL', `https://localhost:${_p9443 + c}/services/`)
		.parent()
		.node('Username', 'admin')
		.parent()
		.node('Password', 'admin')
		.parent()
		.node('GatewayEndpoint', `http://localhost:${_p8280 + c},https://localhost:${_p8243 + c}`);
	return environment;
}

// multiple-gateway gateway
async function configureMGW(p, count) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		// ServerURL node creation
		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443}/services/`);

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		// ThriftClientPort node creation
		let thriftClientPortElement = new libxmljs.Element(doc, 'ThriftClientPort', '10397');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="ThriftClientConnectionTimeOut"]')
			.addNextSibling(thriftClientPortElement);

		// EnableThriftServer node creation
		let enableThriftServerElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftServerElement);

		// RevokeAPIURL element
		let revokeApiElement = new libxmljs.Element(doc, 'RevokeAPIURL', `https://localhost:${_p8243}/revoke`);

		apim.root()
			.get('//*[local-name()="OAuthConfigurations"]/*[local-name()="RevokeAPIURL"]')
			.addNextSibling(revokeApiElement);

		let altered = removeDeclaration(apim.toString());
		let authManager = altered.substring(altered.indexOf('<AuthManager>'), altered.indexOf('</AuthManager>'));
		let apiKeyValidator = altered.substring(altered.lastIndexOf('<APIKeyValidator>'), altered.lastIndexOf('</APIKeyValidator>'));

		let firstAlter = alterElement(authManager, 'ServerURL', 'server url changed ');
		let secondAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url has been changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<ThriftClientPort>')) +
			`${_n}` +
			`${_t}<!-- ${_comment} thrift client port has been set -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ThriftClientPort>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} thrift server has been disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.lastIndexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.lastIndexOf('</APIKeyValidator>'), altered.indexOf('<RevokeAPIURL>')) +
			commentElement(altered.substring(altered.indexOf('<RevokeAPIURL>'), altered.lastIndexOf('<RevokeAPIURL>'))) +
			`${_t}<!-- ${_comment} revoke api changed -->\n${_t}` +
			altered.substring(altered.lastIndexOf('<RevokeAPIURL>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), _altered, _utf8);
	}).then(() => {
		configurePortOffset(p, count);
	});
}

// build docs and additional notes
function buildMGWDoc(ocli) {
	const table = new Table({
		style: {
			head: ['reset'],
		},
		head: [
			'node',
			'port-offset',
			'port',
		],
		chars: {
			mid: '',
			'left-mid': '',
			'mid-mid': '',
			'right-mid': '',
		},
	});

	table.push(
		['', '', ''],
		['allinone', '0', '9443'],
		['gatewayone', '1', '9444'],
		['gatewaytwo', '2', '9445'],
	);

	ocli.log('\n' + table.toString());
}

// #endregion

// #region 5 nodes distributed deployment

async function configureDistributedDeployment(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	let sync = fs.readdirSync(_p);
	if (sync.length === 1 && sync[0].startsWith('wso2')) {
		let pDistributed = path.join(_p, _distributed);

		// create distributed folder
		fs.mkdirSync(pDistributed);

		let source = path.join(_p, sync[0]);
		let _count = 0;

		traverseDistributedDeployment(ocli, sync[0], source, pDistributed, _count);
	}
}

// eslint-disable-next-line max-params
function traverseDistributedDeployment(ocli, pack, source, p, count) {
	if (count < _c.distributed.length) {
		var name = _c.distributed.sort()[count];
		cli.action.start(`configuring ${pack} as ${name}`);
		fs.copy(source, path.join(p, name)).then(() => {
			if (name === 'gateway') {
				configureDGWay(path.join(p, name), count);
			}
			if (name === 'keymanager') {
				configureDKManager(path.join(p, name), count);
			}
			if (name === 'publisher') {
				configureDPub(path.join(p, name), count);
			}
			if (name === 'store') {
				configureDStore(path.join(p, name), count);
			}
			if (name === 'trafficmanager') {
				configureDTManager(path.join(p, name), count);
			}
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			traverseDistributedDeployment(ocli, pack, source, p, ++count);
		});
	} else {
		buildDDDoc(ocli);
	}
}

// configure gateway node in distributed
async function configureDGWay(p, count) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _keymanager}/services/`);

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let keyValCElement = new libxmljs.Element(doc, 'KeyValidatorClientType', 'WSClient');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="KeyValidatorClientType"]')
			.addNextSibling(keyValCElement);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let tManagerElement = new libxmljs.Element(doc, 'ReceiverUrlGroup', `tcp://localhost:${_p9611 + _trafficmanager}`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="ReceiverUrlGroup"]')
			.addNextSibling(tManagerElement);

		tManagerElement = new libxmljs.Element(doc, 'AuthUrlGroup', `ssl://localhost:${_p9711 + _trafficmanager}`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="AuthUrlGroup"]')
			.addNextSibling(tManagerElement);

		let policyDepElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="Enabled"]')
			.addNextSibling(policyDepElement);

		policyDepElement = new libxmljs.Element(doc, 'ServiceURL', `https://localhost:${_p9443 + _trafficmanager}/services/`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="ServiceURL"]')
			.addNextSibling(policyDepElement);

		let jmsCElement = new libxmljs.Element(doc, 'ServiceURL', `tcp://localhost:${_p5672 + _trafficmanager}`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="JMSConnectionDetails"]/*[local-name()="Destination"]')
			.addNextSibling(jmsCElement);

		// eslint-disable-next-line no-template-curly-in-string
		jmsCElement = new libxmljs.Element(doc, 'connectionfactory.TopicConnectionFactory', 'amqp://${admin.username}:${admin.password}@clientid/carbon?brokerlist=\'tcp://localhost:${jms.port}?retries=\'5\'%26connectdelay=\'50\'\'');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="JMSConnectionDetails"]/*[local-name()="JMSConnectionParameters"]/*[local-name()="connectionfactory.TopicConnectionFactory"]')
			.addNextSibling(jmsCElement);

		let altered = removeDeclaration(apim.toString());

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let firstAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<KeyValidatorClientType>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<KeyValidatorClientType>'), apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'))) +
			`${_t}<!-- ${_comment} client type changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} thrift server disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));
		let trafficmanager = tConf.substring(tConf.indexOf('<TrafficManager>'), tConf.indexOf('</TrafficManager>'));
		let sfirstAlter = trafficmanager.substring(0, trafficmanager.indexOf('<ReceiverUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<ReceiverUrlGroup>'), trafficmanager.lastIndexOf('<ReceiverUrlGroup>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<ReceiverUrlGroup>'), trafficmanager.indexOf('<AuthUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<AuthUrlGroup>'), trafficmanager.lastIndexOf('<AuthUrlGroup>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<AuthUrlGroup>'), trafficmanager.length);

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let ssecondAlter = policyDeployer.substring(0, policyDeployer.indexOf('<Enabled>')) +
			commentElement(policyDeployer.substring(policyDeployer.indexOf('<Enabled>'), policyDeployer.lastIndexOf('<Enabled>'))) +
			`${_t}<!-- ${_comment} disabled -->\n${_t}` +
			policyDeployer.substring(policyDeployer.lastIndexOf('<Enabled>'), policyDeployer.indexOf('<ServiceURL>')) +
			commentElement(policyDeployer.substring(policyDeployer.indexOf('<ServiceURL>'), policyDeployer.lastIndexOf('<ServiceURL>'))) +
			`${_t}<!-- ${_comment} service url changed -->\n${_t}` +
			policyDeployer.substring(policyDeployer.lastIndexOf('<ServiceURL>'), policyDeployer.length);

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sthirdAlter = jmsConnectionDetails.substring(0, jmsConnectionDetails.indexOf('<ServiceURL>')) + _n +
			`${_t}<!-- ${_comment} service url changed -->\n${_t}` +
			jmsConnectionDetails.substring(jmsConnectionDetails.indexOf('<ServiceURL>'), jmsConnectionDetails.indexOf('<connectionfactory.TopicConnectionFactory>')) +
			commentElement(jmsConnectionDetails.substring(jmsConnectionDetails.indexOf('<connectionfactory.TopicConnectionFactory>'), jmsConnectionDetails.lastIndexOf('<connectionfactory.TopicConnectionFactory>'))) +
			`${_t}<!-- ${_comment} changed -->\n${_t}` +
			jmsConnectionDetails.substring(jmsConnectionDetails.lastIndexOf('<connectionfactory.TopicConnectionFactory>'), jmsConnectionDetails.length);

		let secondAlter = tConf.substring(0, tConf.indexOf('<TrafficManager>')) +
			sfirstAlter +
			tConf.substring(tConf.indexOf('</TrafficManager>'), tConf.indexOf('<PolicyDeployer>')) +
			ssecondAlter +
			tConf.substring(tConf.indexOf('</PolicyDeployer>'), tConf.indexOf('<JMSConnectionDetails>')) +
			sthirdAlter +
			tConf.substring(tConf.indexOf('</JMSConnectionDetails>'), tConf.length);

		let _altered = altered.substring(0, altered.indexOf('<APIKeyValidator>')) +
			firstAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.indexOf('<ThrottlingConfigurations>')) +
			secondAlter +
			altered.substring(altered.indexOf('</ThrottlingConfigurations>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, count);
	});
}

// configure key manager node in distributed
async function configureDKManager(p, count) {
	let args = {
		_connectionUrl: 'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for the API Manager database',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2AM_DB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2AM_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _gateway}/services/`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let keyValCElement = new libxmljs.Element(doc, 'KeyValidatorClientType', 'WSClient');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="KeyValidatorClientType"]')
			.addNextSibling(keyValCElement);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let dataPubElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		let altered = removeDeclaration(apim.toString());

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let firstAlter = alterElement(environments, 'ServerURL', 'server url changed ');

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let secondAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<KeyValidatorClientType>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<KeyValidatorClientType>'), apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'))) +
			`${_t}<!-- ${_comment} client type changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} thrift server disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));
		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let sfirstAlter = alterElement(policyDeployer, 'Enabled', 'disabled ');
		let thirdAlter = tConf.substring(0, tConf.indexOf('<PolicyDeployer>')) +
			sfirstAlter +
			tConf.substring(tConf.indexOf('</PolicyDeployer>'), tConf.length);

		let _altered = altered.substring(0, altered.indexOf('<Environments>')) +
			firstAlter +
			altered.substring(altered.indexOf('</Environments>'), altered.indexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.indexOf('<ThrottlingConfigurations>')) +
			thirdAlter +
			altered.substring(altered.indexOf('</ThrottlingConfigurations>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, count);
	}).then(() => {
		alterMDatasourceAM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';

		alterMDatasourceUM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/regdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';

		alterMDatasourceREG(p, args);
	}).then(() => {
		alterUserMgt(p);
	}).then(() => {
		execProfileOptimization(p, 'api-key-manager', { silent: true });
	});
}

// configure publisher node in distributed
async function configureDPub(p, count) {
	let args = {
		_connectionUrl: 'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for the API Manager database',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2AM_DB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2AM_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _keymanager}/services/`);

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _gateway}/services/`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let gatewayEPElement = new libxmljs.Element(doc, 'GatewayEndpoint', `http://localhost:${_p8280 + _gateway},https://localhost:${_p8243 + _gateway}`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="GatewayEndpoint"]')
			.addNextSibling(gatewayEPElement);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let urlElement = new libxmljs.Element(doc, 'DisplayURL', 'true');

		apim.root()
			.get('//*[local-name()="APIStore"]/*[local-name()="DisplayURL"]')
			.addNextSibling(urlElement);

		urlElement = new libxmljs.Element(doc, 'URL', `https://localhost:${_p9443 + _store}/store`);

		apim.root()
			.get('//*[local-name()="APIStore"]/*[local-name()="URL"]')
			.addNextSibling(urlElement);

		let tManagerElement = new libxmljs.Element(doc, 'ReceiverUrlGroup', `tcp://localhost:${_p9611 + _trafficmanager}`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="ReceiverUrlGroup"]')
			.addNextSibling(tManagerElement);

		tManagerElement = new libxmljs.Element(doc, 'AuthUrlGroup', `ssl://localhost:${_p9711 + _trafficmanager}`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="AuthUrlGroup"]')
			.addNextSibling(tManagerElement);

		let dataPubElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="DataPublisher"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		let policyDepElement = new libxmljs.Element(doc, 'ServiceURL', `https://localhost:${_p9443 + _trafficmanager}/services/`);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="ServiceURL"]')
			.addNextSibling(policyDepElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="BlockCondition"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="JMSConnectionDetails"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		let altered = removeDeclaration(apim.toString());

		let authManager = altered.substring(altered.indexOf('<AuthManager>'), altered.indexOf('</AuthManager>'));
		let firstAlter = alterElement(authManager, 'ServerURL', 'server url changed ');

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let secondAlter = environments.substring(0, environments.indexOf('<ServerURL>')) +
			commentElement(environments.substring(environments.indexOf('<ServerURL>'), environments.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<ServerURL>'), environments.indexOf('<GatewayEndpoint>')) +
			commentElement(environments.substring(environments.indexOf('<GatewayEndpoint>'), environments.lastIndexOf('<GatewayEndpoint>'))) +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<GatewayEndpoint>'), environments.length);

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let thirdAlter = alterElement(apiKeyValidator, 'EnableThriftServer', 'disable thrift server ');

		let apiStore = altered.substring(altered.indexOf('<APIStore>'), altered.indexOf('</APIStore>'));
		let fourthAlter = apiStore.substring(0, apiStore.indexOf('<DisplayURL>')) +
			commentElement(apiStore.substring(apiStore.indexOf('<DisplayURL>'), apiStore.lastIndexOf('<DisplayURL>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<DisplayURL>'), apiStore.indexOf('<URL>')) +
			commentElement(apiStore.substring(apiStore.indexOf('<URL>'), apiStore.lastIndexOf('<URL>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<URL>'), apiStore.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));

		let trafficmanager = tConf.substring(tConf.indexOf('<TrafficManager>'), tConf.indexOf('</TrafficManager>'));
		let sfirstAlter = trafficmanager.substring(0, trafficmanager.indexOf('<ReceiverUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<ReceiverUrlGroup>'), trafficmanager.lastIndexOf('<ReceiverUrlGroup>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<ReceiverUrlGroup>'), trafficmanager.indexOf('<AuthUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<AuthUrlGroup>'), trafficmanager.lastIndexOf('<AuthUrlGroup>'))) +
			`${_t}<!-- ${_comment} url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<AuthUrlGroup>'), trafficmanager.length);

		let dataPublisher = tConf.substring(tConf.indexOf('<DataPublisher>'), tConf.indexOf('</DataPublisher>'));
		let ssecondAlter = alterElement(dataPublisher, 'Enabled', 'disabled ');

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let sthirdAlter = alterElement(policyDeployer, 'ServiceURL', 'traffic manager url ');

		let blockCondition = tConf.substring(tConf.indexOf('<BlockCondition>'), tConf.indexOf('</BlockCondition>'));
		let sfourthAlter = alterElement(blockCondition, 'Enabled', 'disabled ');

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sfifthAlter = alterElement(jmsConnectionDetails, 'Enabled', 'disabled ');

		let fifthAlter = tConf.substring(0, tConf.indexOf('<TrafficManager>')) +
			sfirstAlter +
			tConf.substring(tConf.indexOf('</TrafficManager>'), tConf.indexOf('<DataPublisher>')) +
			ssecondAlter +
			tConf.substring(tConf.indexOf('</DataPublisher>'), tConf.indexOf('<PolicyDeployer>')) +
			sthirdAlter +
			tConf.substring(tConf.indexOf('</PolicyDeployer>'), tConf.indexOf('<BlockCondition>')) +
			sfourthAlter +
			tConf.substring(tConf.indexOf('</BlockCondition>'), tConf.indexOf('<JMSConnectionDetails>')) +
			sfifthAlter +
			tConf.substring(tConf.indexOf('</JMSConnectionDetails>'), tConf.length);

		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.indexOf('<Environments>')) +
			secondAlter +
			altered.substring(altered.indexOf('</Environments>'), altered.indexOf('<APIKeyValidator>')) +
			thirdAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.indexOf('<APIStore>')) +
			fourthAlter +
			altered.substring(altered.indexOf('</APIStore>'), altered.indexOf('<ThrottlingConfigurations>')) +
			fifthAlter +
			altered.substring(altered.indexOf('</ThrottlingConfigurations>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, count);
	}).then(() => {
		alterMDatasourceAM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';

		alterMDatasourceUM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/regdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';

		alterMDatasourceREG(p, args);
	}).then(() => {
		alterUserMgt(p);
	}).then(() => {
		execProfileOptimization(p, 'api-publisher', { silent: true });
	});
}

// configure store node in distributed
async function configureDStore(p, count) {
	let args = {
		_connectionUrl:
			'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for the API Manager database',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2AM_DB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2AM_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _keymanager}/services/`);

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _gateway}/services/`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let gatewayEPElement = new libxmljs.Element(doc, 'GatewayEndpoint', `http://localhost:${_p8280 + _gateway},https://localhost:${_p8243 + _gateway}`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="GatewayEndpoint"]')
			.addNextSibling(gatewayEPElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + _keymanager}/services/`);

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let keyValCElement = new libxmljs.Element(doc, 'KeyValidatorClientType', 'WSClient');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="KeyValidatorClientType"]')
			.addNextSibling(keyValCElement);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let revokeElement = new libxmljs.Element(doc, 'RevokeAPIURL', `https://localhost:${_p8243 + _gateway}/revoke`);

		apim.root()
			.get('//*[local-name()="OAuthConfigurations"]/*[local-name()="RevokeAPIURL"]')
			.addNextSibling(revokeElement);

		let dataPubElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="DataPublisher"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="BlockCondition"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="JMSConnectionDetails"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		let altered = removeDeclaration(apim.toString());

		let authManager = altered.substring(altered.indexOf('<AuthManager>'), altered.indexOf('</AuthManager>'));
		let firstAlter = alterElement(authManager, 'ServerURL', 'server url changed ');

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let secondAlter = environments.substring(0, environments.indexOf('<ServerURL>')) +
			commentElement(environments.substring(environments.indexOf('<ServerURL>'), environments.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<ServerURL>'), environments.indexOf('<GatewayEndpoint>')) +
			commentElement(environments.substring(environments.indexOf('<GatewayEndpoint>'), environments.lastIndexOf('<GatewayEndpoint>'))) +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<GatewayEndpoint>'), environments.length);

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let thirdAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<KeyValidatorClientType>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<KeyValidatorClientType>'), apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'))) +
			`${_t}<!-- ${_comment} client type changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} thrift server disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let oauthConfig = altered.substring(altered.indexOf('<OAuthConfigurations>'), altered.indexOf('</OAuthConfigurations>'));
		let fourthAlter = alterElement(oauthConfig, 'RevokeAPIURL', 'revoke api url added ');

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));

		let dataPublisher = tConf.substring(tConf.indexOf('<DataPublisher>'), tConf.indexOf('</DataPublisher>'));
		let sfirstAlter = alterElement(dataPublisher, 'Enabled', 'disabled ');

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let ssecondAlter = alterElement(policyDeployer, 'Enabled', 'disabled ');

		let blockCondition = tConf.substring(tConf.indexOf('<BlockCondition>'), tConf.indexOf('</BlockCondition>'));
		let sthirdAlter = alterElement(blockCondition, 'Enabled', 'disabled ');

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sfourthAlter = alterElement(jmsConnectionDetails, 'Enabled', 'disabled ');

		let fifthAlter = tConf.substring(0, tConf.indexOf('<DataPublisher>')) +
			sfirstAlter +
			tConf.substring(tConf.indexOf('</DataPublisher>'), tConf.indexOf('<PolicyDeployer>')) +
			ssecondAlter +
			tConf.substring(tConf.indexOf('</PolicyDeployer>'), tConf.indexOf('<BlockCondition>')) +
			sthirdAlter +
			tConf.substring(tConf.indexOf('</BlockCondition>'), tConf.indexOf('<JMSConnectionDetails>')) +
			sfourthAlter +
			tConf.substring(tConf.indexOf('</JMSConnectionDetails>'), tConf.length);

		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.indexOf('<Environments>')) +
			secondAlter +
			altered.substring(altered.indexOf('</Environments>'), altered.indexOf('<APIKeyValidator>')) +
			thirdAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.indexOf('<OAuthConfigurations>')) +
			fourthAlter +
			altered.substring(altered.indexOf('</OAuthConfigurations>'), altered.indexOf('<ThrottlingConfigurations>')) +
			fifthAlter +
			altered.substring(altered.indexOf('</ThrottlingConfigurations>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, count);
	}).then(() => {
		alterMDatasourceAM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';

		alterMDatasourceUM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/regdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by the registry';
		args._jndiName = 'jdbc/WSO2REG_DB';
		args._name = 'WSO2REG_DB';

		alterMDatasourceREG(p, args);
	}).then(() => {
		alterUserMgt(p);
	}).then(() => {
		execProfileOptimization(p, 'api-store', { silent: true });
	});
}

// configure traffic manager node in distributed
async function configureDTManager(p, _count) {
	// replace registry.xml with registry_TM.xml
	fs.removeSync(path.join(p, pRegistry));
	fs.renameSync(path.join(p, pRegistryTM), path.join(p, pRegistry));

	// replace axis2.xml with axis2_TM.xml
	fs.removeSync(path.join(p, pAxis2));
	fs.renameSync(path.join(p, pAxis2TM), path.join(p, pAxis2));

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let thriftElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(thriftElement);

		let altered = removeDeclaration(apim.toString());

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let firstAlter = alterElement(apiKeyValidator, 'EnableThriftServer', 'disabled thrift server');

		let _altered = altered.substring(0, altered.indexOf('<APIKeyValidator>')) +
			firstAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, _count);
	}).then(() => {
		execProfileOptimization(p, 'traffic-manager', { silent: true });
	});
}

// alter user-mgt.xml
async function alterUserMgt(p) {
	await parseXML(null, path.join(p, pUserMgt)).then(usermgt => {
		let doc = new libxmljs.Document(usermgt);
		let propertyElement = new libxmljs.Element(doc, 'Property', 'jdbc/WSO2UM_DB')
			.attr({ name: 'dataSource' });

		let dsElement = usermgt.root()
			.get('//*[local-name()="Realm"]/*[local-name()="Configuration"]/*[local-name()="Property"][@name="dataSource"]');

		let commentElement = new libxmljs.Comment(doc, dsElement.toString());

		usermgt.root()
			.get('//*[local-name()="Realm"]/*[local-name()="Configuration"]/*[local-name()="Property"][@name="dataSource"]')
			.addNextSibling(propertyElement);

		usermgt.root()
			.get('//*[local-name()="Realm"]/*[local-name()="Configuration"]/*[local-name()="Property"][@name="dataSource"][1]')
			.remove();

		usermgt.root()
			.get('//*[local-name()="Realm"]/*[local-name()="Configuration"]/*[local-name()="Property"][@name="dataSource"]')
			.addPrevSibling(commentElement);

		let altered = usermgt.toString();

		let _altered = altered.substring(0, altered.indexOf('<Property name="dataSource">jdbc/WSO2UM_DB')) +
			`${_n}<!-- ${_comment} datasource changed -->\n` +
			altered.substring(altered.indexOf('<Property name="dataSource">jdbc/WSO2UM_DB'), altered.length);

		fs.writeFileSync(path.join(p, pUserMgt), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// alter api manager datasource
async function alterMDatasourceAM(p, args) {
	await parseXML(null, path.join(p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let datasourceElement = buildDatasource(doc, args);

		let amElement = master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]');

		let commentElement = new libxmljs.Comment(doc, amElement.toString());

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]')
			.addNextSibling(datasourceElement);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"][1]')
			.remove();

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]')
			.addPrevSibling(commentElement);

		let altered = removeDeclaration(master.toString());

		let _altered = altered.substring(0, altered.indexOf('<datasource><name>WSO2AM_DB</name>')) +
			`${_n}<!-- ${_comment} datasource added -->\n` +
			altered.substring(altered.indexOf('<datasource><name>WSO2AM_DB</name>'), altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length) +
			altered.substring(altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length, altered.length);

		fs.writeFileSync(path.join(p, pMasterDatasource), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// alter user datasource
async function alterMDatasourceUM(p, args) {
	await parseXML(null, path.join(p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let datasourceElement = buildDatasource(doc, args);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]')
			.addNextSibling(datasourceElement);

		let altered = removeDeclaration(master.toString());

		let _altered = altered.substring(0, altered.indexOf(`<datasource><name>${args._name}</name>`)) +
			`${_n}<!-- ${_comment} datasource added -->\n` +
			altered.substring(altered.indexOf(`<datasource><name>${args._name}</name>`), altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length) +
			altered.substring(altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length, altered.length);

		fs.writeFileSync(path.join(p, pMasterDatasource), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// alter registry datasource
async function alterMDatasourceREG(p, args) {
	await parseXML(null, path.join(p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let datasourceElement = buildDatasource(doc, args);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2UM_DB"]')
			.addNextSibling(datasourceElement);

		let altered = removeDeclaration(master.toString());

		let _altered = altered.substring(0, altered.indexOf(`<datasource><name>${args._name}</name>`)) +
			`${_n}<!-- ${_comment} datasource added -->\n` +
			altered.substring(altered.indexOf(`<datasource><name>${args._name}</name>`), altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length) +
			altered.substring(altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length, altered.length);

		fs.writeFileSync(path.join(p, pMasterDatasource), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// build datasource elements
function buildDatasource(doc, args) {
	let genericElement = new libxmljs.Element(doc, 'datasource');
	genericElement
		.node('name', args._name)
		.parent()
		.node('description', args._description)
		.parent()
		.node('jndiConfig')
		.node('name', args._jndiName)
		.parent()
		.parent()
		.node('definition')
		.attr({ type: 'RDBMS' })
		.node('configuration')
		.node('url', args._connectionUrl)
		.parent()
		.node('username', args._username)
		.parent()
		.node('password', args._password)
		.parent()
		.node('driverClassName', args._driver)
		.parent()
		.node('maxActive', args._maxActive)
		.parent()
		.node('maxWait', args._maxWait)
		.parent()
		.node('minIdle', args._minIdle)
		.parent()
		.node('testOnBorrow', args._testOnBorrow)
		.parent()
		.node('validationQuery', args._validationQuery)
		.parent()
		.node('validationInterval', args._validationInterval)
		.parent()
		.node('defaultAutoCommit', args._defaultAutoCommit);

	return genericElement;
}

// build docs and additional notes
function buildDDDoc(ocli) {
	const table = new Table({
		style: {
			head: ['reset'],
		},
		head: [
			'node',
			'port-offset',
			'port',
			'profile',
		],
		chars: {
			mid: '',
			'left-mid': '',
			'mid-mid': '',
			'right-mid': '',
		},
	});

	table.push(
		['', '', '', ''],
		['gateway', _gateway, `${_p9443 + _gateway}`, ''],
		['keymanager', _keymanager, `${_p9443 + _keymanager}`, 'key-manager'],
		['publisher', _publisher, `${_p9443 + _publisher}`, 'api-publisher'],
		['store', _store, `${_p9443 + _store}`, 'api-store'],
		['trafficmanager', _trafficmanager, `${_p9443 + _trafficmanager}`, 'traffic-manager']
	);

	ocli.log('\n' + table.toString());
	ocli.log(`
NOTE: Please run the profile optimization before running the nodes for testing or production

Start the distributed nodes in the following order
	01. Key Manager
	02. Publisher
	03. Store
	04. Traffic Manager
	05. Gateway
`);
}

// #endregion

// #region is as km configurations

async function configureISasKM(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	let sync = fs.readdirSync(_p);
	if (sync.length === 2) {
		let count = 0;
		traverseISasKM(ocli, sync, count);
	}
}

function traverseISasKM(ocli, sync, count) {
	if (count < _c['is-km'].length) {
		let pack = sync.shift();
		cli.action.start(`configuring ${pack}`);
		if (pack.startsWith('wso2am')) {
			configureISKMAIO(path.join(_p, pack)).then(() => {
				cli.action.stop();
			}).then(() => {
				traverseISasKM(ocli, sync, ++count);
			});
		}
		if (pack.startsWith('wso2is-km')) {
			configureISKM(path.join(_p, pack)).then(() => {
				cli.action.stop();
			}).then(() => {
				traverseISasKM(ocli, sync, ++count);
			});
		}
	} else {
		buildISKMDoc(ocli);
	}
}

// configure is-km node in is-km setup
async function configureISKM(p) {
	let args = {
		_connectionUrl:
			'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for the API Manager database',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2AM_DB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2AM_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443}/services/`);

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let revokeElement = new libxmljs.Element(doc, 'RevokeAPIURL', `https://localhost:${_p8243}/revoke`);

		apim.root()
			.get('//*[local-name()="OAuthConfigurations"]/*[local-name()="RevokeAPIURL"]')
			.addNextSibling(revokeElement);

		let altered = removeDeclaration(apim.toString());

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let firstAlter = alterElement(environments, 'ServerURL', 'server url changed ');

		let oauthConfig = altered.substring(altered.indexOf('<OAuthConfigurations>'), altered.indexOf('</OAuthConfigurations>'));
		let secondAlter = alterElement(oauthConfig, 'RevokeAPIURL', 'revoke api url added ');

		let _altered = altered.substring(0, altered.indexOf('<Environments>')) +
			firstAlter +
			altered.substring(altered.indexOf('</Environments>'), altered.indexOf('<OAuthConfigurations>')) +
			secondAlter +
			altered.substring(altered.indexOf('</OAuthConfigurations>'));

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, 1);
	}).then(() => {
		alterMDatasourceAM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';

		alterMDatasourceUM(p, args);
	}).then(() => {
		alterUserMgt(p);
	});
}

// configure all-in-one api manager node in is-km setup
async function configureISKMAIO(p) {
	let args = {
		_connectionUrl:
			'jdbc:mysql://localhost:3306/apimgtdb?autoReconnect=true&useSSL=false',
		_defaultAutoCommit: 'false',
		_description: 'The datasource used for the API Manager database',
		_driver: 'com.mysql.jdbc.Driver',
		_jndiName: 'jdbc/WSO2AM_DB',
		_maxActive: '80',
		_maxWait: '60000',
		_minIdle: '5',
		_name: 'WSO2AM_DB',
		_password: 'hydrogen',
		_testOnBorrow: 'true',
		_username: 'mysql',
		_validationInterval: '30000',
		_validationQuery: 'SELECT 1',
	};

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', `https://localhost:${_p9443 + 1}/services/`);

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let keyValCElement = new libxmljs.Element(doc, 'KeyValidatorClientType', 'WSClient');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="KeyValidatorClientType"]')
			.addNextSibling(keyValCElement);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let altered = removeDeclaration(apim.toString());

		let authManager = altered.substring(altered.indexOf('<AuthManager>'), altered.indexOf('</AuthManager>'));
		let firstAlter = alterElement(authManager, 'ServerURL', 'server url changed ');

		let apiKeyValidator = altered.substring(altered.lastIndexOf('<APIKeyValidator>'), altered.lastIndexOf('</APIKeyValidator>'));
		let secondAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<KeyValidatorClientType>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<KeyValidatorClientType>'), apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'))) +
			`${_t}<!-- ${_comment} client type changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} thrift server disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.indexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'));

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		alterMDatasourceAM(p, args);
	}).then(() => {
		args._connectionUrl = 'jdbc:mysql://localhost:3306/userdb?autoReconnect=true&useSSL=false';
		args._description = 'The datasource used by user manager';
		args._jndiName = 'jdbc/WSO2UM_DB';
		args._name = 'WSO2UM_DB';

		alterMDatasourceUM(p, args);
	}).then(() => {
		alterUserMgt(p);
	});
}

// build docs and additional notes
function buildISKMDoc(ocli) {
	const table = new Table({
		style: {
			head: ['reset'],
		},
		head: [
			'node',
			'port-offset',
			'port',
		],
		chars: {
			mid: '',
			'left-mid': '',
			'mid-mid': '',
			'right-mid': '',
		},
	});

	table.push(
		['', '', ''],
		['api-manager', '0', `${_p9443}`],
		['is-keymanager', '1', `${_p9443 + 1}`],
	);

	ocli.log('\n' + table.toString());
	ocli.log(`
Start the configured nodes in the following order
	01. Key Manager
	02. API Manager
`);
}

// #endregion

// alter element
function alterElement(element, tag, description) {
	let alter = element.substring(0, element.indexOf(`<${tag}>`)) +
		commentElement(element.substring(element.indexOf(`<${tag}>`), element.lastIndexOf(`<${tag}>`))) +
		`${_t}<!-- ${_comment} ${description ? description : ''}-->\n${_t}` +
		element.substring(element.lastIndexOf(`<${tag}>`), element.length);
	return alter;
}

// execute profile optimization for distributed setup
function execProfileOptimization(p, profile, opts) {
	exec(`sh ${path.join(p, 'bin/profileSetup.sh')} -Dprofile=${profile}`, opts);
}

// comment elements
function commentElement(element) {
	return '<!-- ' + element + ` -->${_n}`;
}

// configure port offset
async function configurePortOffset(p, count) {
	if (count > 0)
		await parseXML(null, path.join(p, pCarbon)).then(carbon => {
			let doc = new libxmljs.Document(carbon);

			// Offset node creation
			let offsetElement = new libxmljs.Element(doc, 'Offset', count.toString());

			carbon.root()
				.get('//*[local-name()="Ports"]/*[local-name()="Offset"]')
				.addNextSibling(offsetElement);

			let _altered = carbon.toString().replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');
			_altered = alterElement(_altered, 'Offset', `port offset ${count}`);

			fs.writeFileSync(path.join(p, pCarbon), _altered, _utf8);
		});
}
