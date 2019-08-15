<h1 align='center'>hydrogen</h1>

<p align='center'>An interactive CLI tool for WSO2 Servers</p>

<br>

<br>

<p align="center">
  <img width="200" src="src/img/hydrogen.png">
</p>

<br>

<br>

[![CircleCI](https://circleci.com/gh/athiththan11/hydrogen.svg?style=svg&circle-token=bf27e3287ab3c738b05245a3e62f57b965929aa1)](https://circleci.com/gh/athiththan11/hydrogen)	[![codecov](https://codecov.io/gh/athiththan11/hydrogen/branch/master/graph/badge.svg?token=hW0h8hmvra)](https://codecov.io/gh/athiththan11/hydrogen)

[:construction: Work In Progress]

## Commands

Below listed are the available commands and descriptions of `hydrogen`.

### Datasource

```shell
Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors

USAGE
  $ hydrogen [COMMAND]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 products based on your preference.

  List all available distribute commands using
  $ hydrogen datasource --help

EXAMPLE
  $ hydrogen datasource:is [FLAGS] [ARGS]

COMMANDS
  datasource:am  Alter datasources of WSO2 APIM products (fresh-pack) with supported datasource models
  datasource:is  Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models
```

#### datasource:am

```shell
Alter datasources of WSO2 APIM products (fresh-pack) with supported datasource models

USAGE
  $ hydrogen datasource:am [FLAGS] [ARGS]

OPTIONS
  -R, --replace                           replace h2 datasource
  -d, --datasource=postgres|mysql|oracle  (required) datasource type
  -v, --version=2.6                       (required) [default: 2.6] product version. supported versions are [apim >= 2.6]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 APIM products based on your preference.

  As of now, Hydrogen only supports replacing the default H2 datasource with a variety
  of available datasource models. To replace the default shipped H2 datasource,
  use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).

EXAMPLES
  Replace H2 with Postgres
  $ hydrogen datasource:am -R -v 2.6 -d postgres
  Replace H2 with MySQL
  $ hydrogen datasource:am -R -v 2.6 -d mysql
  Replace H2 with Oracle
  $ hydrogen datasource:am -R -v 2.6 -d oracle
```

#### datasource:is

```shell
Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models

USAGE
  $ hydrogen datasource:is [FLAGS] [ARGS]

OPTIONS
  -R, --replace                           replace h2 datasource
  -d, --datasource=postgres|mysql|oracle  (required) datasource type
  -v, --version=5.7                       (required) [default: 5.7] product version. supported versions are [is >= 5.7]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 IS products based on your preference.

  As of now, Hydrogen only supports replacing the default H2 datasource with a variety
  of available supported datasource models. To replace the default shipped H2 datasource,
  use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).

EXAMPLES
  Replace H2 with Postgres
  $ hydrogen datasource:is -R -v 5.7 -d postgres
  Replace H2 with MySQL
  $ hydrogen datasource:is -R -v 5.7 -d mysql
  Replace H2 with Oracle
  $ hydrogen datasource:is -R -v 5.7 -d oracle
```

### Distribute

```shell
Configure WSO2 products for distributed deployments

USAGE
  $ hydrogen [COMMAND]

DESCRIPTION
  ...
  Configure WSO2 products for supported distributed deployment setups.

  As of now, Hydrogen only supports WSO2 APIM products to distribute it in either 5 nodes
  distributed setup or as publish through multiple gateway setup.

  List all available distribute commands using
  $ hydrogen distribute --help

EXAMPLE
  $ hydrogen distribute:am [FLAGS] [ARGS]

COMMANDS
  distribute:am  Configure WSO2 APIM products (fresh-pack) for distributed deployments
```

#### distribute:am

```shell
Configure WSO2 APIM products (fresh-pack) for distributed deployments

USAGE
  $ hydrogen distribute:am

OPTIONS
  -D, --distributed       5 node distributed setup
  -M, --multiple-gateway  publish through multiple gateway

DESCRIPTION
  ...
  Configure WSO2 APIM products for distributed deployments setup based on your preference.

  As of now, Hydrogen only supports configurations for 5 node distributed deployment setup,
  and publish through multiple-gateway node setup. For 5 node distribution, use --distributed (-D)
  flag, and for multiple-gateway node, use --multiple-gateway (-M) flag.

EXAMPLES
  Configure APIM for 5 node distributed setup
  $ hydrogen distribute:am -D -v 2.6 -d postgres
  Configure APIM for publish through multiple-gateway setup
  $ hydrogen distribute:am -M -v 2.6 -d postgres
```
