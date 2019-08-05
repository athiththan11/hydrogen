const fs = require('fs');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

const { logger } = require('../../utils/logger');
const { parseXML } = require('../../utils/utility');

let _t = '\t\t';
let _n = '\n\n';
let _comment = 'HYDROGENERATED:';
let _description = 'mysql datasource added';
let _mysqlCarbon = 'jdbc/WSO2MySQLCarbonDB';

let pMasterDatasource =
	process.cwd() + '/repository/conf/datasources/master-datasources.xml';
let pIdentity = process.cwd() + '/repository/conf/identity/identity.xml';

exports.configMySQL = async function (log, cli) {
	await parseXML(log, pMasterDatasource).then(master => {
		alterMasterDatasource(log, master, pMasterDatasource).then(() => {
			cli.action.stop();
			cli.action.start('\taltering identity.xml');

			parseXML(log, pIdentity).then(identity => {
				alterIdentity(log, identity, pIdentity).then(() => {
					cli.action.stop();
				});
			});
		});
	});
};

// #region master-datasource parser

async function alterMasterDatasource(log, data, path) {
	let doc = new libxmljs.Document(data);
	let mysqlElement = buildMySQLDatasource(doc);
	let element = '<datasource><name>WSO2_MYSQL';

	data.root()
		.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
		.addNextSibling(mysqlElement);

	// remove xml declaration
	let config = removeDeclaration(data.toString());

	// extract mysql config
	let arr = config
		.substring(config.lastIndexOf(element), config.length)
		.split('\n');
	let mysql = arr[0];

	arr.shift();

	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`${_n}${_t}<!-- ${_comment} ${_description} -->\n${_t}` +
		prettifyXml(mysql, { indent: 4, newline: '\n' }).replace(
			/\n/g,
			`\n${_t}`
		) +
		'\n' +
		arr.join('\n');

	fs.writeFileSync(path, altered, 'utf8');
}

function buildMySQLDatasource(doc) {
	let mysqlElement = new libxmljs.Element(doc, 'datasource');
	mysqlElement
		.node('name', 'WSO2_MYSQL_CARBON_DB')
		.parent()
		.node(
			'description',
			'The datasource used for registry and user manager'
		)
		.parent()
		.node('jndiConfig')
		.node('name', _mysqlCarbon)
		.parent()
		.parent()
		.node('definition')
		.attr({ type: 'RDBMS' })
		.node('configuration')
		.node('url', 'jdbc:mysql://localhost:3306/wso2mysql')
		.parent()
		.node('username', 'mysql')
		.parent()
		.node('password', 'hydrogen')
		.parent()
		.node('driverClassName', 'com.mysql.jdbc.Driver')
		.parent()
		.node('maxActive', '80')
		.parent()
		.node('maxWait', '60000')
		.parent()
		.node('minIdle', '5')
		.parent()
		.node('testOnBorrow', 'true')
		.parent()
		.node('validationQuery', 'SELECT 1')
		.parent()
		.node('validationInterval', '30000')
		.parent()
		.node('defaultAutoCommit', 'false');

	return mysqlElement;
}

// #endregion

// #region identity

async function alterIdentity(log, data, path) {
	let doc = new libxmljs.Document(data);
	let mysqlElement = buildIdentity(doc);
	let element = `<Name>${_mysqlCarbon}`;

	data.root()
		.get(
			'//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]'
		)
		.replace(mysqlElement);

	let config = data.toString();

	// replace utf encoding with latin1
	config = config.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

	// extract mysql config
	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`\n${_t}\t<!-- ${_comment} ${_description}. changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
		config.substring(config.lastIndexOf(element)) +
		'\n\n';

	fs.writeFileSync(path, altered, 'latin1');
}

function buildIdentity(doc) {
	let mysqlElement = new libxmljs.Element(doc, 'Name', _mysqlCarbon);

	return mysqlElement;
}

// #endregion

function removeDeclaration(xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
}
