export enum Checkpoint {
  LOBBY_INTRO = 0,
  MISSION_SUIT = 1,
  MISSION_BACKPACK = 2,
  MISSION_LAUNCH = 3,
  LEVEL_COMPLETE = 4,
}

export type ReyesExpression = 'normal' | 'happy' | 'worried';

export type SuitId = 'scout' | 'standard' | 'guardian';
export type SuitTier = 'weak' | 'best' | 'average';

export type LaunchMethodId = 'balanced' | 'risky' | 'slow';
export type LaunchTier = 'best' | 'risky' | 'slow';

export type ResourceKey =
  | 'oxygen'
  | 'water'
  | 'food'
  | 'power'
  | 'fuel'
  | 'shield'
  | 'suit'
  | 'thermal'
  | 'mass'
  | 'health'
  | 'sproutHealth'
  | 'morale'
  | 'science';

export interface Resources {
  oxygen: number;
  water: number;
  food: number;
  power: number;
  fuel: number;
  shield: number;
  suit: number;
  thermal: number;
  mass: number;
  health: number;
  sproutHealth: number;
  morale: number;
  science: number;
}

export interface Level2ChoiceLog {
  sceneId: string;
  sceneTitle: string;
  choiceLetter: 'A' | 'B' | 'C';
  choiceLabel: string;
  outcomeSummary: string;
  wasRisky: boolean;
  realMarsTip: string;
}

export type Level3PriorityId = 'air' | 'power' | 'food' | 'shield';

export interface CadetProfile {
  username: string;
  isGuest: boolean;
  cadetLevel: number;
  firstTimeLobby: boolean;
  level1Checkpoint: Checkpoint;
  level1Completed: boolean;
  level1Stars: number;
  selectedSuit: string;
  suitResult: string;
  bagItems: Record<string, number>;
  bagResult: string;
  launchMethod: string;
  launchResult: string;
  repairKits: number;
  level2Checkpoint: number; // 0 = Intro, 1..11 = Scenes 2.1..2.11, 12 = Complete
  level2Completed: boolean;
  level2Stars: number;
  level2History: Level2ChoiceLog[];
  co2Cartridges: number;
  level3Step: number; // 0 = Story Start, 1..17 = 17 Scenes/MiniGames/Finale, 18 = Complete
  level3CheckpointPending: number; // 0 = none, 1..4 = Part 1..4 checkpoint screen pending
  level3PartStars: Record<number, number>;
  level3LandingPassed: boolean;
  level3Completed: boolean;
  level3Stars: number;
  level3FinaleOrder: Level3PriorityId[];
  level3History: Level2ChoiceLog[];
  resources: Resources;
}

export interface DialogueSegment {
  text: string;
  color?: string;
  bold?: boolean;
}

export interface ReyesLine {
  text: string;
  expression: ReyesExpression;
  showNext: boolean;
  onDone?: () => void;
}
