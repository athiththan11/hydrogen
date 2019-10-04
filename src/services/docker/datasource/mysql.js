const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const Chance = require('chance');
const Client = require('mysql');
const execsql = require('execsql');
const { cli } = require('cli-ux');

const { logger } = require('../../../utils/logger');

let _confs = {
	mysql: {
		name: 'hydrogen-mysql',
		image: 'mysql',
		tag: '8.0',
		envs: [
			'MYSQL_USER=mysql',
			'MYSQL_PASSWORD=hydrogen',
			'MYSQL_ROOT_PASSWORD=hydrogen',
		],
		ports: {
			'3306/tcp': {},
		},
		cmd: ['--default-authentication-plugin=mysql_native_password'],
		host: {
			PortBindings: {
				'3306/tcp': [
					{
						HostPort: '3306',
					},
				],
			},
		},
	},
};

let pMysql = 'mysql.sql';

// build postgres container
exports.buildMySQLContainer = async function (ocli, paths, product, opts) {
	let instance = new Docker();
	let chance = new Chance().animal().replace(/[^a-zA-Z]/g, '');

	instance.pull(`${_confs.mysql.image}:${_confs.mysql.tag}`, (err, stream) => {
		if (!err)
			instance.modem.followProgress(stream, onFinished, onProgress);

		function onFinished(err, output) {
			if (!err) {
				cli.action.stop();
				instance.createContainer({
					Image: _confs.mysql.image + ':' + _confs.mysql.tag,
					name: chance,
					Env: _confs.mysql.envs,
					ExposedPorts: _confs.mysql.ports,
					HostConfig: _confs.mysql.host,
					Cmd: _confs.mysql.cmd,
				}).then(container => {
					ocli.log(`
A Docker container has been created for MySQL datasource : ${chance}`);
					container.start().then(() => {
						if (opts.generate) {
							cli.action.start('executing database scripts');
							executeMySQLScripts(ocli, product, paths);
						}
					});
				});
			}
		}
		function onProgress(event) {
			cli.action.start('pulling docker image');
		}
	});
};

async function executeMySQLScripts(ocli, product, paths) {
	let config = {
		user: 'root',
		password: 'hydrogen',
		host: 'localhost',
		port: '3306',
		insecureAuth: true,
		multipleStatements: true,
	};

	let script = await readScripts('mysql', pMysql, product, paths);

	setTimeout(() => {
		let client = Client.createConnection(config);
		client.connect(err => {
			if (err) {
				ocli.log('Something went wrong while connecting to MySQL');
				return logger.error(err);
			}
			client.query('create database wso2mysql charset latin1 collate latin1_swedish_ci', (err, res) => {
				if (err) {
					ocli.log('Something went wrong while creating database');
					return logger.error(err);
				}
				config.database = 'wso2mysql';
				const newClient = Client.createConnection(config);

				newClient.query(script, (err, res) => {
					if (err) {
						ocli.log('Something went wrong while executing DB scripts');
						logger.error(err);
					}

					newClient.end();
					client.end();
					cli.action.stop();
				});
			});

			client.query(`grant all on ${'wso2mysql'}.* to '${'mysql'}'@'%'; FLUSH PRIVILEGES;`);
		});
	}, 20000);
}

async function readScripts(sp, db, product, paths) {
	let scripts = [];

	if (product === 'is') {
		scripts[0] = 'SET SQL_MODE=\'ALLOW_INVALID_DATES\';';
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.is.pDBScripts, db)).toString();
		scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.is.pIdentity, db)).toString();
		// scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.is.pStoredProcedure, sp, 'oauth2-token-cleanup.sql')).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.is.pUma, db)).toString();
		scripts[4] = fs.readFileSync(path.join(process.cwd(), paths.is.pConsent, db)).toString();
	}

	if (product === 'am') {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.am.pApimgt, db)).toString();
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.am.pMBStore, 'postgresql-mb.sql')).toString();
	}

	return scripts.join('');
}