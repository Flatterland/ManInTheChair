#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ ! -d ".venv" ]; then
    echo "Setting up virtualenv..."
    /home/anton/.local/bin/uv venv .venv --python 3.12
    /home/anton/.local/bin/uv pip install --python .venv/bin/python -r requirements.txt
fi

echo "Starting 'Man in the Chair' Holographic Server on http://127.0.0.1:8080 ..."
./.venv/bin/python app.py
