# Valu git tools

Script to hide tracked git changes. Used when committing build assets.

## Install

```
npm install @valu/git-tools
```

or maybe even globally?

```
npm install -g @valu/git-tools
```

## Scripts

### `git valu-hide-changes <dir>`

Hide changes from git in a given directory even if they are tracked

```
git valu-hide-changes build
```

### `git valu-show-changes <dir>`

Show changes hidden by `git valu-hide-changes`

```
git valu-show-changes build
```

### `git valu-commit-changes <dir>`

Commit hidden changes

```
git valu-commit-changes build
```

## Use to commit build changes

Add following package.json script

```
"build-commit": "npm run build && git valu-commit-changes build"
```
