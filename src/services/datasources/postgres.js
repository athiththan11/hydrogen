/**
 * /repository/conf/datasource/master-source.xml
 */

class Postgres {}

Postgres.changed = function () {
	return 'Changed';
};

module.exports = { Postgres };
