#!/bin/zsh
set -eu
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1 && [[ -x "$HOME/.hermes/node/bin/node" ]]; then
  export PATH="$HOME/.hermes/node/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  print '未找到 Node.js。请安装 Node.js 18 或更新版本后再次双击；预构建试玩不需要安装 Cocos。'
  read '?按回车关闭'; exit 1
fi
node tools/launch.mjs "$@"
