#!/bin/zsh
cd "${0:A:h:h:h}"
exec node tools/r3-combat/serve.mjs
