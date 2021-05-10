# npm packages

This is a mono repo of open source npm packages created by Valu Digital.

## Warning

Although these are open source we are not resourced enough to properly support
"community" users. You are free to use these packages outside Valu Digital and
even open issues here, but it is very likely that we don't have the time and
resources to act on them. Same goes for outsider PRs. Feel free to hard fork the
packages.

## Publishing

The repo contains a Github Workflow which makes it very easy to create and
update the packages. It just requires `build` and `test` package.json scripts. Do
not use prepublish scripts. The workflow will run the build before publishing.

When a package is ready for publishing just run the `release.sh` from the
package directory.

```
cd packages/example
../../release.sh
```

The script will generate a changelog entry and pushed code to a version branch
from where the workflow picks it up. The workflow will tag the version, build
the package and publishes it.

The packages are released to the public npm registry.

The release notifications can be found our internal `#npm-packages` channel.

### Prereleases

A prerelease without changelog and tagging can be made with the `prerelease.sh`
script.

```
cd packages/example
../../prerelease.sh
```
