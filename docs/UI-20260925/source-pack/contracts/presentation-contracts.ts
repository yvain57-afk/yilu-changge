/**
 * UI-20260925 - proposed presentation contracts only.
 * No Cocos dependencies, runtime implementation, model migrations or sample fake data.
 * Adapt names to the actual local project and record mappings in REALITY_MAP.md.
 */
export type ScreenId = 'home' | 'chapters' | 'loadout' | 'battle' | 'result'
  | 'camp' | 'transition' | 'meeting' | 'pause' | 'settings' | 'loading_error';
export type SaveState = 'not_attempted' | 'writing' | 'saved' | 'failed';
export type FlowAction = Readonly<{
  id: string; label: string; enabled: boolean;
  /** An actual project command, not a string to eval. */
  commandKey: string; reason?: string;
}>;
export type ActualCharacter = Readonly<{
  id: string; name: string; portraitAssetId?: string;
  role: 'leader' | 'companion'; identityLabel?: string;
}>;
export type ActualChoice = Readonly<{
  id: string; name: string; iconAssetId?: string;
  state: 'selected' | 'available' | 'locked'; unlockReason?: string;
  /** Only use text grounded in the real model; do not invent attack stats. */
  description?: string;
}>;
export type HomeView = Readonly<{
  leader: ActualCharacter; objective?: string;
  primary: FlowAction; navigation: readonly FlowAction[];
}>;
export type LevelView = Readonly<{
  id: string; title: string; state: 'locked' | 'current' | 'available' | 'cleared';
  requirement?: string; objective?: string; runnerBestLabel?: string;
}>;
export type ChaptersView = Readonly<{
  levels: readonly LevelView[]; selectedLevelId?: string; primary?: FlowAction;
}>;
export type LoadoutView = Readonly<{
  leader: ActualCharacter; companion?: ActualCharacter;
  companions: readonly ActualChoice[]; weapons: readonly ActualChoice[];
  saveState: SaveState; primary: FlowAction; back: FlowAction;
}>;
export type LogicalPoint = Readonly<{ x: number; y: number }>;
export type LogicalRect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type LayoutSnapshot = Readonly<{
  canvas: LogicalRect; safe: LogicalRect; reserved: readonly LogicalRect[];
}>;
export type GateView = Readonly<{
  id: string; actualValue: number; actualLimit?: number;
  phase: 'active' | 'consumed'; projectedFoot: LogicalPoint;
}>;
export type BoxView = Readonly<{
  id: string; kind: 'troops' | 'weapon' | 'chain_gates' | 'field_companion';
  rewardLabel: string; durability: number; maxDurability: number;
  claimTrigger: 'break' | 'touch'; phase: 'active' | 'broken' | 'consumed';
  projectedFoot: LogicalPoint;
}>;
export type BattleHudView = Readonly<{
  runId: string; levelLabel: string; objective?: string;
  troopCount: number; firepowerLabel?: string;
  progress?: number; boss?: Readonly<{ name: string; hp: number; maxHp: number }>;
  /** Anchor calculated from the actual visible formation. */
  troopLabelAnchor: LogicalPoint;
}>;
export type ActualReward = Readonly<{
  id: string; label: string; iconAssetId?: string; detail?: string;
  /** Present only when backed by an actual quantity. */
  quantity?: number;
}>;
export type ResultView = Readonly<{
  runId: string; resultId: string; outcome: 'first_win' | 'repeat_win' | 'loss' | 'final_win';
  levelTitle: string; summary: readonly string[];
  rewards: readonly ActualReward[];
  actualLastLoss?: Readonly<{ source: string; count: number; remaining: number }>;
  saveState: SaveState; primary: FlowAction; secondary: readonly FlowAction[];
}>;
export type PresentationEvent = Readonly<{
  runId: string; eventId: string; modelTick: number;
  kind: 'gate_hit' | 'gate_value_changed' | 'gate_consumed' | 'box_broken'
    | 'troops_changed' | 'weapon_changed' | 'actor_attacked' | 'actor_died' | 'result_settled';
  subjectId: string;
  /** A project-specific immutable payload; the adapter must validate before use. */
  payload: unknown;
}>;
export interface PresentationAdapter {
  readHome(): HomeView;
  readChapters(): ChaptersView;
  readLoadout(): LoadoutView;
  readBattleHud(): BattleHudView;
  readResult(): ResultView | undefined;
  subscribe(listener: (event: PresentationEvent) => void): () => void;
}
export interface UiCommandDispatcher {
  /** Existing model/application commands; never grant rewards in visual components. */
  dispatch(commandKey: string, argumentsByName?: Readonly<Record<string, unknown>>): Promise<void>;
}
