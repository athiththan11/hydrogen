const fs = require('fs-extra');
const path = require('path');
const libxmljs = require('libxmljs');
const prettify = require('prettify-xml');

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
		'keymanager',
		'trafficmanager',
		'gateway',
		'store',
		'publisher',
	],
};
let _comment = 'HYDROGENERATED:';
let _distributed = 'distributed';
let _n = '\n\n';
let _t = '\t\t';
let _utf8 = 'utf8';

exports.configure = async function (log, cli, args) {
	if (args['multiple-gateway'])
		configureMultipleGateway(log, cli);
};

function configureMultipleGateway(log, cli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	if (fs.readdirSync(_p).length === 1) {
		fs.readdirSync(_p).forEach(d => {
			if (d.startsWith('wso2')) {
				cli.action.start(`creating folder for ${_distributed} configurations`);

				let pDistributed = path.join(_p, _distributed);

				// create folder named 'ditributed'
				fs.mkdirSync(pDistributed);
				cli.action.stop();

				let source = path.join(_p, d);
				let _count = 0;

				_c['multiple-gateway'].sort().forEach(name => {
					cli.action.start(`copying ${d} as ${name}`);
					fs.copySync(source, path.join(pDistributed, name));

					cli.action.start(`configuring ${name}`);
					if (name.startsWith('gateway')) {
						configureMGW(path.join(pDistributed, name), ++_count);
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

		let firstAlter = authManager.substring(0, authManager.indexOf('<ServerURL>')) +
			'<!-- ' +
			authManager.substring(authManager.indexOf('<ServerURL>'), authManager.lastIndexOf('<ServerURL>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} server url changed -->\n${_t}` +
			authManager.substring(authManager.lastIndexOf('<ServerURL>'), authManager.length);

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

		// altered.substring(0, altered.lastIndexOf('<APIKeyValidator>')) +
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
	await parseXML(null, path.join(p, pCarbon)).then(carbon => {
		let doc = new libxmljs.Document(carbon);

		// Offset node creation
		let offsetElement = new libxmljs.Element(doc, 'Offset', _count.toString());

		carbon.root()
			.get('//*[local-name()="Ports"]/*[local-name()="Offset"]')
			.addNextSibling(offsetElement);

		let _altered = carbon.toString().replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');
		_altered = _altered.substring(0, _altered.indexOf('<Offset>')) +
			'<!-- ' +
			_altered.substring(_altered.indexOf('<Offset>'), _altered.lastIndexOf('<Offset>')) +
			` -->${_n}` +
			`${_t}<!-- ${_comment} port offset ${_count} -->\n${_t}` +
			_altered.substring(_altered.lastIndexOf('<Offset>'), _altered.length);

		fs.writeFileSync(path.join(p, pCarbon), _altered, _utf8);
	});
}
