# Valu npm tools

Scripts to manage releases on this and other repos

## Install

```
npm install -g @valu/npm-tools
```

## Scripts

### `valu-npm-prerelease`

Run in a `packages/*` directory to make prerelease of that package

### `valu-npm-release`

Run in a `packages/*` directory to make stable release of that package

### `valu-npm-dev-install`

Install package unpublished package to a project

```
cd project
valu-npm-dev-install /path/to/npm-packages/packages/a-package
```

You can use `-f` to install the package without building it first.
This is useful when using a watcher to build the package automatically.
