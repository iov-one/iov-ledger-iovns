#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_includes.sh";

fold_start "yarn-install"
retry 3 yarn install
fold_end

fold_start "yarn-build"
yarn build
fold_end

fold_start "yarn-lint"
yarn lint
fold_end

fold_start "yarn-test"
SKIP_BUILD=1 yarn test
fold_end
