#!/bin/sh

set -eu


if [ "${1:-}" != "" ]; then
    cd "packages/$1"
fi

pkg="$(basename $(pwd))"

if [ "$(git rev-parse --show-toplevel)" = "$(pwd)" ]; then
    echo "prerelease.sh must be run from the packge dir"
fi

if [ ! -f package.json ]; then
    echo
    echo "No package.json at $(pwd)"
    echo
    exit 1
fi


if [ "$(git status . --porcelain)" != "" ]; then
    echo
    echo "Dirty git. Commit changes"
    echo
    exit 1
fi

git push -f origin master:release/$pkg/prerelease