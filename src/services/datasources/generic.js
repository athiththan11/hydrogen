const fs = require('fs');
const libxmljs = require('libxmljs');
const prettify = require('prettify-xml');
const { cli } = require('cli-ux');

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

exports.configureDatasource = async function (ocli, args) {
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
	await parseXML(ocli, pMasterDatasource).then(master => {
		alterMasterDatasource(ocli, master, pMasterDatasource).then(() => {
			cli.action.stop();
			cli.action.start('\taltering identity.xml');

			parseXML(ocli, pIdentity).then(identity => {
				alterIdentity(ocli, identity, pIdentity).then(() => {
					cli.action.stop();
				});
			});
		});
	});
};

// #region master-datasource parser

async function alterMasterDatasource(ocli, data, path) {
	let doc = new libxmljs.Document(data);
	let elem = '<datasource><name>WSO2_' + _.toUpperCase();

	let genericElement = buildGenericDatasource(doc);

	data.root()
		.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
		.addNextSibling(genericElement);

	// remove xml declaration
	let altered = removeDeclaration(data.toString());

	// extract generic altered
	let arr = altered
		.substring(altered.lastIndexOf(elem), altered.length)
		.split('\n');
	let generic = arr[0];
	arr.shift();

	let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
		`${_n}${_t}<!-- ${_comment} ${_description} -->\n${_t}` +
		prettify(generic, { indent: 4 }) + '\n' +
		arr.join('\n');

	fs.writeFileSync(path, prettify(_altered, { indent: 4 }) + '\n', _utf8);
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

async function alterIdentity(ocli, data, path) {
	let doc = new libxmljs.Document(data);
	let elem = `<Name>${_carbon}`;

	let genericElement = buildIdentity(doc);

	data.root()
		.get('//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]')
		.replace(genericElement);

	let altered = data.toString();

	// replace utf encoding with latin1
	altered = altered.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

	// extract generic config
	let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
		`\n${_t}\t<!-- ${_comment} ${_description}. changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
		altered.substring(altered.lastIndexOf(elem)) +
		'\n\n';

	fs.writeFileSync(path, prettify(_altered, { indent: 4 }) + '\n', _utf8);
}

function buildIdentity(doc) {
	return new libxmljs.Element(doc, 'Name', _carbon);
}

// #endregion
