const fs = require('fs');
const libxmljs = require('libxmljs');
const path = require('path');
const prettify = require('prettify-xml');

const { cli } = require('cli-ux');
const { parseXML, removeDeclaration } = require('../../utils/utility');

let _p = process.cwd();
let pMasterDatasource = '/repository/conf/datasources/master-datasources.xml';
let pIdentity = '/repository/conf/identity/identity.xml';
let pRegistry = '/repository/conf/registry.xml';

let _comment = 'HYDROGENERATED:';
let _n = '\n\n';
let _t = '\t\t';
let _utf8 = 'utf8';

exports.configureDatasource = async function (ocli, args, product, database) {
	ocli.log('\n');
	if (product === 'is') {
		cli.action.start('altering master-datasources.xml');
		alterMasterDatasource(ocli, args).then(() => {
			cli.action.stop();
		}).then(() => {
			cli.action.start('altering identity.xml');
			alterIdentity(ocli, args._jndiName);
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			cli.action.start('altering registry.xml');
			alterRegistry(ocli, args);
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			buildISDoc(ocli, database, args);
		});
	}
	if (product === 'am') {
		cli.action.start('altering master-datasources.xml');
		alterAMMasterDatasource(ocli, args).then(() => {
			cli.action.stop();
		}).then(() => {
			buildAMDoc(ocli, database, args);
		});
	}
};

// #region apim datasource implementations

