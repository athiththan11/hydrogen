const fs = require('fs');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

const { logger } = require('../../utils/logger');

let pMasterDatasource =
	process.cwd() + '/repository/conf/datasources/master-datasources.xml';

exports.configPostgres = async function (log, cli) {
	await parseMasterDatasource(log).then(data => {
		alterMasterDatasource(log, data).then(() => {
			cli.action.stop();
		});
	});
};

// #region master-datasource parser

async function parseMasterDatasource(log) {
	let jsonData = fs.readFileSync(pMasterDatasource, 'utf8');
	jsonData = libxmljs.parseXml(jsonData);

	return jsonData;
}

async function alterMasterDatasource(log, data) {
	let doc = new libxmljs.Document(data);
	let postgresElement = buildPostgresDatasource(doc);

	data.root()
		.get('//datasources/datasource')
		.addNextSibling(postgresElement);

	// remove xml declaration
	let config = removeDeclaration(data.toString());

	// extract postgres config
	let arr = config
		.substring(
			config.lastIndexOf('<datasource><name>WSO2_POSTGRES'),
			config.length
		)
		.split('\n');
	let postgres = arr[0];

	arr.shift();
	let leftOver = arr.join('\n');

	let altered =
		config.substring(
			0,
			config.lastIndexOf('<datasource><name>WSO2_POSTGRES')
		) +
		'\n\n\t\t<!-- HYDROGENERATED: postgres datasource added -->\n\t\t' +
		prettifyXml(postgres, { indent: 4, newline: '\n' }).replace(
			/\n/g,
			'\n\t\t'
		) +
		'\n' +
		leftOver;

	fs.writeFileSync(pMasterDatasource, altered, 'utf8');
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
		.node('name', 'jdbc/WSO2PostgresCarbonDB')
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

function removeDeclaration(xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
}
