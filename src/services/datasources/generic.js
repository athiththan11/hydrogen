const fs = require('fs');
const libxmljs = require('libxmljs');
const prettifyXml = require('prettify-xml');

const { logger } = require('../../utils/logger');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let pMasterDatasource =
	process.cwd() + '/repository/conf/datasources/master-datasources.xml';
let pIdentity = process.cwd() + '/repository/conf/identity/identity.xml';

let _ = 'Generic';
let _carbon = 'jdbc/WSO2' + _ + 'CarbonDB';
let _comment = 'HYDROGENERATED:';
let _connectionUrl = '{specify connection url}';
let _defaultAutoCommit = 'false';
let _description = _.toLowerCase() + ' datasource added';
let _driver = '{specify jdbc driver}';
let _maxActive = '80';
let _maxWait = '60000';
let _minIdle = '5';
let _n = '\n\n';
let _t = '\t\t';
let _testOnBorrow = 'true';
let _username = _.toLowerCase();
let _utf8 = 'utf8';
let _validationInterval = '30000';
let _validationQuery = 'SELECT 1';

exports.configureDatasource = async function (log, cli, args) {
	// variable set
	_ = args._ ? args._ : _;

	_carbon = 'jdbc/WSO2' + _ + 'CarbonDB';
	_description = _.toLowerCase() + ' datasource added';
	_username = _.toLowerCase();

	_carbon = args._carbon ? args._carbon : _carbon;
	_comment = args._comment ? args._comment : _comment;
	_connectionUrl = args._connectionUrl ? args._connectionUrl : _connectionUrl;
	_defaultAutoCommit = args._defaultAutoCommit ? args._defaultAutoCommit : _defaultAutoCommit;
	_description = args._description ? args._description : _description;
	_driver = args._driver ? args._driver : _driver;
	_maxActive = args._maxActive ? args._maxActive : _maxActive;
	_maxWait = args._maxWait ? args._maxWait : _maxWait;
	_minIdle = args._minIdle ? args._minIdle : _minIdle;
	_n = args._n ? args._n : _n;
	_t = args._t ? args._t : _t;
	_testOnBorrow = args._testOnBorrow ? args._testOnBorrow : _testOnBorrow;
	_username = args._username ? args._username : _username;
	_validationInterval = args._validationInterval ? args._validationInterval : _validationInterval;
	_validationQuery = args._validationQuery ? args._validationQuery : _validationQuery;

	cli.action.start('\taltering master-datasources.xml');
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
	let genericElement = buildGenericDatasource(doc);
	let element = '<datasource><name>WSO2_' + _.toUpperCase();

	data.root()
		.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
		.addNextSibling(genericElement);

	// remove xml declaration
	let config = removeDeclaration(data.toString());

	// extract generic config
	let arr = config
		.substring(config.lastIndexOf(element), config.length)
		.split('\n');
	let generic = arr[0];

	arr.shift();

	let altered =
		config.substring(0, config.lastIndexOf(element)) +
		`${_n}${_t}<!-- ${_comment} ${_description} -->\n${_t}` +
		prettifyXml(generic, { indent: 4, newline: '\n' }).replace(
			/\n/g,
			`\n${_t}`
		) +
		'\n' +
		arr.join('\n');

	fs.writeFileSync(path, altered, _utf8);
}

function buildGenericDatasource(doc) {
	let genericElement = new libxmljs.Element(doc, 'datasource');
	genericElement
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
		.node('maxActive', _maxActive)
		.parent()
		.node('maxWait', _maxWait)
		.parent()
		.node('minIdle', _minIdle)
		.parent()
		.node('testOnBorrow', _testOnBorrow)
		.parent()
		.node('validationQuery', _validationQuery)
		.parent()
		.node('validationInterval', _validationInterval)
		.parent()
		.node('defaultAutoCommit', _defaultAutoCommit);

	return genericElement;
}

// #endregion

// #region identity

async function alterIdentity(log, data, path) {
	let doc = new libxmljs.Document(data);
	let genericElement = buildIdentity(doc);
	let element = `<Name>${_carbon}`;

	data.root()
		.get(
			'//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]'
		)
		.replace(genericElement);

	let config = data.toString();

	// replace utf encoding with latin1
	config = config.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

	// extract generic config
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
