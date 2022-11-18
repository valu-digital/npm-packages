#!/bin/sh

set -eu

exec "$(git rev-parse --show-toplevel)/packages/npm-tools/scripts/valu-npm-prerelease"