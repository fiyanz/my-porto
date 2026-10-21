#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "Running FastAPI test suite..."
if command -v uv &> /dev/null; then
    uv run pytest -v tests/
elif command -v pytest &> /dev/null; then
    pytest -v tests/
else
    echo "Neither 'uv' nor 'pytest' found. Please run within your python environment or docker container."
    exit 1
fi