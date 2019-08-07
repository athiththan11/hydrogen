const fs = require('fs-extra');
const path = require('path');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

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

exports.configure = async function (log, cli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	if (fs.readdirSync(_p).length === 1) {
		fs.readdirSync(_p).forEach(d => {
			if (d.startsWith('wso2')) {
				let _distributed = 'distributed';
				cli.action.start(`creating folder for ${_distributed} configurations`);
				// create folder named 'ditributed'
				fs.mkdirSync(path.join(_p, _distributed));
				cli.action.stop();

				let source = path.join(_p, d);
				let _count = 0;

				// FIXME: options
				_c['multiple-gateway'].sort().forEach(name => {
					cli.action.start(`copying ${d} as ${name}`);
					fs.copySync(source, path.join(_p, _distributed, name));

					if (name.startsWith('gateway')) {
						cli.action.start(`configuring ${name}`);
						configureMGW(path.join(_p, _distributed, name), ++_count);
						cli.action.stop();
					}
					cli.action.stop();
				});
			}
		});
	}
};

function configureMultipleGateway() {

}

function configureMGWAIO() {

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
			' -->\n\n' +
			'\t\t<!-- HYDROGENERATED: server url changed -->\n\t\t' +
			authManager.substring(authManager.lastIndexOf('<ServerURL>'), authManager.length);

		let secondAlter = apiKeyValidator.substring(0, apiKeyValidator.indexOf('<ServerURL>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ServerURL>'), apiKeyValidator.lastIndexOf('<ServerURL>')) +
			' -->\n\n' +
			'\t\t<!-- HYDROGENERATED: server url has been changed -->\n\t\t' +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<ServerURL>'), apiKeyValidator.indexOf('<ThriftClientPort>')) +
			'\n\n' +
			'\t\t<!-- HYDROGENERATED: thrift client port has been set -->\n\t\t' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<ThriftClientPort>'), apiKeyValidator.indexOf('<EnableThriftServer>')) +
			'<!-- ' +
			apiKeyValidator.substring(apiKeyValidator.indexOf('<EnableThriftServer>'), apiKeyValidator.lastIndexOf('<EnableThriftServer>')) +
			' -->\n\n' +
			'\t\t<!-- HYDROGENERATED: thrift server has been disabled -->\n\t\t' +
			apiKeyValidator.substring(apiKeyValidator.lastIndexOf('<EnableThriftServer>'), apiKeyValidator.length);

		// altered.substring(0, altered.lastIndexOf('<APIKeyValidator>')) +
		let _altered = altered.substring(0, altered.indexOf('<AuthManager>')) +
			firstAlter +
			altered.substring(altered.indexOf('</AuthManager>'), altered.lastIndexOf('<APIKeyValidator>')) +
			secondAlter +
			altered.substring(altered.lastIndexOf('</APIKeyValidator>'), altered.indexOf('<RevokeAPIURL>')) +
			'<!-- ' +
			altered.substring(altered.indexOf('<RevokeAPIURL>'), altered.lastIndexOf('<RevokeAPIURL>')) +
			' -->\n\n' +
			'\t\t<!-- HYDROGENERATED: revoke api changed -->\n\t\t' +
			altered.substring(altered.lastIndexOf('<RevokeAPIURL>'), altered.length);

		fs.writeFileSync(path.join(p, pApiManager), _altered, 'utf8');
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
			' -->\n\n' +
			`\t\t<!-- HYDROGENERATED: port offset ${_count} -->\n\t\t` +
			_altered.substring(_altered.lastIndexOf('<Offset>'), _altered.length);

		fs.writeFileSync(path.join(p, pCarbon), _altered, 'utf8');
	});
}
