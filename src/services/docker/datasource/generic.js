const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const Chance = require('chance');
const { Client } = require('pg');
const { createdb } = require('pgtools');
const { cli } = require('cli-ux');

const { logger } = require('../../../utils/logger');

let _confs = {
	postgres: {
		name: 'hydrogen-postgres',
		image: 'postgres',
		tag: '9.6.14',
		envs: [
			'POSTGRES_PASSWORD=hydrogen',
		],
		ports: {
			'5432/tcp': {},
		},
		host: {
			PortBindings: {
				'5432/tcp': [
					{
						HostPort: '5432',
					},
				],
			},
		},
	},
	mysql: {
		name: 'hydrogen-mysql',
		image: 'mysql',
		tag: '8.0',
		envs: [
			'MYSQL_PASSWORD=hydrogen',
			'MYSQL_ROOT_PASSWORD=hydrogen',
		],
		ports: {
			'3306/tcp': {},
		},
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

let pConsent = '/dbscripts/consent';
let pDBScripts = '/dbscripts';
let pIdentity = '/dbscripts/identity';
let pStoredProcedure = '/dbscripts/identity/stored-procedures';
let pUma = '/dbscripts/identity/uma';

let pPostgres = 'postgresql.sql';
let pMySQL = 'mysql.sql';

exports.buildContainer = async function (ocli, database, opts) {
	if (database === 'postgres') {
		await buildPostgresContainer(ocli, opts);
	}
	if (database === 'mysql') {
		await buildMySQLContainer(ocli, opts);
	}
};

// build postgres container
async function buildPostgresContainer(ocli, opts) {
	let instance = new Docker();
	let chance = new Chance().animal().replace(/[^a-zA-Z]/g, '');

	instance.pull(`${_confs.postgres.image}:${_confs.postgres.tag}`, (err, stream) => {
		if (!err)
			instance.modem.followProgress(stream, onFinished, onProgress);

		function onFinished(err, output) {
			if (!err) {
				cli.action.stop();
				instance.createContainer({
					Image: _confs.postgres.image + ':' + _confs.postgres.tag,
					name: chance,
					Env: _confs.postgres.envs,
					ExposedPorts: _confs.postgres.ports,
					HostConfig: _confs.postgres.host,
				}).then(container => {
					ocli.log(`
A Docker container has been created for Postgres datasource : ${chance}`);
					container.start().then(() => {
						if (opts.generate) {
							cli.action.start('executing database scripts');
							executePostgresScripts(ocli);
						}
					});
				});
			}
		}
		function onProgress(event) {
			cli.action.start('pulling docker image');
		}
	});
}

// build mysql container
async function buildMySQLContainer(ocli, opts) {
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
				}).then(container => {
					ocli.log(`
A Docker container has been created for MySQL datasource : ${chance}`);
					return container.start();
				});
			}
		}
		function onProgress(event) {
			cli.action.start('pulling docker image');
		}
	});
}

async function executePostgresScripts(ocli) {
	let config = {
		user: 'postgres',
		password: 'hydrogen',
		host: 'localhost',
		port: '5432',
	};

	let script = await readScripts('postgre', pPostgres);

	setTimeout(() => {
		createdb(config, 'wso2postgres').then(() => {
			config.database = 'wso2postgres';
			const client = new Client(config);
			client.connect();

			client.query(script, (err, res) => {
				if (err) {
					ocli.log('Something went wrong while executing DB scripts');
					logger.error(err);
				}

				client.end();
			});
		}).then(() => {
			cli.action.stop();
		}).catch(error => {
			ocli.log(error);
		});
	}, 5000);
}

async function readScripts(sp, db) {
	let scripts = [];
	scripts[0] = fs.readFileSync(path.join(process.cwd(), pDBScripts, db)).toString();
	scripts[1] = fs.readFileSync(path.join(process.cwd(), pIdentity, db)).toString();
	scripts[2] = fs.readFileSync(path.join(process.cwd(), pStoredProcedure, sp, db)).toString();
	scripts[3] = fs.readFileSync(path.join(process.cwd(), pUma, db)).toString();
	scripts[4] = fs.readFileSync(path.join(process.cwd(), pConsent, db)).toString();

	return scripts.join('\n');
}
