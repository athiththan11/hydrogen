const fs = require('fs-extra');
const libxmljs = require('libxmljs');
const path = require('path');
const prettify = require('prettify-xml');
const { cli } = require('cli-ux');
const Table = require('cli-table');

const { logger } = require('../../utils/logger');
const { alterElement, commentElement, parseXML } = require('../../utils/utility');
const { buildNginx } = require('../nginx/generic');

let pAxis2 = '/conf/axis2/axis2.xml';
let pCarbon = '/conf/carbon.xml';
let pCatalina = '/conf/tomcat/catalina-server.xml';

let _c = {
	esb: [
		'esbnodeone',
		'esbnodetwo',
	],
	bp: [
		'bpnodeone',
		'bpnodetwo',
	],
};

let _config = {
	cluster: {
		esb: {
			hostname: 'ei.wso2.com',
			http: 'http://ei.wso2.com:80',
			https: 'https://ei.wso2.com:443',
			domain: 'wso2.ei.domain',
			member: {
				hostname: '127.0.0.1',
				port: 4100,
			},
		},
	},
};

let _comment = 'HYDROGENERATED:';
let _clustered = 'clustered';
let _n = '\n\n';
let _p = process.cwd();
let _t = '\t\t';
let _utf8 = 'utf8';

let _p9443 = 9443;

exports.configure = async function (ocli, args) {
	cli.log('\n');

	if (process.env.NODE_ENV === 'mocha' && args.esb)
		_p = path.join(process.cwd(), process.env.MOCHA_ESBCLUSTERED);

	if (args.esb)
		await configureESBProfile(ocli);
};

// configure esb profile for 2 node cluster
async function configureESBProfile(ocli) {
	// clean .DS_Store in mac filesystem
	if (fs.existsSync(path.join(_p, '.DS_Store'))) {
		fs.removeSync(path.join(_p, '.DS_Store'));
	}

	let sync = fs.readdirSync(_p);
	if (sync.length === 1 && sync[0].startsWith('wso2')) {
		let pClustered = path.join(_p, _clustered);

		// create distributed folder
		fs.mkdirSync(pClustered);

		let source = path.join(_p, sync[0]);
		let _count = 0;

		traverseESBProfileNodes(ocli, sync[0], source, pClustered, _count);
	}
}

// eslint-disable-next-line max-params
function traverseESBProfileNodes(ocli, pack, source, p, count) {
	if (count < _c.esb.length) {
		let nodeName = _c.esb.sort()[count];
		cli.action.start(`configuring ${pack} as ${nodeName}`);
		fs.copy(source, path.join(p, nodeName)).then(() => {
			configureESBNode(path.join(p, nodeName), count);
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			traverseESBProfileNodes(ocli, pack, source, p, ++count);
		});
	} else {
		cli.action.start('generating nginx configurations');
		buildNginx({ cluster: true, esb: true }, null).then(() => {
			cli.action.stop();
		}).then(() => {
			buildESBDoc(ocli);
		});
	}
}

