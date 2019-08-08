const fs = require('fs-extra');
const path = require('path');
const libxmljs = require('libxmljs');
const prettify = require('prettify-xml');
const { cli } = require('cli-ux');

const { logger } = require('../../utils/logger');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let pApiManager = '/repository/conf/api-manager.xml';
let pCarbon = '/repository/conf/carbon.xml';

let _p = process.cwd();
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
	dist: [
		'store',
	],
};
let _comment = 'HYDROGENERATED:';
let _distributed = 'distributed';
let _n = '\n\n';
let _t = '\t\t';
let _utf8 = 'utf8';

exports.configure = async function (log, args) {
	if (args['multiple-gateway'])
		configureMultipleGateway(log);
	else if (args.distributed)
		configureDistributedDeployment(log);
};

// #region publish multiple gateway configurations

async function configureMultipleGateway(log) {
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
					fs.copySync(source, path.join(pDistributed, name));

					if (name.startsWith('gateway')) {
						configureMGW(path.join(pDistributed, name), _count);
						++_count;
					} else {
						configureMGWAIO(path.join(pDistributed, name));
					}
					cli.action.stop();
				});
			}
		});
	}
}

async function configureMGWAIO(p) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		// environment node creation
		let envProdNode = buildEnvironmentNode(doc, 'production', 'Production Gateway', 'Production Gateway Environment', 0);
		let envHybNode = buildEnvironmentNode(doc, 'hybrid', 'Production and Sandbox', 'Hybrid Gateway Environment', 1);

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
		.node('ServerURL', `https://localhost:${9444 + c}/services/`)
		.parent()
		.node('Username', 'admin')
		.parent()
		.node('Password', 'admin')
		.parent()
		.node('GatewayEndpoint', `http://localhost:${8281 + c},https://localhost:${8244 + c}`);
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

		let firstAlter = alterElement(authManager, 'ServerURL');
		let secondAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url has been changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<ThriftClientPort>')) +
			`${_n}` +
			`${_t}<!-- ${_comment} thrift client port has been set -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ThriftClientPort>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} thrift server has been disabled -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		// altered.substring(0, altered.lastIndexOf('<APIStore>')) +
		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.lastIndexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.lastIndexOf('</APIKeyValidator>'), altered.indexOf('<RevokeAPIURL>')) +
			'<!-- ' +
			altered.substring(altered.indexOf('<RevokeAPIURL>'), altered.lastIndexOf('<RevokeAPIURL>')) +
			` -->${_n}` +
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

function configureDistributedDeployment(log) {
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

				_c.dist.sort().forEach(name => {
					cli.action.start(`\tconfiguring ${d} as ${name}`);
					fs.copySync(source, path.join(pDistributed, name));

					if (name === 'publisher') {
						configureDPub(path.join(pDistributed, name), _count);
					} else if (name === 'store') {
						configureDStore(path.join(pDistributed, name), _count);
					} else {
						configurePortOffset(path.join(pDistributed, name), _count);
					}
					++_count;
					cli.action.stop();
				});
			}
		});
	}
}

async function configureDStore(p, _count) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9444/services/');

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9443/services/');

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let gatewayEPElement = new libxmljs.Element(doc, 'GatewayEndpoint', 'http://localhost:8280,https://localhost:8243');

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="GatewayEndpoint"]')
			.addNextSibling(gatewayEPElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9444/services/');

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

		let revokeElement = new libxmljs.Element(doc, 'RevokeAPIURL', 'https://localhost:8243/revoke');

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
		let firstAlter = alterElement(authManager, 'ServerURL');

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let secondAlter = environments.substring(0, environments.indexOf('<ServerURL>')) +
			'<!-- ' +
			environments.substring(environments.indexOf('<ServerURL>'), environments.lastIndexOf('<ServerURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<ServerURL>'), environments.indexOf('<GatewayEndpoint>')) +
			'<!-- ' +
			environments.substring(environments.indexOf('<GatewayEndpoint>'), environments.lastIndexOf('<GatewayEndpoint>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<GatewayEndpoint>'), environments.length);

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let thirdAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<KeyValidatorClientType>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<KeyValidatorClientType>'), apiKeyValidator.lastIndexOf('<KeyValidatorClientType>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<KeyValidatorClientType>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		let oauthConfig = altered.substring(altered.indexOf('<OAuthConfigurations>'), altered.indexOf('</OAuthConfigurations>'));
		let fourthAlter = alterElement(oauthConfig, 'RevokeAPIURL');

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));

		let dataPublisher = tConf.substring(tConf.indexOf('<DataPublisher>'), tConf.indexOf('</DataPublisher>'));
		let sfirstAlter = alterElement(dataPublisher, 'Enabled');

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let ssecondAlter = alterElement(policyDeployer, 'Enabled');

		let blockCondition = tConf.substring(tConf.indexOf('<BlockCondition>'), tConf.indexOf('</BlockCondition>'));
		let sthirdAlter = alterElement(blockCondition, 'Enabled');

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sfourthAlter = alterElement(jmsConnectionDetails, 'Enabled');

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

async function configureDPub(p, _count) {
	await parseXML(null, path.join(p, pApiManager)).then(apim => {
		let doc = new libxmljs.Document(apim);

		let serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9444/services/');

		apim.root()
			.get('//*[local-name()="AuthManager"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		serverUrlElement = new libxmljs.Element(doc, 'ServerURL', 'https://localhost:9443/services/');

		apim.root()
			.get('//*[local-name()="APIGateway"]/*[local-name()="Environments"]/*[local-name()="Environment"]/*[local-name()="ServerURL"]')
			.addNextSibling(serverUrlElement);

		let gatewayEPElement = new libxmljs.Element(doc, 'GatewayEndpoint', 'http://localhost:8280,https://localhost:8243');

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

		urlElement = new libxmljs.Element(doc, 'URL', 'https://localhost:9446/store');

		apim.root()
			.get('//*[local-name()="APIStore"]/*[local-name()="URL"]')
			.addNextSibling(urlElement);

		let tManagerElement = new libxmljs.Element(doc, 'ReceiverUrlGroup', 'tcp://localhost:9615');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="ReceiverUrlGroup"]')
			.addNextSibling(tManagerElement);

		tManagerElement = new libxmljs.Element(doc, 'AuthUrlGroup', 'ssl://localhost:9715');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="TrafficManager"]/*[local-name()="AuthUrlGroup"]')
			.addNextSibling(tManagerElement);

		let dataPubElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="DataPublisher"]/*[local-name()="Enabled"]')
			.addNextSibling(dataPubElement);

		let policyDepElement = new libxmljs.Element(doc, 'ServiceURL', 'https://localhost:9447/services/');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="PolicyDeployer"]/*[local-name()="ServiceURL"]')
			.addNextSibling(policyDepElement);

		let blockCElement = new libxmljs.Element(doc, 'Enabled', 'false');

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="BlockCondition"]/*[local-name()="Enabled"]')
			.addNextSibling(blockCElement);

		apim.root()
			.get('//*[local-name()="ThrottlingConfigurations"]/*[local-name()="JMSConnectionDetails"]/*[local-name()="Enabled"]')
			.addNextSibling(blockCElement);

		let altered = removeDeclaration(apim.toString());

		let authManager = altered.substring(altered.indexOf('<AuthManager>'), altered.indexOf('</AuthManager>'));
		let firstAlter = alterElement(authManager, 'ServerURL');

		let environments = altered.substring(altered.indexOf('<Environments>'), altered.indexOf('</Environments>'));
		let secondAlter = environments.substring(0, environments.indexOf('<ServerURL>')) +
			'<!-- ' +
			environments.substring(environments.indexOf('<ServerURL>'), environments.lastIndexOf('<ServerURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<ServerURL>'), environments.indexOf('<GatewayEndpoint>')) +
			'<!-- ' +
			environments.substring(environments.indexOf('<GatewayEndpoint>'), environments.lastIndexOf('<GatewayEndpoint>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} gateway endpoints changed -->\n${_t}` +
			environments.substring(environments.lastIndexOf('<GatewayEndpoint>'), environments.length);

		let apiKeyValidator = altered.substring(altered.indexOf('<APIKeyValidator>'), altered.indexOf('</APIKeyValidator>'));
		let thirdAlter = alterElement(apiKeyValidator, 'EnableThriftServer');

		let apiStore = altered.substring(altered.indexOf('<APIStore>'), altered.indexOf('</APIStore>'));
		let fourthAlter = apiStore.substring(0, apiStore.indexOf('<DisplayURL>')) +
			'<!-- ' +
			apiStore.substring(apiStore.indexOf('<DisplayURL>'), apiStore.lastIndexOf('<DisplayURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<DisplayURL>'), apiStore.indexOf('<URL>')) +
			'<!-- ' +
			apiStore.substring(apiStore.indexOf('<URL>'), apiStore.lastIndexOf('<URL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			apiStore.substring(apiStore.lastIndexOf('<URL>'), apiStore.length);

		let tConf = altered.substring(altered.indexOf('<ThrottlingConfigurations>'), altered.indexOf('</ThrottlingConfigurations>'));

		let trafficmanager = tConf.substring(tConf.indexOf('<TrafficManager>'), tConf.indexOf('</TrafficManager>'));
		let sfirstAlter = trafficmanager.substring(0, trafficmanager.indexOf('<ReceiverUrlGroup>')) +
			'<!-- ' +
			trafficmanager.substring(trafficmanager.indexOf('<ReceiverUrlGroup>'), trafficmanager.lastIndexOf('<ReceiverUrlGroup>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<ReceiverUrlGroup>'), trafficmanager.indexOf('<AuthUrlGroup>')) +
			'<!-- ' +
			trafficmanager.substring(trafficmanager.indexOf('<AuthUrlGroup>'), trafficmanager.lastIndexOf('<AuthUrlGroup>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			trafficmanager.substring(trafficmanager.lastIndexOf('<AuthUrlGroup>'), trafficmanager.length);

		let dataPublisher = tConf.substring(tConf.indexOf('<DataPublisher>'), tConf.indexOf('</DataPublisher>'));
		let ssecondAlter = alterElement(dataPublisher, 'Enabled');

		let policyDeployer = tConf.substring(tConf.indexOf('<PolicyDeployer>'), tConf.indexOf('</PolicyDeployer>'));
		let sthirdAlter = alterElement(policyDeployer, 'ServiceURL');

		let blockCondition = tConf.substring(tConf.indexOf('<BlockCondition>'), tConf.indexOf('</BlockCondition>'));
		let sfourthAlter = alterElement(blockCondition, 'Enabled');

		let jmsConnectionDetails = tConf.substring(tConf.indexOf('<JMSConnectionDetails>'), tConf.indexOf('</JMSConnectionDetails>'));
		let sfifthAlter = alterElement(jmsConnectionDetails, 'Enabled');

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

// #endregion

function alterElement(element, tag, description) {
	let alter = element.substring(0, element.indexOf(`<${tag}>`)) +
		'<!-- ' +
		element.substring(element.indexOf(`<${tag}>`), element.lastIndexOf(`<${tag}>`)) +
		` -->${_n}` +
		`${_t}<!-- ${_comment} ${description ? description : 'server url changed'} -->\n${_t}` +
		element.substring(element.lastIndexOf(`<${tag}>`), element.length);
	return alter;
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
