"""Build and verify a new WeChat package without replacing prior builds."""

import argparse
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools/project-reader"))
from common import atomic, digest, game_fingerprint, now

APP_ID = "wx1c79d88991602e7c"
SCENE = "752d3aa0-8b82-4e8e-a6d4-c6587c90bcf2"
CREATOR = Path("/Applications/CocosCreator/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator")
PROFILE_TOOLS = Path("tools/player-feedback-20261029")


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def build(args, output):
    dest = ROOT / "build" / output
    evidence = ROOT / ".cache/wechat-build" / output
    if dest.exists() or dest.is_symlink() or evidence.exists() or evidence.is_symlink():
        raise SystemExit(f"Output already exists: {output}")
    if not CREATOR.is_file():
        raise SystemExit(f"Cocos Creator 3.8.8 is missing: {CREATOR}")
    ffmpeg = shutil.which("ffmpeg") or str(Path.home() / ".local/bin/ffmpeg")
    if not os.access(ffmpeg, os.X_OK):
        raise SystemExit("ffmpeg is required for the WeChat audio profile.")
    evidence.mkdir(parents=True)
    manifest = subprocess.check_output([
        str(ROOT / "node_modules/.bin/tsx"), "-e",
        "import {MANIFEST} from './assets/scripts/formal/manifest'; console.log(JSON.stringify(MANIFEST));",
    ], cwd=ROOT)
    write_json(evidence / "art-manifest.json", json.loads(manifest))
    config = {
        "name": "一将成军", "platform": "wechatgame", "buildPath": "project://build",
        "outputName": output, "debug": False, "startScene": SCENE,
        "scenes": [{"url": "db://assets/scenes/Journey.scene", "uuid": SCENE}],
        "packages": {"wechatgame": {"appid": APP_ID, "orientation": "portrait"}},
        "sourceMaps": False,
    }
    config_path = evidence / "build-config.json"
    write_json(config_path, config)
    write_json(evidence / "account-boundary.json", {"appid": APP_ID, "mode": "formal_game", "name": "一将成军"})
    fingerprint, sources = game_fingerprint(ROOT)
    stamp = {
        "build_id": "wechat-" + uuid.uuid4().hex[:12],
        "code_fingerprint": fingerprint, "produced_at": now(), "target": "wechatgame_local",
        "configuration": "Release", "app_version": args.version, "build_number": args.build_number,
    }
    write_json(evidence / "build-manifest.json", {**stamp, "source_files": sources})
    formal = ROOT / "assets/scripts/formal"
    marker = formal / "BridgeBuild.ts"
    previous = marker.read_bytes()
    marker_mode = stat.S_IMODE(marker.stat().st_mode)
    stamp_source = ("// Generated before Cocos export.\nexport const BRIDGE_BUILD="
                    + json.dumps(stamp) + ";\n").encode()
    write_json(evidence / "source-receipt.json", {"source_files": [
        {"path": str(p.relative_to(ROOT)), "sha256": digest(p.read_bytes())}
        for p in sorted(formal.glob("*.ts")) if p != marker
    ]})
    log_path = evidence / "export.log"
    try:
        atomic(marker, stamp_source)
        marker.chmod(marker_mode)
        with log_path.open("w") as log:
            result = subprocess.run(
                [str(CREATOR), "--project", str(ROOT), "--build", f"configPath={config_path}"],
                cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
            )
    finally:
        if marker.read_bytes() == stamp_source:
            atomic(marker, previous)
            marker.chmod(marker_mode)
    if result.returncode not in (0, 36):
        raise SystemExit(f"Cocos export failed ({result.returncode}). See {log_path}")
    game = json.loads((dest / "game.json").read_text())
    project = json.loads((dest / "project.config.json").read_text())
    js = (dest / "assets/main/index.js").read_text()
    if (game.get("deviceOrientation") != "portrait" or project.get("compileType") != "game"
            or project.get("appid") != APP_ID or stamp["build_id"] not in js):
        raise SystemExit(f"Unexpected target, AppID, or build stamp in {dest}")
    env = dict(os.environ, YILU_WECHAT_BUILD=str(dest.relative_to(ROOT)),
               YILU_WECHAT_EVIDENCE=str(evidence.relative_to(ROOT)), YILU_WECHAT_FFMPEG=ffmpeg)
    subprocess.run(["node", str(PROFILE_TOOLS / "mobile-profile.mjs"), "1"], cwd=ROOT, env=env, check=True)
    subprocess.run(["node", str(PROFILE_TOOLS / "verify.mjs")], cwd=ROOT, env=env, check=True)
    print(f"WeChat package: {dest}\nEvidence: {evidence}\nBuild ID: {stamp['build_id']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True)
    parser.add_argument("--build-number", required=True)
    parser.add_argument("--output", help="Unique directory name under build/")
    args = parser.parse_args()
    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version) or not re.fullmatch(r"\d{1,16}", args.build_number):
        parser.error("Version must be X.Y.Z and build number must be numeric.")
    output = args.output or f"wechat-{args.version}-{args.build_number}"
    if not re.fullmatch(r"wechat-[a-zA-Z0-9][a-zA-Z0-9._-]*", output):
        parser.error("Output must be a single directory name prefixed with wechat-.")
    lock = ROOT / ".cache/wechat-build/.lock"
    lock.parent.mkdir(parents=True, exist_ok=True)
    with lock.open("a") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("A WeChat build is already in progress.")
        build(args, output)


if __name__ == "__main__":
    main()
