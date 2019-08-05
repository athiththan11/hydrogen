const fs = require('fs');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

const { logger } = require('../../utils/logger');
const { parseXML } = require('../../utils/utility');

let pMasterDatasource =
	process.cwd() + '/repository/conf/datasources/master-datasources.xml';
let pIdentity = process.cwd() + '/repository/conf/identity/identity.xml';

let _ = 'Generic';
let _t = '\t\t';
let _n = '\n\n';
let _comment = 'HYDROGENERATED:';
let _description = _.toLowerCase() + ' datasource added';
let _carbon = 'jdbc/WSO2' + _ + 'CarbonDB';
let _connectionUrl = '{specify connection url}';
let _username = _.toLowerCase();
let _driver = '{specify jdbc driver}';
let _validationQuery = 'SELECT 1';
let _defaultAutoCommit = 'false';

exports.configureDatasource = async function (log, cli, args) {
	// variable set
	_ = args._ ? args._ : _;

	_description = _.toLowerCase() + ' datasource added';
	_carbon = 'jdbc/WSO2' + _ + 'CarbonDB';
	_username = _.toLowerCase();

	_t = args._t ? args._t : _t;
	_n = args._n ? args._n : _n;
	_comment = args._comment ? args._comment : _comment;
	_description = args._description ? args._description : _description;
	_carbon = args._carbon ? args._carbon : _carbon;
	_connectionUrl = args._connectionUrl ? args._connectionUrl : _connectionUrl;
	_username = args._username ? args._username : _username;
	_driver = args._driver ? args._driver : _driver;
	_validationQuery = args._validationQuery ? args._validationQuery : _validationQuery;
	_defaultAutoCommit = args._defaultAutoCommit ? args._defaultAutoCommit : _defaultAutoCommit;

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
	let oracleElement = buildOracleDatasource(doc);
	let element = '<datasource><name>WSO2_' + _.toUpperCase();

	data.root()
		.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
		.addNextSibling(oracleElement);

	// remove xml declaration
	let config = removeDeclaration(data.toString());

	// extract oracle config
	let arr = config
		.substring(config.lastIndexOf(element), config.length)
		.split('\n');
	let oracle = arr[0];

	arr.shift();

	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`${_n}${_t}<!-- ${_comment} ${_description} -->\n${_t}` +
		prettifyXml(oracle, { indent: 4, newline: '\n' }).replace(
			/\n/g,
			`\n${_t}`
		) +
		'\n' +
		arr.join('\n');

	fs.writeFileSync(path, altered, 'utf8');
}

function buildOracleDatasource(doc) {
	let oracleElement = new libxmljs.Element(doc, 'datasource');
	oracleElement
		.node('name', `WSO2_${_.toUpperCase()}_CARBON_DB`)
		.parent()
		.node(
			'description',
			'The datasource used for registry and user manager'
		)
		.parent()
		.node('jndiConfig')
		.node('name', _carbon)
		.parent()
		.parent()
		.node('definition')
		.attr({ type: 'RDBMS' })
		.node('configuration')
		.node('url', _connectionUrl)
		.parent()
		.node('username', _username)
		.parent()
		.node('password', 'hydrogen')
		.parent()
		.node('driverClassName', _driver)
		.parent()
		.node('maxActive', '80')
		.parent()
		.node('maxWait', '60000')
		.parent()
		.node('minIdle', '5')
		.parent()
		.node('testOnBorrow', 'true')
		.parent()
		.node('validationQuery', _validationQuery)
		.parent()
		.node('validationInterval', '30000')
		.parent()
		.node('defaultAutoCommit', _defaultAutoCommit);

	return oracleElement;
}

// #endregion

// #region identity

async function alterIdentity(log, data, path) {
	let doc = new libxmljs.Document(data);
	let oracleElement = buildIdentity(doc);
	let element = `<Name>${_carbon}`;

	data.root()
		.get(
			'//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]'
		)
		.replace(oracleElement);

	let config = data.toString();

	// replace utf encoding with latin1
	config = config.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

	// extract oracle config
	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`\n${_t}\t<!-- ${_comment} ${_description}. changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
		config.substring(config.lastIndexOf(element)) +
		'\n\n';

	fs.writeFileSync(path, altered, 'latin1');
}

function buildIdentity(doc) {
	return new libxmljs.Element(doc, 'Name', _carbon);
}

// #endregion

function removeDeclaration(xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
}
