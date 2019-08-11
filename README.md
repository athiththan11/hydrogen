<h1 align='center'>hydrogen</h1>

<p align='center'>An interactive CLI tool for WSO2 Servers</p>

<br>

<br>

<p align="center">
  <img width="200" src="src/img/hydrogen.png">
</p>

<br>

<br>

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
  datasource:am  Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
  datasource:is  Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors
```

#### datasource:am

```shell
Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors

USAGE
  $ hydrogen datasource:am [FLAGS] [ARGS]

OPTIONS
  -R, --replace           replace h2 datasource
  -d, --datasource=mysql  (required) datasource type
  -v, --version=2.6       [default: 2.6] product version. supported versions are [apim >= 2.6]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 products based on your preference.

  As of now, Hydrogen only supports replacing the default H2 datasource with a variety
  of available datasources supported. To replace the default shipped H2 datasource,
  use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).

EXAMPLE
  Replace H2 with MySQL
  $ hydrogen datasource:am -R -v 2.6 -d mysql
```

#### datasource:is

```shell
Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors

USAGE
  $ hydrogen datasource:is [FLAGS] [ARGS]

OPTIONS
  -R, --replace                           replace h2 datasource
  -d, --datasource=postgres|mysql|oracle  (required) datasource type
  -v, --version=5.7                       product version. supported versions are [is >= 5.7]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 products based on your preference.

  As of now, Hydrogen only supports replacing the default H2 datasource with a variety
  of available datasources supported. To replace the default shipped H2 datasource,
  use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).

EXAMPLE
  Replace H2 with Postgres
  $ hydrogen datasource:is -R -v 5.7 -d postgres
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
  distribute:am  configure wso2 products for distributed deployments
```

#### distribute:am

```shell
configure wso2 products for distributed deployments

USAGE
  $ hydrogen distribute:am

OPTIONS
  -D, --distributed       distributed setup
  -M, --multiple-gateway  publish through multiple gateway

DESCRIPTION
  ...
  Extra documentation goes here

EXAMPLE
  $ hydrogen distribute:am -D
```
