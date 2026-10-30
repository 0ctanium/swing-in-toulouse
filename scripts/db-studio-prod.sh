#!/usr/bin/env bash
# Drizzle Studio on the production database: port-forwards to the cluster's Postgres, reads the
# owner password from its Secret, and starts the studio against it. Ctrl-C stops both.
#
# Needs kubectl on the cluster: KUBECONFIG, or ~/.kube/kapsule.yaml (platform runbook).
set -euo pipefail

namespace="${SWING_NAMESPACE:-swing-toulouse}"
port="${SWING_DB_PORT:-5433}"
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/kapsule.yaml}"

if [ ! -r "$KUBECONFIG" ]; then
  echo "No kubeconfig at $KUBECONFIG: see the platform runbook (pulumi stack output kubeconfig)." >&2
  exit 1
fi

password="$(kubectl -n "$namespace" get secret swing-db-owner -o jsonpath='{.data.password}' | base64 -d)"

kubectl -n "$namespace" port-forward svc/swing-db-rw "$port:5432" >/dev/null 2>&1 &
forward=$!
env_file="$(mktemp)"
cleanup() {
  rm -f "$env_file"
  kill "$forward" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 30); do
  (echo >"/dev/tcp/127.0.0.1/$port") 2>/dev/null && break
  sleep 1
done

# A one-off environment for the loader (ENV_FILE), so .env.local is not consulted. The password
# has no URL-special characters (random, letters and digits only).
printf 'DATABASE_URL=postgresql://swing:%s@127.0.0.1:%s/swing\nDATABASE_DRIVER=node-postgres\nSKIP_ENV_VALIDATION=1\n' \
  "$password" "$port" >"$env_file"

echo "Production database forwarded on 127.0.0.1:$port; starting Drizzle Studio (Ctrl-C to stop)."
# Not exec: the trap above must run once the studio exits.
ENV_FILE="$env_file" pnpm exec drizzle-kit studio
