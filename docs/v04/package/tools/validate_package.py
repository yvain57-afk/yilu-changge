#!/usr/bin/env python3
"""Validate this handoff's documents/configuration only; never claims game tests passed."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(name: str) -> dict:
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from strings(v)

def main() -> None:
    required = ["README_FIRST.md", "00_START_WITH_CODEX.md", "01_DELIVERY_BRIEF.md",
                "02_COMBAT_CONTRACT.md", "03_CAMPAIGN_AND_TRANSITIONS.md",
                "04_ART_AND_MOTION.md", "05_TESTS_AND_DELIVERY.md",
                "06_BASELINE_AND_DECISIONS.md", "data/combat.v04.json", "data/campaign.v04.json"]
    checks = []
    def check(label: str, ok: bool) -> None:
        if not ok:
            raise ValueError(f"Package validation failed: {label}")
        checks.append(label)
    check("required_files", all((ROOT / f).is_file() and (ROOT / f).stat().st_size for f in required))
    c, s = load("data/combat.v04.json"), load("data/campaign.v04.json")
    ids = [l["id"] for l in s["levels"]]
    check("three_stable_level_ids", ids == ["trial-01", "trial-02", "trial-03"])
    check("starting_counts_preserved", [l["startCount"] for l in s["levels"]] == c["team"]["startingTotalCounts"] == [8, 12, 16])
    ts = {t["id"]: t for t in s["transitions"]}
    check("unique_transition_ids", len(ts) == len(s["transitions"]) == 3)
    check("correct_level_transition_binding", all(ts[l["transitionId"]]["afterLevelId"] == l["id"] for l in s["levels"]))
    check("correct_next_level", [t["nextLevelId"] for t in s["transitions"]] == ["trial-02", "trial-03", None])
    check("reinforcement_counts_are_between_levels", [t["nextStartCount"] for t in s["transitions"]] == [12, 16, None])
    check("opening_limit", all(len(l["opening"]) <= 2 for l in s["levels"]))
    check("no_per_transition_currency", all(not t["grantsCurrency"] for t in s["transitions"]))
    check("no_extra_playable_map_node", s["camp"]["playableNodeIds"] == ids)
    check("zhaoyun_has_no_new_ai", len(s["encounters"]) == 1 and not s["encounters"][0]["combatAi"] and not s["encounters"][0]["recruitment"])
    forbidden = ["架空", "演绎", "非史实", "试制", "草模", "待制作", "穿越", "纸兵", "墨影", "S1", "S2"]
    check("player_copy_has_no_disruptive_terms", not any(bad in text for text in strings(s) for bad in forbidden))
    check("player_copy_has_no_real_years", not any(re.search(r"\d{3,4}年", text) for text in strings(s)))
    check("preserve_base_save_key", s["baseSaveKey"] == "yilu-changge-prototype-v2" and s["sidecarSaveKey"] != s["baseSaveKey"])
    check("no_forced_reading", s["flow"]["mandatoryReadSeconds"] == 0 and s["flow"]["tapEqualsDrag"])
    m = c["heroMelee"]
    check("melee_cycle_adds_up", m["windupTicks"] + m["activeTicks"] + m["recoveryTicks"] == m["cycleTicks"] == 36)
    check("melee_not_ranged_wave", not m["projectileWave"] and not m["hitsGates"] and m["blocksOnRock"])
    check("boss_reachable", m["attackDepthMin"] <= c["bossEngagement"]["engagedDepth"] <= m["attackDepthMax"])
    check("boss_observation_window", c["bossEngagement"]["firstTelegraphAtOrAfterBossTick"] > c["bossEngagement"]["approachTicks"])
    check("one_hit_one_target", m["maxTargetsPerAttack"] == m["maxHitsPerAttack"] == 1)
    a = c["archery"]
    check("hero_removed_from_archery", not a["heroLaunchesArrow"] and c["team"]["archerCountFormula"] == "max(0,totalCount-1)")
    check("volley_cap_consistent", a["maximumVisibleArrows"] == a["maximumVolleyGroups"] * a["maximumVisibleArrowsPerVolley"] == 235)
    check("no_hidden_timeouts_or_rescue", all(value is False for value in c["limits"].values()))
    result = {"scope": "handoff files and data only", "gameImplementedByThisPackage": False,
              "gameTestsExecuted": False, "checksPassed": len(checks), "checks": checks,
              "gameBalance": "unverified seed values", "baselineSha": c["baselineSha"]}
    (ROOT / "PACKAGE_CHECK.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(checks)} handoff-only checks; no Cocos/game tests executed.")

if __name__ == "__main__":
    main()
