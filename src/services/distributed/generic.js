const fs = require('fs-extra');
const libxmljs = require('libxmljs');
const path = require('path');
const prettify = require('prettify-xml');
const { cli } = require('cli-ux');

const { logger } = require('../../utils/logger');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let pApiManager = '/repository/conf/api-manager.xml';
let pAxis2 = '/repository/conf/axis2/axis2.xml';
let pAxis2TM = '/repository/conf/axis2/axis2_TM.xml';
let pCarbon = '/repository/conf/carbon.xml';
let pRegistry = '/repository/conf/registry.xml';
let pRegistryTM = '/repository/conf/registry_TM.xml';

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
	if (args['multiple-gateway'])
		configureMultipleGateway(ocli);
	else if (args.distributed)
		configureDistributedDeployment(ocli);
};

// #region publish multiple gateway configurations

async function configureMultipleGateway(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	if (fs.readdirSync(_p).length === 1) {
		fs.readdirSync(_p).forEach(d => {
			if (d.startsWith('wso2')) {
				let pDistributed = path.join(_p, _distributed);
				// create folder named 'ditributed'
				fs.mkdirSync(pDistributed);

				let source = path.join(_p, d);
				let _count = 1;

				_c['multiple-gateway'].sort().forEach(name => {
					cli.action.start(`\tconfiguring ${d} as ${name}`);
					fs.copy(source, path.join(pDistributed, name)).then(() => {
						if (name.startsWith('gateway')) {
							configureMGW(path.join(pDistributed, name), _count);
							++_count;
						} else {
							configureMGWAIO(path.join(pDistributed, name));
						}
					}).then(() => {
						cli.action.stop();
					});
				});
			}
		});
	}
}

async function configureMGWAIO(p) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		// environment node creation
		let envProdNode = buildEnvironmentNode(doc, 'production', 'Production Gateway', 'Production Gateway Environment', 1);
		let envHybNode = buildEnvironmentNode(doc, 'hybrid', 'Production and Sandbox', 'Hybrid Gateway Environment', 2);

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
			prettify(altered) +
			`${_n}${_t}<!-- ${_comment} environments added -->\n${_t}` +
			prettify(envsElement.substring(envsElement.indexOf('<Environment '), envsElement.lastIndexOf('<Environment '))) +
			'\n\n' +
			prettify(envsElement.substring(envsElement.lastIndexOf('<Environment '), envsElement.length));

		_altered = _altered.substring(0, _altered.indexOf('<Environments>')) +
			envsElement +
			_n +
			_altered.substring(_altered.indexOf('</Environments>'), _altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered) + '\n', _utf8);
	});
}

// eslint-disable-next-line max-params
function buildEnvironmentNode(doc, type, name, description, c) {
	let environmentNode = new libxmljs.Element(doc, 'Environment').attr({ type: type, 'api-console': 'true' });
	environmentNode
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
	return environmentNode;
}

async function configureMGW(p, _count) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		// ServerURL node creation
		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9443/services/');

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
		let revokeApiElement = new libxmljs.Element(doc, 'RevokeAPIURL', 'https://localhost:8243/revoke');

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

		// altered.substring(0, altered.lastIndexOf('<APIStore>')) +
		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.lastIndexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.lastIndexOf('</APIKeyValidator>'), altered.indexOf('<RevokeAPIURL>')) +
			commentElement(altered.substring(altered.indexOf('<RevokeAPIURL>'), altered.lastIndexOf('<RevokeAPIURL>'))) +
			`${_t}<!-- ${_comment}: revoke api changed -->\n${_t}` +
			altered.substring(altered.lastIndexOf('<RevokeAPIURL>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), _altered, _utf8);
	}).then(() => {
		configureMGWCarbon(p, _count);
	});
}

async function configureMGWCarbon(p, _count) {
	await configurePortOffset(p, _count);
}

// #endregion

// #region distributed deployment 5 nodes

function configureDistributedDeployment(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	if (fs.readdirSync(_p).length === 1) {
		fs.readdirSync(_p).forEach(d => {
			if (d.startsWith('wso2')) {
				let pDistributed = path.join(_p, _distributed);
				// create folder named 'ditributed'
				fs.mkdirSync(pDistributed);

				let source = path.join(_p, d);
				let _count = 0;

				cli.action.start(`\tconfiguring ${d} as ${_c.distributed.sort()[0]}`);
				_c.distributed.sort().forEach(name => {
					fs.copy(source, path.join(pDistributed, name)).then(() => {
						if (name === 'gateway') {
							configureDGWay(path.join(pDistributed, name), _count);
						} else if (name === 'keymanager') {
							configureDKManager(path.join(pDistributed, name), _count);
						} else if (name === 'publisher') {
							configureDPub(path.join(pDistributed, name), _count);
						} else if (name === 'store') {
							configureDStore(path.join(pDistributed, name), _count);
						} else if (name === 'trafficmanager') {
							configureDTManager(path.join(pDistributed, name), _count);
						} else {
							configurePortOffset(path.join(pDistributed, name), _count);
						}
						++_count;
					}).then(() => {
						cli.action.stop();
					}).then(() => {
						cli.action.start(`\tconfiguring ${d} as ${name}`);
					});
				});
			}
		});
	}
}

