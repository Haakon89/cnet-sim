#!/usr/bin/env bash
set -euo pipefail


timeout 60 sh -c 'while true; do nc -l -p 5000; done' || true

