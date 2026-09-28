# FIX2 source preservation audit

Final candidate refreshed: 2026-09-26T00:55:50.261776+08:00
Result: pass. No game source modified by this audit.

Read-only source/config/asset comparison. No browser/model execution/build/device acceptance in this review. Gate rule changes intentionally affect downstream runs.

Baseline: `.cache/BATTLE-FIX2-20260925-baseline/source-before.tgz`
Baseline SHA256: `155a318654d7248ddd2e6f695c3eab788eb69c537f10eecff9050d8dca386ceb`
Prior audit retained: `evidence/BATTLE-FIX2-20260925/PRESERVED_CONTRACTS-before-layout-fix.json` (`9757f631a4e991235e483d845693a5111d7e59e9c515127b97f1ddb909186018`)

## Counts

{"baselineFiles": 209, "currentFiles": 230, "unchanged": 201, "changed": 8, "added": 19, "removed": 0, "notInBaseline": 2}
AppleDouble `._*` archive metadata excluded. Missing baseline tsconfigs are not called new or unchanged.

## Refreshed candidate delta

- `assets/resources/battlefix2/wall-middle.png`: `None` -> `28c546a36894c2e29eca4fb8f2d70d75e78243c161fc33fab29023ae8ce550f2`
- `assets/resources/battlefix2/wall-middle.png.meta`: `None` -> `bdb1b5f1c1efd13ddb0801f1c6cf8913d987cd461f74cc3ba03839208cb49a4d`
- `assets/scripts/BattleView.ts`: `015a79b946d367d36202fb741f4e0e2fff073309e79a1e17019d29882475b9d7` -> `27d670034268c6aba768ccc01857b4d6f00c13f243f023a2fd3b1a2ce5e66267`
- `assets/scripts/ui/BattleFix2Assets.ts`: `603126db0dcc91a0d9a7b855224edec35c0ba24036e448961f95546d9a11e053` -> `2d29de20535e615d3126cc5531b6e289522678feeeb4da11769dacf4db916672`
- `assets/scripts/ui/WorldLabels.ts`: `d6e3223afadee828d119fd876861dc756fc9da91bd81c4546ead44dacd29ac01` -> `d1085e330b09f3823f121a9cc8017432e4fe1bd5505f24bd5847653cee74d9a3`

Core bytes identical to prior review: `True`. Menu pageScene/portrait methods still identical to source-before baseline: `True`.

## Preserved contracts

- **menus-and-transitions: pass** - Menu, page scenes, transition, save retry and input methods byte-identical. New battle assets join shared loading/readiness; failure retains existing error page.
- **three-level-content: pass** - All three levels identical after removing only 15 added growthStrategy=window fields: enemies, bosses, HP, speeds, spawn position/time, route length, objectives, crate HP/rewards, gate initial values/damagePerPoint/legacy maxPositive.
- **firepower-parameters: pass** - All equipment stage configuration, intervals, damage, projectile speed/range/splash and upgrade/reward branches unchanged.
- **collision-and-motion: pass** - Foot positions, muzzle, swept geometry, barrier bounds, collision ordering, firing kinematics and enemy motion unchanged. Window gains intentionally change downstream counts/weights/encounters; no claim of full-run equality under changed rules.
- **unchanged-foundation: pass** - Main model, weapon mapping, campaign, permanent growth/unlock, tactics and platform storage/lifecycle identical.
- **save-keys-schema: pass** - Save keys and legacy best validation unchanged. runnerVideoV2.best now uses proven guard, preserves unknown nested fields, and rejects over-bound wins without replacing prior record. No in-flight Journey restore path was added.
- **no-bgm: pass** - Platform BGM disabled/stopped, existing SFX retained. settings.music=true is an unchanged historical save field, not active music.
- **scope-of-existing-changes: pass** - Existing changes limited to six expected source files plus package versions. New battle rendering helpers/assets listed separately. Archive AppleDouble metadata ignored.

## Actual existing-file differences

### `assets/scripts/BattleView.ts`

Gate/crate labels and containers, player-safe card placement, weapon actions/waves, upper scenery and straight divider assembly. Menu pageScene/portrait methods remain baseline-identical.

- Before SHA256: `58a1dbb221e60002b4a9211c471c30115c7bde051fd1d4d5c6389def203dba25`
- Current SHA256: `27d670034268c6aba768ccc01857b4d6f00c13f243f023a2fd3b1a2ce5e66267`

### `assets/scripts/Game.ts`

Battle asset load/ready, battle HUD wording and label scale argument, runtime identity. Menu methods unchanged.

- Before SHA256: `2d3070385f5ef024ada260ca666a187a20bcc724b904db00bfc16f1f1ae0013f`
- Current SHA256: `f05169a7384fe66018bcc601d0f1e5c342a8ff42790ebc904e915c329ed6b537`

### `assets/scripts/core/runner.ts`

Window/capped growth, remove reward cap 256, numeric guard, frozen projectile identity, bounded recentFires/readonly timing and pacing observations.

- Before SHA256: `6be0bb945fd3f4debdc96061f191cfac36c6ed8cc034711c4c4bf6247eae4e83`
- Current SHA256: `0c13a1750bff6c1208545a194bcb4a15d35b0167949ffd2423a5406fa9dce1ed`

### `assets/scripts/core/runnerConfig.ts`

15 explicit window gates and capacity proof/guard. All existing level and equipment values unchanged.

- Before SHA256: `7118649805a5d6272b539e8cf46288f15b579d180089c5a6468dd16d796c0d42`
- Current SHA256: `3bd24ede32edafbcd0ce6880f52272e369ab7cc602c3963eec14538bf50732c8`