// configure esb profile node
async function configureESBNode(p, c) {
	await parseXML(null, path.join(p, pAxis2)).then(axis2 => {
		let doc = new libxmljs.Document(axis2);

		let wsdlPrefixElement = new libxmljs.Element(doc, 'parameter', _config.cluster.esb.http)
			.attr({ name: 'WSDLEPRPrefix', locked: 'false' });

		axis2.root()
			.get('//*[local-name()="transportReceiver"][@name="http"]')
			.addChild(wsdlPrefixElement);

		wsdlPrefixElement = new libxmljs.Element(doc, 'parameter', _config.cluster.esb.https)
			.attr({ name: 'WSDLEPRPrefix', locked: 'false' });

		axis2.root()
			.get('//*[local-name()="transportReceiver"][@name="https"]')
			.addChild(wsdlPrefixElement);

		let domainElement = new libxmljs.Element(doc, 'parameter', _config.cluster.esb.domain)
			.attr({ name: 'domain' });

		axis2.root()
			.get('//*[local-name()="clustering"]/*[local-name()="parameter"][@name="domain"]')
			.addNextSibling(domainElement);

		if (c > 0) {
			let port = _config.cluster.esb.member.port + (c * 100);
			let memberPortElement = new libxmljs.Element(doc, 'parameter', port.toString())
				.attr({ name: 'localMemberPort' });

			axis2.root()
				.get('//*[local-name()="clustering"]/*[local-name()="parameter"][@name="localMemberPort"]')
				.addNextSibling(memberPortElement);
		}

		let membersElement = buildMembers(doc);

		axis2.root()
			.get('//*[local-name()="clustering"]/*[local-name()="members"]')
			.addNextSibling(membersElement);

		let __wsdlPrefix = '<parameter name="WSDLEPRPrefix"';
		let __paramDomain = '<parameter name="domain">';
		let __memberPort = 'parameter name="localMemberPort"';
		let __members = '<members>';

		let altered = axis2.toString();
		altered = altered.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

		let cluster = altered.substring(altered.indexOf('<clustering'), altered.indexOf('</clustering>'));

		let _altered = altered.substring(0, altered.indexOf(__wsdlPrefix)) +
			`\n<!-- ${_comment} wsdl prefix changed -->\n` +
			altered.substring(altered.indexOf(__wsdlPrefix), altered.lastIndexOf(__wsdlPrefix)) +
			`\n<!-- ${_comment} wsdl prefix changed -->\n` +
			altered.substring(altered.lastIndexOf(__wsdlPrefix), altered.indexOf('<clustering')) +
			commentElement(cluster.substring(0, cluster.indexOf('<!--'))) +
			`<!-- ${_comment} clustering enabled -->\n` +
			cluster.substring(0, cluster.indexOf('<!--')).replace('false', 'true') +
			cluster.substring(cluster.indexOf('<!--'), cluster.indexOf(__paramDomain)) +
			commentElement(cluster.substring(cluster.indexOf(__paramDomain), cluster.lastIndexOf(__paramDomain))) +
			`<!-- ${_comment} domain name changed -->\n` +
			cluster.substring(cluster.lastIndexOf(__paramDomain), cluster.indexOf(__members)) +
			commentElement(cluster.substring(cluster.indexOf(__members), cluster.lastIndexOf(__members))) +
			`<!-- ${_comment} members added -->\n` +
			cluster.substring(cluster.lastIndexOf(__members)) + altered.substring(altered.indexOf('</clustering>'));

		if (c > 0)
			_altered = alterElement(_altered, __memberPort, 'local member port changed ');

		fs.writeFileSync(path.join(p, pAxis2), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	}).then(() => {
		alterCarbon(p, c);
	}).then(() => {
		alterCatalina(p);
	});
}

// alter carbon xml for esb cluster
async function alterCarbon(p, count) {
	await parseXML(null, path.join(p, pCarbon)).then(carbon => {
		let doc = new libxmljs.Document(carbon);

		let hostElement = new libxmljs.Element(doc, 'HostName', _config.cluster.esb.hostname);

		carbon.root()
			.get('//*[local-name()="Server"]/*[local-name()="Version"]')
			.addNextSibling(hostElement);

		if (count > 0) {
			let offsetElement = new libxmljs.Element(doc, 'Offset', count.toString());

			carbon.root()
				.get('//*[local-name()="Ports"]/*[local-name()="Offset"]')
				.addNextSibling(offsetElement);
		}

		let altered = carbon.toString().replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

		let _altered = altered.substring(0, altered.indexOf('<HostName>')) +
			`${_n}\t<!-- ${_comment} hostname changed -->\n\t` +
			altered.substring(altered.indexOf('<HostName>'));

		if (count > 0)
			_altered = alterElement(_altered, 'Offset', `port offset ${count}`);

		fs.writeFileSync(path.join(p, pCarbon), _altered, _utf8);
	});
}

// alter catalina-server and add proxy port
async function alterCatalina(p) {
	await parseXML(null, path.join(p, pCatalina)).then(catalina => {
		catalina.root()
			.get('//*[local-name()="Service"]/*[local-name()="Connector"][@protocol="org.apache.coyote.http11.Http11NioProtocol"][@port="9763"]')
			.attr({ proxyPort: '80' });

		catalina.root()
			.get('//*[local-name()="Service"]/*[local-name()="Connector"][@protocol="org.apache.coyote.http11.Http11NioProtocol"][@port="9443"]')
			.attr({ proxyPort: '443' });

		let altered = catalina.toString();

		let _altered = altered.substring(0, altered.indexOf('<Connector ')) +
			`\n<!-- ${_comment} added proxy port -->\n` +
			altered.substring(altered.indexOf('<Connector'), altered.lastIndexOf('<Connector')) +
			`\n<!-- ${_comment} added proxy port -->\n` +
			altered.substring(altered.lastIndexOf('<Connector'));

		fs.writeFileSync(path.join(p, pCatalina), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// build members element for hazelcast clustering
function buildMembers(doc) {
	let members = new libxmljs.Element(doc, 'members');

	_c.esb.forEach((v, i) => {
		let port = _config.cluster.esb.member.port + (i * 100);
		members
			.node('member')
			.node('hostName', _config.cluster.esb.member.hostname)
			.parent()
			.node('port', port.toString());
	});

	return members;
}

// build docs and additional notes
function buildESBDoc(ocli) {
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
		['esbnodeone', '0', `${_p9443}`],
		['esbnodetwo', '1', `${_p9443 + 1}`]
	);

	ocli.log('\n' + table.toString());
	ocli.log(`
NGINX configurations are generated and stored in /nginx-conf

Start the configured nodes in the following order
	01. esbnodeone
	02. esbnodetwo
`);
}
