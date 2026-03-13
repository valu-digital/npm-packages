# @valu/git-tools

Git utilities for managing build assets and deployments in Valu projects.

## Install

```
npm install @valu/git-tools
```

## Scripts

### `git valu-hide-changes <dir>`

Hides tracked file changes in a directory from git. Creates a `.gitignore` in the directory and marks tracked files with `--assume-unchanged`. Used to keep build output in the repo without constant noise in `git status`.

```
git valu-hide-changes build
```

### `git valu-show-changes <dir>`

Reverses `git valu-hide-changes` by removing the `.gitignore` and clearing the `--assume-unchanged` flag on tracked files.

```
git valu-show-changes build
```

### `git valu-commit-changes <dir>`

Shows hidden changes in a directory, stages and commits them, then hides them again. The commit message is `"Commit changes in <dir>"`.

```
git valu-commit-changes build
```

### `git valu-pre-build`

Runs pre-build assertions: checks that the working directory is clean and that the local branch is in sync with its remote.

```
git valu-pre-build
```

### `git valu-deploy <production|staging>`

Orchestrates a deployment. For production: commits build changes, asserts on the master/main branch, and pushes to the production remote. For staging: commits build changes and pushes to the staging remote.

```
git valu-deploy production
git valu-deploy staging
```

### `git valu-assert-clean`

Exits with an error if the working directory has uncommitted changes.

```
git valu-assert-clean
```

### `git valu-assert-master`

Exits with an error if the current branch is not `master` or `main`.

```
git valu-assert-master
```

### `git valu-assert-sync`

Fetches from origin, pushes the current branch, and exits with an error if the local branch is not in sync with the remote.

```
git valu-assert-sync
```

### `git valu-push-production`

Pushes the default branch to both `origin` and `production` remotes.

```
git valu-push-production
```

### `git valu-push-staging`

Pushes the current branch to `origin` and maps it to the default branch on the `staging` remote.

```
git valu-push-staging
```

## Example: commit build output

Add the following to your `package.json` scripts:

```json
{
  "scripts": {
    "build-commit": "npm run build && git valu-commit-changes build",
    "deploy-production": "git valu-pre-build && npm run build && git valu-deploy production"
  }
}
```
