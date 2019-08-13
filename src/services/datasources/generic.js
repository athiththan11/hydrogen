const fs = require('fs');
const libxmljs = require('libxmljs');
const path = require('path');
const prettify = require('prettify-xml');
const { cli } = require('cli-ux');

const { logger } = require('../../utils/logger');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let _p = process.cwd();
let pMasterDatasource = '/repository/conf/datasources/master-datasources.xml';
let pIdentity = '/repository/conf/identity/identity.xml';

let _ = 'GenericCarbonDB';
let _name = 'Generic_Carbon_DB';
let _carbon = 'jdbc/WSO2' + _;
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

exports.configureDatasource = async function (ocli, args, product) {
	// variable set
	_ = args._ ? args._ : _;

	_carbon = 'jdbc/WSO2' + _;
	_description = _.toLowerCase() + ' datasource added';
	_username = _.toLowerCase();

	_name = args._name ? args._name : _name;
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

	if (product === 'is') {
		cli.action.start('\taltering master-datasources.xml');
		alterMasterDatasource(ocli).then(() => {
			cli.action.stop();
		}).then(() => {
			cli.action.start('\taltering identity.xml');
			alterIdentity(ocli);
		}).then(() => {
			cli.action.stop();
		});
	} else if (product === 'am') {
		cli.action.start('\taltering master-datasources.xml');
		alterAMMasterDatasource(ocli, _p).then(() => {
			cli.action.stop();
		});
	}
};

// #region apim datasource implementations

async function alterAMMasterDatasource(ocli, p) {
	await parseXML(null, path.join(p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let genericElement = buildAMDatasource(doc);

		let amElement = master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]');

		let commentElement = new libxmljs.Comment(doc, amElement.toString());

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]')
			.addNextSibling(genericElement);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"][1]')
			.remove();

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"][name="WSO2AM_DB"]')
			.addPrevSibling(commentElement);

		let altered = removeDeclaration(master.toString());

		let _altered = altered.substring(0, altered.indexOf('<datasource><name>WSO2AM_DB</name>')) +
			`${_n}<!-- ${_comment} datasource added -->\n` +
			prettify(altered.substring(altered.indexOf('<datasource><name>WSO2AM_DB</name>'), altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length), { indent: 4 }) +
			altered.substring(altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length, altered.length);

		fs.writeFileSync(path.join(p, pMasterDatasource), _altered, _utf8);
	});
}

function buildAMDatasource(doc) {
	let genericElement = new libxmljs.Element(doc, 'datasource');
	genericElement
		.node('name', 'WSO2AM_DB')
		.parent()
		.node('description', 'The datasource used for API Manager database')
		.parent()
		.node('jndiConfig')
		.node('name', 'WSO2AM_DB')
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

// #region is datasource implementation

// #region master-datasource parser

async function alterMasterDatasource(ocli) {
	await parseXML(null, path.join(_p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let elem = '<datasource><name>WSO2_' + _name.toUpperCase();

		let genericElement = buildGenericDatasource(doc);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
			.addNextSibling(genericElement);

		// remove xml declaration
		let altered = removeDeclaration(master.toString());

		// extract generic altered
		let arr = altered
			.substring(altered.lastIndexOf(elem), altered.length)
			.split('\n');

		let generic = arr[0];
		arr.shift();

		let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
			`${_n}<!-- ${_comment} ${_description} -->\n` +
			prettify(generic, { indent: 4 }) + '\n' +
			arr.join('\n');

		fs.writeFileSync(path.join(_p, pMasterDatasource), _altered, _utf8);
	});
}

function buildGenericDatasource(doc) {
	let genericElement = new libxmljs.Element(doc, 'datasource');
	genericElement
		.node('name', `WSO2_${_name.toUpperCase()}`)
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

async function alterIdentity(ocli) {
	await parseXML(null, path.join(_p, pIdentity)).then(identity => {
		let doc = new libxmljs.Document(identity);
		let elem = `<Name>${_carbon}`;

		let genericElement = new libxmljs.Element(doc, 'Name', _carbon);

		identity.root()
			.get('//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]')
			.replace(genericElement);

		let altered = identity.toString();

		// replace utf encoding with latin1
		altered = altered.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

		// extract generic config
		let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
			`\n${_t}\t<!-- ${_comment} ${_description}. changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
			altered.substring(altered.lastIndexOf(elem));

		fs.writeFileSync(path.join(_p, pIdentity), _altered, _utf8);
	});
}

// #endregion
