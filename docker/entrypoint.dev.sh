#!/bin/sh
# Anonymous node_modules volumes (docker-compose.yml) persist across image
# rebuilds, so a rebuilt image's freshly-installed deps get shadowed by a
# stale volume at container start. Re-syncing node_modules against the
# lockfile here keeps it correct regardless of volume staleness.
set -e
# CI=true: no TTY in the container, so pnpm can't prompt before removing a
# stale modules dir; this makes that removal (and the reinstall) unattended.
CI=true pnpm install --frozen-lockfile --shamefully-hoist
exec "$@"
