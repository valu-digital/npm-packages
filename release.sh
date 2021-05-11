#!/bin/sh

set -eu

changelog=true

if [ "${1:-}" != "" ]; then
    cd "packages/$1"
fi

pkg="$(basename $(pwd))"

if [ "$(git rev-parse --show-toplevel)" = "$(pwd)" ]; then
    echo "release.sh must be run from the packge dir"
fi

if [ ! -f package.json ]; then
    echo
    echo "No package.json at $(pwd)"
    echo
    exit 1
fi


if [ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]; then
    echo
    echo "Not on the master branch"
    echo
    exit 2
fi

if [ "$(git status . --porcelain)" != "" ]; then
    echo
    echo "Dirty git. Commit changes"
    echo
    exit 1
fi


git fetch origin

if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/master)" ]; then
    echo
    echo "Repository not up to date. Do your git push/pull/rebase dance"
    echo
    exit 1
fi


current_version="$(jq -r .version package.json)"

echo "Current version is: $current_version"

read -p "New version> " new_version

if [ "$new_version" = "" ]; then
    echo "Bad version"
    exit 1
fi

if $changelog; then
    prev_tag="$(git describe --abbrev=0 --match "$pkg/v*" || true)"

    tmp_changelog=changelog_entry.md

    echo "## v$new_version" > "$tmp_changelog"
    echo >> "$tmp_changelog"
    date +'%Y-%m-%d' >> "$tmp_changelog"
    echo >> "$tmp_changelog"
    git log --format='-   %s %h - %an' HEAD...$prev_tag . >> "$tmp_changelog"
    echo >> "$tmp_changelog"

    if [ -f CHANGELOG.md ]; then
        cat CHANGELOG.md >> $tmp_changelog
    fi

    mv $tmp_changelog CHANGELOG.md

    echo
    echo
    echo "The CHANGELOG.md file was updated automatically."
    echo
    echo
    while true; do
        echo "Type 'c' (commit) to continue or 'e' to open it in vscode"
        read -p "> " changelog_mode

        if [ "$changelog_mode" = "e" ]; then
            code CHANGELOG.md
        fi

        if [ "$changelog_mode" = "c" ]; then
            break
        fi
    done

    if [ "$(git status . --porcelain)" != "" ]; then
        git add CHANGELOG.md
        git commit -m "Update changelog for @valu/react-valu-search v$new_version"
        git push origin master:master
    fi
fi


git push origin master:master
git push -f origin master:release/$pkg/$new_version