async function configureDGWay(p, _count) {
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
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));
		let trafficmanager = tConf.substring(tConf.indexOf('<TrafficManager>'), tConf.indexOf('</TrafficManager>'));
		let sfirstAlter = trafficmanager.substring(0, trafficmanager.indexOf('<ReceiverUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<ReceiverUrlGroup>'), trafficmanager.lastIndexOf('<ReceiverUrlGroup>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<ReceiverUrlGroup>'), trafficmanager.indexOf('<AuthUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<AuthUrlGroup>'), trafficmanager.lastIndexOf('<AuthUrlGroup>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<AuthUrlGroup>'), trafficmanager.length);

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let ssecondAlter = policyDeployer.substring(0, policyDeployer.indexOf('<Enabled>')) +
			commentElement(policyDeployer.substring(policyDeployer.indexOf('<Enabled>'), policyDeployer.lastIndexOf('<Enabled>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			policyDeployer.substring(policyDeployer.lastIndexOf('<Enabled>'), policyDeployer.indexOf('<ServiceURL>')) +
			commentElement(policyDeployer.substring(policyDeployer.indexOf('<ServiceURL>'), policyDeployer.lastIndexOf('<ServiceURL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			policyDeployer.substring(policyDeployer.lastIndexOf('<ServiceURL>'), policyDeployer.length);

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sthirdAlter = jmsConnectionDetails.substring(0, jmsConnectionDetails.indexOf('<ServiceURL>')) +
			_n +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			jmsConnectionDetails.substring(jmsConnectionDetails.indexOf('<ServiceURL>'), jmsConnectionDetails.indexOf('<connectionfactory.TopicConnectionFactory>')) +
			commentElement(jmsConnectionDetails.substring(jmsConnectionDetails.indexOf('<connectionfactory.TopicConnectionFactory>'), jmsConnectionDetails.lastIndexOf('<connectionfactory.TopicConnectionFactory>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
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
		configurePortOffset(p, _count);
	});
}

async function configureDKManager(p, _count) {
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
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
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
		configurePortOffset(p, _count);
	});
}

async function configureDPub(p, _count) {
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
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<DisplayURL>'), apiStore.indexOf('<URL>')) +
			commentElement(apiStore.substring(apiStore.indexOf('<URL>'), apiStore.lastIndexOf('<URL>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<URL>'), apiStore.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));

		let trafficmanager = tConf.substring(tConf.indexOf('<TrafficManager>'), tConf.indexOf('</TrafficManager>'));
		let sfirstAlter = trafficmanager.substring(0, trafficmanager.indexOf('<ReceiverUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<ReceiverUrlGroup>'), trafficmanager.lastIndexOf('<ReceiverUrlGroup>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<ReceiverUrlGroup>'), trafficmanager.indexOf('<AuthUrlGroup>')) +
			commentElement(trafficmanager.substring(trafficmanager.indexOf('<AuthUrlGroup>'), trafficmanager.lastIndexOf('<AuthUrlGroup>'))) +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
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
		configurePortOffset(p, _count);
	});
}

async function configureDStore(p, _count) {
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
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			commentElement(apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>'))) +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
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
		configurePortOffset(p, _count);
	});
}

async function configureDTManager(p, _count) {
	// replace registry.xml with registry_TM.xml
	fs.removeSync(path.join(p, pRegistry));
	fs.renameSync(path.join(p, pRegistryTM), path.join(p, pRegistry));

	// replace axis2.xml with axis2_TM.xml
	fs.removeSync(path.join(p, pAxis2));
	fs.renameSync(path.join(p, pAxis2TM), path.join(p, pAxis2));

	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let enableThriftSElement = new libxmljs.Element(doc, 'EnableThriftServer', 'false');

		apim.root()
			.get('//*[local-name()="APIKeyValidator"]/*[local-name()="EnableThriftServer"]')
			.addNextSibling(enableThriftSElement);

		let altered = removeDeclaration(apim.toString());

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let firstAlter = alterElement(apiKeyValidator, 'EnableThriftServer', 'disabled thrift server');

		let _altered = altered.substring(0, altered.indexOf('<APIKeyValidator>')) +
			firstAlter +
			altered.substring(altered.indexOf('</APIKeyValidator>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		configurePortOffset(p, _count);
	});
}

// #endregion

function alterElement(element, tag, description) {
	let alter = element.substring(0, element.indexOf(`<${tag}>`)) +
		commentElement(element.substring(element.indexOf(`<${tag}>`), element.lastIndexOf(`<${tag}>`))) +
		`${_t}<!-- ${_comment} ${description ? description : ''}-->\n${_t}` +
		element.substring(element.lastIndexOf(`<${tag}>`), element.length);
	return alter;
}

function commentElement(element) {
	let comment = '<!-- ' + element + ` -->${_n}`;
	return comment;
}

async function configurePortOffset(p, _count) {
	if (_count > 0)
		await parseXML(null, path.join(p, pCarbon)).then(carbon => {
			let doc = new libxmljs.Document(carbon);

			// Offset node creation
			let offsetElement = new libxmljs.Element(doc, 'Offset', _count.toString());

			carbon.root()
				.get('//*[local-name()="Ports"]/*[local-name()="Offset"]')
				.addNextSibling(offsetElement);

			let _altered = carbon.toString().replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');
			_altered = alterElement(_altered, 'Offset', `port offset ${_count}`);

			fs.writeFileSync(path.join(p, pCarbon), _altered, _utf8);
		});
}