async function alterAMMasterDatasource(ocli, args) {
	await parseXML(null, path.join(_p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let genericElement = buildDatasource(doc, args);

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
			altered.substring(altered.indexOf('<datasource><name>WSO2AM_DB</name>'), altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length) +
			altered.substring(altered.indexOf('</definition></datasource>') + '</definition></datasource>'.length, altered.length);

		fs.writeFileSync(path.join(_p, pMasterDatasource), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// alter master-datasource configurations
async function alterMasterDatasource(ocli, args) {
	await parseXML(null, path.join(_p, pMasterDatasource)).then(master => {
		let doc = new libxmljs.Document(master);
		let elem = '<datasource><name>' + args._name;

		let datasourceElement = buildDatasource(doc, args);

		master.root()
			.get('//*[local-name()="datasources"]/*[local-name()="datasource"]')
			.addNextSibling(datasourceElement);

		// remove xml declaration
		let altered = removeDeclaration(master.toString());

		// extract generic altered
		let arr = altered
			.substring(altered.lastIndexOf(elem), altered.length)
			.split('\n');

		let generic = arr[0];
		arr.shift();

		let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
			`${_n}<!-- ${_comment} datasource added & replaced -->\n` +
			generic + '\n' +
			arr.join('\n');

		fs.writeFileSync(path.join(_p, pMasterDatasource), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// build datasource element for master-datasource configurations
function buildDatasource(doc, args) {
	let datasource = new libxmljs.Element(doc, 'datasource');
	datasource
		.node('name', args._name)
		.parent()
		.node('description', args._description)
		.parent()
		.node('jndiConfig')
		.node('name', args._jndiName)
		.parent()
		.parent()
		.node('definition')
		.attr({ type: 'RDBMS' })
		.node('configuration')
		.node('url', args._connectionUrl)
		.parent()
		.node('username', args._username)
		.parent()
		.node('password', args._password)
		.parent()
		.node('driverClassName', args._driver)
		.parent()
		.node('maxActive', args._maxActive)
		.parent()
		.node('maxWait', args._maxWait)
		.parent()
		.node('minIdle', args._minIdle)
		.parent()
		.node('testOnBorrow', args._testOnBorrow)
		.parent()
		.node('validationQuery', args._validationQuery)
		.parent()
		.node('validationInterval', args._validationInterval)
		.parent()
		.node('defaultAutoCommit', args._defaultAutoCommit);

	return datasource;
}

// alter identity.xml configuration
async function alterIdentity(ocli, jndiName) {
	await parseXML(null, path.join(_p, pIdentity)).then(identity => {
		let doc = new libxmljs.Document(identity);
		let elem = `<Name>${jndiName}`;

		let nameElement = new libxmljs.Element(doc, 'Name', jndiName);

		identity.root()
			.get('//*[local-name()="JDBCPersistenceManager"]/*[local-name()="DataSource"]/*[local-name()="Name"]')
			.replace(nameElement);

		let altered = identity.toString();

		// replace utf encoding with latin1
		altered = altered.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

		// extract generic config
		let _altered = altered.substring(0, altered.lastIndexOf(elem)) +
			`\n${_t}\t<!-- ${_comment} datasource added & changed jdbc/WSO2CarbonDB -->\n${_t}\t` +
			altered.substring(altered.lastIndexOf(elem));

		fs.writeFileSync(path.join(_p, pIdentity), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// alter registry.xml configurations
async function alterRegistry(ocli, args) {
	await parseXML(null, path.join(_p, pRegistry)).then(registry => {
		let doc = new libxmljs.Document(registry);
		let registryElems = buildRegistry(doc, args);

		registry.root()
			.get('//*[local-name()="dbConfig"][@name="wso2registry"]')
			.addNextSibling(registryElems.shift());

		registry.root()
			.get('//*[local-name()="dbConfig"][2]')
			.addNextSibling(registryElems.shift());

		registry.root()
			.get('//*[local-name()="remoteInstance"]')
			.addNextSibling(registryElems.shift());

		registry.root()
			.get('//*[local-name()="mount"]')
			.addNextSibling(registryElems.shift());

		let altered = registry.toString();
		altered = altered.replace('encoding="UTF-8"', 'encoding="ISO-8859-1"');

		let _altered = altered.substring(0, altered.indexOf('<dbConfig name="govregistry">')) +
			`${_n}<!-- ${_comment} registry mounted -->\n` +
			altered.substring(altered.indexOf('<dbConfig name="govregistry">'));

		fs.writeFileSync(path.join(_p, pRegistry), prettify(_altered, { indent: 4 }) + '\n', _utf8);
	});
}

// build registry elements
function buildRegistry(doc, args) {
	let dbConfig = new libxmljs.Element(doc, 'dbConfig').attr({ name: 'govregistry' });
	dbConfig
		.node('dataSource', args._jndiName);

	let remoteInstance = new libxmljs.Element(doc, 'remoteInstance').attr({ url: 'https://localhost:9443/registry' });
	remoteInstance
		.node('id', 'gov')
		.parent()
		.node('cacheId', `${args._username}@${args._connectionUrl}`)
		.parent()
		.node('dbConfig', 'govregistry')
		.parent()
		.node('readOnly', 'false')
		.parent()
		.node('enableCache', 'true')
		.parent()
		.node('registryRoot', '/');

	let mountGov = new libxmljs.Element(doc, 'mount').attr({ path: '/_system/governance', overwrite: 'true' });
	mountGov
		.node('instanceId', 'gov')
		.parent()
		.node('targetPath', '/_system/governance');

	let mountConf = new libxmljs.Element(doc, 'mount').attr({ path: '/_system/config', overwrite: 'true' });
	mountConf
		.node('instanceId', 'gov')
		.parent()
		.node('targetPath', '/_system/config');

	return [dbConfig, remoteInstance, mountGov, mountConf];
}

function buildISDoc(ocli, database, args) {
	ocli.log('\n');
	buildDriverDoc(ocli, database);

	ocli.log(`\nADDITION: To change the user-store from LDAP to JDBC, do the following
	* Navigate to /repository/conf/user-mgt.xml and change the dataSource property from 'jdbc/WSO2CarbonDB' to '${args._jndiName}'
	* Uncomment the JDBC User Store Manager configurations and comment the LDAP configurations
	`);
}

// build docs and additional notes
function buildAMDoc(ocli, database, args) {
	ocli.log('\n');
	buildDriverDoc(ocli, database);

	ocli.log('\n');

	// ocli.log(`\nADDITION: To change the user-store from LDAP to JDBC, do the following
	// * Navigate to /repository/conf/user-mgt.xml and change the dataSource property from 'jdbc/WSO2CarbonDB' to '${args._jndiName}'
	// * Uncomment the JDBC User Store Manager configurations and comment the LDAP configurations
	// `);
}

function buildDriverDoc(ocli, database) {
	if (database === 'postgres') {
		ocli.log('NOTE: Download the Postgres JDBC Driver and place it inside /repository/components/lib folder.');
		cli.url('Postgres JDBC Driver', 'https://jdbc.postgresql.org/');
		// cli.open('https://jdbc.postgresql.org/').catch(error => {
		// 	logger.error(error);
		// });
	}
	if (database === 'mysql') {
		ocli.log('NOTE: Download the MySQL JDBC Driver and place it inside /repository/components/lib folder.');
		cli.url('MySQL JDBC Driver', 'https://www.mysql.com/products/connector/');
		// cli.open('https://www.mysql.com/products/connector/').catch(error => {
		// 	logger.error(error);
		// });
	}
	if (database === 'oracle') {
		ocli.log('NOTE: Download the Oracle JDBC Driver and place it inside /repository/components/lib folder.');
		cli.url('Oracle JDBC Driver', 'https://www.oracle.com/technetwork/database/application-development/jdbc/downloads/index.html');
		// cli.open('https://www.oracle.com/technetwork/database/application-development/jdbc/downloads/index.html').catch(error => {
		// 	logger.error(error);
		// });
	}
	if (database === 'mssql') {
		ocli.log('NOTE: Download the MSQQL JDBC Driver and place it inside /repository/components/lib folder.');
		cli.url('MSSQL JDBC Driver', 'https://docs.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server?view=sql-server-2017');
		// cli.open('https://docs.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server?view=sql-server-2017').catch(error => {
		// 	logger.error(error);
		// });
	}
}

exports.buildDriverDoc = buildDriverDoc;