### `assets/scripts/core/save.ts`

runnerBest capacity and unknown nested best preservation; unchanged save keys/legacy best.

- Before SHA256: `341dd25e3861f2dee0e79a44bd09dd9f0d4bc52b38d9c1896b8810da5bebe4e4`
- Current SHA256: `6194ea8043fddaec23d2457dc212edb0da6d18dea18a8f59ad962e3eb9f47697`

### `assets/scripts/ui/WorldLabels.ts`

Grouped battle labels, stable local placement and updated label priorities.

- Before SHA256: `131adab302ff7616ae345eec22044990ffbea1916c79ed3c760a16c6397d6628`
- Current SHA256: `d1085e330b09f3823f121a9cc8017432e4fe1bd5505f24bd5847653cee74d9a3`

### `package-lock.json`

Root and package version only.

- Before SHA256: `7a075e39e7cf7215650b1fec09584e79d58414dd4f8d367b3a94a2074c40f23e`
- Current SHA256: `1d016c5f482f0f4e43b42839f9c4d8ca28e8f0aef2dfbcb11f049ea49d01e7f6`

### `package.json`

Version only.

- Before SHA256: `665779e87230134af868ad084f78d1cce6ab0c6f2b29ed0d50885768b79d9cdb`
- Current SHA256: `f14ed80b98b62bc3856ae00198899e2e7b2a1cc7269d4ddb62c932f8ea0986af`

## Added battle files

- `assets/resources/battlefix2.meta` - `1d2e5733c8e13a50b9c631be8362186966aaf0796dfc6644c29f76e3f1f449ee`
- `assets/resources/battlefix2/actions.png` - `a6d06f6e3c24cf63ddb5cc91953a03a825ed8b4620bcc427fdb0e0effb2fb792`
- `assets/resources/battlefix2/actions.png.meta` - `bf49d6a183698cfd1dd1d61aa1d3607c362a772376f43a538da595f123e17162`
- `assets/resources/battlefix2/blade.png` - `a52b78f8bd38ae891f2f09a8639e00d552350f2b69d87467427709ba6fa39c04`
- `assets/resources/battlefix2/blade.png.meta` - `bf4ec9e303694f871d6545935b8db2a803846b1c1f5d123c13aa645465042544`
- `assets/resources/battlefix2/environment.png` - `4516ba1f3f2297e8db2d61063cd5a0007ec97848bc4543c2c0f48e8999e1ac2d`
- `assets/resources/battlefix2/environment.png.meta` - `5441ea1ad007beba465509de7caec243ad1ac9ed0d691f4853ca6d79b9732c1b`
- `assets/resources/battlefix2/shadow.png` - `0bb08d11f55a63498d8198e9c4ce515bd51cc60cd7b80d96c4565f3bd8728aef`
- `assets/resources/battlefix2/shadow.png.meta` - `59fe194c5f25efa562126d96d70fe44c5fa559c9e0309234435576f5fde098c0`
- `assets/resources/battlefix2/wall-middle.png` - `28c546a36894c2e29eca4fb8f2d70d75e78243c161fc33fab29023ae8ce550f2`
- `assets/resources/battlefix2/wall-middle.png.meta` - `bdb1b5f1c1efd13ddb0801f1c6cf8913d987cd461f74cc3ba03839208cb49a4d`
- `assets/resources/battlefix2/waves.png` - `b181f20e0583dcfcac4e292c14efe450640dfc9c626c6998dabb143d7e46e033`
- `assets/resources/battlefix2/waves.png.meta` - `ed5fe962d7c9d1a92529a95331ca4d28e38264c3103baa91e8a4111337125d16`
- `assets/resources/battlefix2/zhao.png` - `42db3e0609240f7ef2360a2be86eaf60cb9d9ee2c21adc12adaef14c90c38f5d`
- `assets/resources/battlefix2/zhao.png.meta` - `c65378149aaca60118b8dc7743d3528be209bdbe908b9b8cc4bd65a123255895`
- `assets/scripts/ui/BattleFix2Assets.ts` - `2d29de20535e615d3126cc5531b6e289522678feeeb4da11769dacf4db916672`
- `assets/scripts/ui/BattleFix2Assets.ts.meta` - `0f772dbd74e0fcb7435a74b5731d1e995e6b0eebfa86215b7a75f7552c734aca`
- `assets/scripts/ui/WeaponPresentation.ts` - `89c460bf6fb37dea85fcf049eae893078a2f38a86cd09928e1ba8b0c28268e71`
- `assets/scripts/ui/WeaponPresentation.ts.meta` - `3639957fa14d15d5e7a673753391b2a003cd005c94013bffab3b0d4502c05447`

## Packaging tool review

Python AST syntax passed. --extra-media accepts actual MP4 within current evidence, validates duration and copies it to both packages with hashes. Prepared snapshot and archive file hashes cover these media. Full-package relative media paths are rewritten correctly. Gallery prioritizes only the selected four final before/after groups, then extra videos; other evidence is retained but not falsely shown as the final comparison. No concrete bug found in the additions. No prepare, archive or fingerprint action was executed.

## Limits

- Exact geometry and firing methods remain as recorded. Increased window rewards intentionally change downstream squad weight, damage and encounters; no full-run equality claim.
- tsconfig.json and tsconfig.core.json were absent from the source-before archive; only current hashes are recorded.
- No browser, build, device listening or aesthetic acceptance is implied.
- Complete hashes, parameter changes and AST method data: evidence/BATTLE-FIX2-20260925/PRESERVED_CONTRACTS.json.
