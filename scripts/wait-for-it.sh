#!/bin/sh
# wait-for-it.sh: wait for a host and port to be available

set -e

TIMEOUT=60
QUIET=0

HOST="$1"
PORT="$2"
shift 2
CMD="$@"

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
  echo "Error: Host or Port not specified" >&2
  exit 1
fi

wait_for() {
  if [ "$QUIET" -eq 0 ]; then echo "Waiting for $HOST:$PORT..."; fi
  for i in $(seq $TIMEOUT); do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    result=$?
    if [ $result -eq 0 ]; then
      if [ "$QUIET" -eq 0 ]; then echo "$HOST:$PORT is available after $i seconds"; fi
      return 0
    fi
    sleep 1
  done
  echo "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT" >&2
  return 1
}

wait_for_wrapper() {
  # In case nc isn't available, try a fallback with /dev/tcp (bash/ksh/zsh specific)
  if command -v nc > /dev/null 2>&1; then
    wait_for
    result=$?
  elif [ -n "$BASH_VERSION" ] || [ -n "$KSH_VERSION" ] || [ -n "$ZSH_VERSION" ]; then
    if [ "$QUIET" -eq 0 ]; then echo "nc not found, trying /dev/tcp fallback (bash/ksh/zsh)..."; fi
    for i in $(seq $TIMEOUT); do
      (exec 3<>/dev/tcp/"$HOST"/"$PORT") 2>/dev/null
      if [ $? -eq 0 ]; then
        exec 3<&-
        exec 3>&-
        if [ "$QUIET" -eq 0 ]; then echo "$HOST:$PORT is available after $i seconds (using /dev/tcp)"; fi
        return 0
      fi
      sleep 1
    done
    echo "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT (using /dev/tcp)" >&2
    return 1
  else
    echo "Error: nc command not found and shell does not support /dev/tcp. Cannot check port status." >&2
    return 1
  fi
  return $result
}

wait_for_wrapper
RESULT=$?

if [ $RESULT -ne 0 ]; then
  exit $RESULT
fi

if [ -n "$CMD" ]; then
  exec $CMD
else
  exit $RESULT
fi
