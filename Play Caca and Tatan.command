#!/bin/zsh
# Double-click to play the built game (needs a build in dist/ — see README).
cd "$(dirname "$0")"
PORT=8642
if [ ! -f dist/index.html ]; then echo "No build found. Run: npm install && npm run build"; read; exit 1; fi
python3 -m http.server $PORT --bind 127.0.0.1 --directory dist >/dev/null 2>&1 &
SERVER=$!
sleep 1
open "http://127.0.0.1:$PORT/"
echo "Caca and Tatan is running at http://127.0.0.1:$PORT — close this window to stop."
wait $SERVER
