const fs = require('fs');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

const { logger } = require('../../utils/logger');
const { parseXML } = require('../../utils/utility');

let _t = '\t\t';
let _n = '\n\n';
let _comment = 'HYDROGENERATED:';
let _description = 'postgres datasource added';
let _postgresCarbon = 'jdbc/WSO2PostgresCarbonDB';

let pMasterDatasource =
	process.cwd() + '/repository/conf/datasources/master-datasources.xml';
let pIdentity = process.cwd() + '/repository/conf/identity/identity.xml';

exports.configPostgres = async function (log, cli) {
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
	let postgresElement = buildPostgresDatasource(doc);
	let element = '<datasource><name>WSO2_POSTGRES';

	data.root()
		.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
		.addNextSibling(postgresElement);

	// remove xml declaration
	let config = removeDeclaration(data.toString());

	// extract postgres config
	let arr = config
		.substring(config.lastIndexOf(element), config.length)
		.split('\n');
	let postgres = arr[0];

	arr.shift();

	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`${_n}${_t}<!-- ${_comment} ${_description} -->\n${_t}` +
		prettifyXml(postgres, { indent: 4, newline: '\n' }).replace(
			/\n/g,
			`\n${_t}`
		) +
		'\n' +
		arr.join('\n');

	fs.writeFileSync(path, altered, 'utf8');
}

function buildPostgresDatasource(doc) {
	let postgresElement = new libxmljs.Element(doc, 'datasource');
	postgresElement
		.node('name', 'WSO2_POSTGRES_CARBON_DB')
		.parent()
		.node(
			'description',
			'The datasource used for registry and user manager'
		)
		.parent()
		.node('jndiConfig')
		.node('name', _postgresCarbon)
		.parent()
		.parent()
		.node('definition')
		.attr({ type: 'RDBMS' })
		.node('configuration')
		.node('url', 'jdbc:postgresql://localhost:5432/wso2postgres')
		.parent()
		.node('username', 'postgres')
		.parent()
		.node('password', 'hydrogen')
		.parent()
		.node('driverClassName', 'org.postgresql.Driver')
		.parent()
		.node('maxActive', '80')
		.parent()
		.node('maxWait', '60000')
		.parent()
		.node('minIdle', '5')
		.parent()
		.node('testOnBorrow', 'true')
		.parent()
		.node('validationQuery', 'SELECT 1; COMMIT')
		.parent()
		.node('validationInterval', '30000')
		.parent()
		.node('defaultAutoCommit', 'true');

	return postgresElement;
}

// #endregion

// #region identity

async function alterIdentity(log, data, path) {
	let doc = new libxmljs.Document(data);
	let postgresElement = buildIdentity(doc);
	let element = `<Name>${_postgresCarbon}`;

	data.root()
		.get(
			'//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]'
		)
		.replace(postgresElement);

	let config = data.toString();

	// replace utf encoding with latin1
	config = config.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

	// extract postgres config
	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`\n${_t}\t<!-- ${_comment} ${_description}. changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
		config.substring(config.lastIndexOf(element)) +
		'\n\n';

	fs.writeFileSync(path, altered, 'latin1');
}

function buildIdentity(doc) {
	let postgresElement = new libxmljs.Element(doc, 'Name', _postgresCarbon);

	return postgresElement;
}

// #endregion

function removeDeclaration(xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
}
