import {
  DialogueSegment,
  LaunchMethodId,
  LaunchTier,
  ResourceKey,
  ReyesExpression,
  SuitId,
  SuitTier,
} from './types';

export interface SuitSpec {
  id: SuitId;
  title: string;
  tier: SuitTier;
  massLabel: string;
  o2Label: string;
  mobilityLabel: string;
  protectionLabel: string;
  special: string;
  feedback: string;
  expr: ReyesExpression;
  accentHex: string;
}

export const SUITS: Record<SuitId, SuitSpec> = {
  scout: {
    id: 'scout',
    title: 'Scout Suit',
    tier: 'weak',
    massLabel: '+20 (Light)',
    o2Label: '6 Hours',
    mobilityLabel: 'High',
    protectionLabel: 'Low',
    special:
      'Ultra-light frame lets you move quickly, but its compact oxygen tank runs down fast!',
    feedback:
      'Hmm, this suit is risky. Your [color=#FF4D6D]oxygen will decrease faster[/color].',
    expr: 'worried',
    accentHex: '#FF9E64',
  },
  standard: {
    id: 'standard',
    title: 'Standard Suit',
    tier: 'best',
    massLabel: '0 (Balanced)',
    o2Label: '8 Hours',
    mobilityLabel: 'Medium',
    protectionLabel: 'Medium',
    special:
      'Best all-around training suit! Reliable oxygen seal and balanced thermal protection.',
    feedback: '[color=#2EE59D]Perfect choice![/color] (+1 Star)',
    expr: 'happy',
    accentHex: '#00D4FF',
  },
  guardian: {
    id: 'guardian',
    title: 'Guardian Suit',
    tier: 'average',
    massLabel: '-20 (Heavy)',
    o2Label: '10+ Hours',
    mobilityLabel: 'Low',
    protectionLabel: 'High',
    special:
      'Armored heavy suit with backup oxygen, but rigid joints make movement slower.',
    feedback: 'Okay, this will work.',
    expr: 'normal',
    accentHex: '#FFB703',
  },
};

export interface BackpackItemSpec {
  id: string;
  name: string;
  weight: number;
  required: boolean;
  resource: ResourceKey | '';
  description: string;
}

export const MAX_BACKPACK_CAPACITY = 100;

export const BACKPACK_ITEMS: BackpackItemSpec[] = [
  {
    id: 'oxygen',
    name: 'Oxygen Canister',
    weight: 25,
    required: true,
    resource: 'oxygen',
    description: 'Pressurized reserve breathing supply',
  },
  {
    id: 'water',
    name: 'Water Pack',
    weight: 20,
    required: true,
    resource: 'water',
    description: 'Hydration pouch for orbital transit',
  },
  {
    id: 'food',
    name: 'Food Ration',
    weight: 20,
    required: true,
    resource: 'food',
    description: 'High-nutrition space meal pack',
  },
  {
    id: 'repair',
    name: 'Repair Kit',
    weight: 15,
    required: true,
    resource: '',
    description: 'Zero-G seal tape and multi-driver',
  },
  {
    id: 'battery',
    name: 'Spare Battery',
    weight: 10,
    required: true,
    resource: '',
    description: 'Lithium cell for suit telemetry',
  },
  {
    id: 'rock',
    name: 'Moon Rock Trophy',
    weight: 20,
    required: false,
    resource: '',
    description: 'Heavy decorative souvenir boulder',
  },
  {
    id: 'arcade',
    name: 'Mini Arcade',
    weight: 15,
    required: false,
    resource: '',
    description: 'Handheld retro console (non-essential)',
  },
];

export interface LaunchMethodSpec {
  id: LaunchMethodId;
  title: string;
  tier: LaunchTier;
  effect: string;
  sideEffect: string;
  feedback: string;
  expr: ReyesExpression;
}

export const LAUNCH_METHODS: Record<LaunchMethodId, LaunchMethodSpec> = {
  balanced: {
    id: 'balanced',
    title: 'Balanced Controlled Thrust',
    tier: 'best',
    effect:
      'Smooth climb, steady cabin G-force, and optimal fuel efficiency.',
    sideEffect: 'Requires active throttle attention during liftoff.',
    feedback:
      '[color=#2EE59D]Perfect launch![/color] Smooth orbit achieved. (+1 Star)',
    expr: 'happy',
  },
  risky: {
    id: 'risky',
    title: 'Steep Max-Power Burn',
    tier: 'risky',
    effect: 'Reaches upper atmosphere in record time.',
    sideEffect:
      'Extreme shaking, thick exhaust smoke, and heavy fuel loss!',
    feedback: 'That was [color=#FF4D6D]risky! Fuel decreased.[/color]',
    expr: 'worried',
  },
  slow: {
    id: 'slow',
    title: 'Gentle Low-Thrust Climb',
    tier: 'slow',
    effect: 'Very gentle G-forces and minimal engine stress.',
    sideEffect: 'Slow ascent delays mission schedule.',
    feedback: 'Safe but [color=#FFB703]slow launch[/color].',
    expr: 'normal',
  },
};

/**
 * Parses safe BBCode-style tokens such as [color=#FFD966]text[/color] into styled spans.
 */
export function parseDialogueSegments(input: string): DialogueSegment[] {
  const segments: DialogueSegment[] = [];
  const regex = /\[color=(#[0-9A-Fa-f]{6})\](.*?)\[\/color\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index) });
    }
    segments.push({
      text: match[2],
      color: match[1],
      bold: true,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex) });
  }

  return segments;
}
