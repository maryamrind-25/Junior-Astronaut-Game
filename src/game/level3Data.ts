import {
  CadetProfile,
  Level3PriorityId,
  ResourceKey,
  ReyesExpression,
} from './types';

export interface Level3PartMeta {
  part: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  narration: string;
  reyesLine: string;
  reyesExpr: ReyesExpression;
  firstStep: number;
  lastStep: number;
  partLessonSummary?: string;
}

export const LEVEL3_PARTS: Record<1 | 2 | 3 | 4, Level3PartMeta> = {
  1: {
    part: 1,
    title: 'Part 1 · Mars Arrival & Landing',
    subtitle: 'Level 3 · Mars Touchdown Zone',
    narration:
      'Red Martian regolith stretches to the crater rim beneath thin salmon clouds as our landing beacon scans the surface.',
    reyesLine:
      'This is the part they will remember, Cadet. Take a breath. We are landing on [color=#FF8C42]Mars[/color].',
    reyesExpr: 'normal',
    firstStep: 1,
    lastStep: 3,
  },
  2: {
    part: 2,
    title: 'Part 2 · Mars Outpost: First Days',
    subtitle: 'Level 4 · Setting Up Camp',
    narration:
      'Footprints in Mars dust. Our outpost is still just a pile of crates, and Sprout sits quietly in its hydroponics tray.',
    reyesLine:
      'Touchdown confirmed! Every Mars outpost starts with four big questions: air, food, shelter, and power.',
    reyesExpr: 'happy',
    firstStep: 4,
    lastStep: 7,
    partLessonSummary:
      'Every Mars outpost starts with the same 4 questions: air, food, shelter, and power.',
  },
  3: {
    part: 3,
    title: 'Part 3 · Mars Outpost: Under Pressure',
    subtitle: 'Level 5 · Systems Tested',
    narration:
      'Weeks pass on the Martian plain. Our outpost is alive, humming with machines — but no longer shiny and new.',
    reyesLine:
      'Dust, leaks, and tired machines show up fast out here. Stay sharp, Cadet!',
    reyesExpr: 'normal',
    firstStep: 8,
    lastStep: 12,
  },
  4: {
    part: 4,
    title: 'Part 4 · Mars Outpost: Crisis',
    subtitle: 'Level 6 · Compounding Emergencies',
    narration:
      'Multiple amber alarms chime across the habitat hub while dusty winds howl across the solar field outside.',
    reyesLine:
      'Now it gets real. Problems arrive together on [color=#FF8C42]Mars[/color].',
    reyesExpr: 'worried',
    firstStep: 13,
    lastStep: 16,
  },
};

export interface Level3ChoiceOutcome {
  deltas: Partial<Record<ResourceKey, number>>;
  cartridgeDelta?: number;
  repairKitDelta?: number;
  outcomeExpr: ReyesExpression;
  outcomeReyes: string;
  outcomeSummary: string;
  isRisky: boolean;
}

export interface Level3ChoiceSpec {
  letter: 'A' | 'B' | 'C';
  label: string;
  effectText: string;
  sideEffectText: string;
  realMarsTip: string;
  resolve: (profile: CadetProfile) => Level3ChoiceOutcome;
}

export type Level3StepSpec =
  | {
      kind: 'choice';
      stepIndex: number; // 1..17
      part: 1 | 2 | 3 | 4;
      id: string;
      numberLabel: string;
      title: string;
      narration: string;
      ariaReport?: string;
      mcDelayedMessage?: {
        delayMinutes: number;
        message: string;
      };
      reyesPrompt?: string;
      choices: [Level3ChoiceSpec, Level3ChoiceSpec, Level3ChoiceSpec];
      lesson: string;
    }
  | {
      kind: 'minigame_landing' | 'minigame_leak' | 'finale_ranking';
      stepIndex: number;
      part: 1 | 2 | 3 | 4 | 5;
      id: string;
      numberLabel: string;
      title: string;
    };

export const LEVEL3_STEPS: Level3StepSpec[] = [
  // PART 1: LANDING (Steps 1-3)
  {
    kind: 'choice',
    stepIndex: 1,
    part: 1,
    id: '3.1',
    numberLabel: 'Scene 3.1',
    title: 'Choose a Mars Landing Site',
    narration:
      'Our surface beacon scans the surrounding Martian plain. Three permanent landing zones show up on your ground radar.',
    ariaReport:
      'Site A: Flat basin, low ice. Site B: Crater rim, buried water ice detected. Site C: High plateau, extra approach burn.',
    reyesPrompt:
      'Where should we set this lander down on Mars, Cadet?',
    choices: [
      {
        letter: 'A',
        label: 'Flat, safe plain',
        effectText: 'Risk low, Power normal',
        sideEffectText: 'Resources far (Science -5%)',
        realMarsTip:
          'Flat volcanic plains are easiest to land on safely, though ice and diverse rocks lie farther away.',
        resolve: () => ({
          deltas: { science: -5, shield: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Smart, safe landing spot! We will just drive farther with our rover later for science samples.',
          outcomeSummary: 'Low Risk, Shield +5, Science -5',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Near resources (ice / sunlight)',
        effectText: 'Water +20%, Power +10%',
        sideEffectText: 'Rough landing risk (Shield -10%)',
        realMarsTip:
          'Landing near subsurface Martian ice gives huge water & fuel payoffs if shields handle rocky boulders.',
        resolve: () => ({
          deltas: { water: 20, power: 10, shield: -10, science: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Bold resource pick![/color] Buried ice nearby will help our outpost thrive.',
          outcomeSummary: 'Water +20, Power +10, Shield -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Far from hazards',
        effectText: 'Risk very low',
        sideEffectText: 'Travel time + (Fuel -10%, Food -5%)',
        realMarsTip:
          'Over-cautious detours burn extra descent fuel and stretch rover supply runs.',
        resolve: () => ({
          deltas: { fuel: -10, food: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Safe terrain locked in, though flying around the crater burned extra fuel.',
          outcomeSummary: 'Fuel -10, Food -5',
          isRisky: false,
        }),
      },
    ],
    lesson: 'Best site for safety is rarely best for resources on Mars.',
  },
  {
    kind: 'minigame_landing',
    stepIndex: 2,
    part: 1,
    id: 'MG-1',
    numberLabel: 'Mini-Game 1',
    title: 'Mars Landing Descent',
  },
  {
    kind: 'choice',
    stepIndex: 3,
    part: 1,
    id: '3.2',
    numberLabel: 'Scene 3.2',
    title: 'Mars Landing Burn',
    narration:
      'Dust billows around our landing legs as the retro-rockets ignite for final touchdown on Mars!',
    ariaReport:
      'Mars gravity: 3.72 m/s². Final vertical velocity correction active.',
    reyesPrompt:
      'Final thruster burn, Cadet! How do we finish this touchdown?',
    choices: [
      {
        letter: 'A',
        label: 'Slow, gentle burn',
        effectText: 'Gentle touchdown (Health 0)',
        sideEffectText: 'Fuel -15%',
        realMarsTip:
          'A long slow hover burn protects crew and cargo legs at a steady fuel cost.',
        resolve: () => ({
          deltas: { fuel: -15, morale: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Soft like a feather! That gentle hover used a bit more fuel, but every crate is intact.',
          outcomeSummary: 'Fuel -15, Smooth Touchdown',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Fast, late braking',
        effectText: 'Rapid arrival',
        sideEffectText: 'Fuel -30%, Health -10%',
        realMarsTip:
          'Late suicide burns waste propellant correcting overshoot and jolt the crew hard.',
        resolve: () => ({
          deltas: { fuel: -30, health: -10, morale: -5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Oof, what a jolt! Late braking cost us [color=#FF4D6D]Fuel and bruised the crew[/color].',
          outcomeSummary: 'Fuel -30, Health -10',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Balanced burn',
        effectText: 'Fuel -10%, Health -5% (Best if Landing Game passed!)',
        sideEffectText: 'If landing missed: Fuel -18%, Health -10%',
        realMarsTip:
          'Precise guided burns use Mars thin air drag first, then balanced retro-thrust.',
        resolve: (prof) =>
          prof.level3LandingPassed
            ? {
                deltas: { fuel: -10, health: -5, morale: 10 },
                outcomeExpr: 'happy',
                outcomeReyes:
                  '[color=#2EE59D]Textbook balanced burn![/color] Your earlier landing control made that touchdown effortless.',
                outcomeSummary: 'Timing Passed · Fuel -10, Health -5',
                isRisky: false,
              }
            : {
                deltas: { fuel: -18, health: -10 },
                outcomeExpr: 'worried',
                outcomeReyes:
                  'Coming in off-center forced a rougher correction burn on touchdown.',
                outcomeSummary: 'Off-target · Fuel -18, Health -10',
                isRisky: true,
              },
      },
    ],
    lesson:
      'Mars gravity is smaller than Earth, but Mars thin air cannot slow a heavy ship alone — landing still needs fuel and timing.',
  },

  // PART 2: FIRST DAYS (Steps 4-7)
  {
    kind: 'choice',
    stepIndex: 4,
    part: 2,
    id: '4.1',
    numberLabel: 'Scene 4.1',
    title: 'Where Does Our Air Come From on Mars?',
    narration:
      'Mars atmosphere is 95% carbon dioxide — unbreathable for humans. Time to set up habitat air.',
    ariaReport:
      'External air pressure: 0.006 bar CO2. Habitat O2 system awaiting mode selection.',
    choices: [
      {
        letter: 'A',
        label: 'Oxygen tanks only',
        effectText: 'Power saved',
        sideEffectText: 'O2 slowly declines (-12%)',
        realMarsTip:
          'Relying only on Earth tanks empties finite oxygen without making new air on Mars.',
        resolve: () => ({
          deltas: { oxygen: -12 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Tanks are running down faster than expected. We will need local oxygen production soon!',
          outcomeSummary: 'O2 -12 (slow decline)',
          isRisky: true,
        }),
      },
      {
        letter: 'B',
        label: 'Electrolysis',
        effectText: 'O2 +5% (stable air)',
        sideEffectText: 'Power -15%, Water -10%',
        realMarsTip:
          'Splitting mined water with electricity produces breathable O2 and rocket fuel.',
        resolve: () => ({
          deltas: { oxygen: 5, power: -15, water: -10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Electrolysis bubbled to life! Fresh oxygen is flowing, using water and power.',
          outcomeSummary: 'O2 stable, Power -15, Water -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Both (tanks + electrolysis)',
        effectText: 'O2 +5% (stable air)',
        sideEffectText: 'Mass -8%, Power -8%',
        realMarsTip:
          'NASA habitats pair tank reserves with water electrolysis and MOXIE CO2-splitting redundancy.',
        resolve: () => ({
          deltas: { oxygen: 5, mass: -8, power: -8, science: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Balanced redundancy![/color] Running both keeps our air steady for modest power.',
          outcomeSummary: 'O2 stable, Mass -8, Power -8',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Mars air is mostly CO2. Real Mars crews split water (electrolysis) or Martian CO2 (MOXIE) to make breathable oxygen.',
  },
  {
    kind: 'choice',
    stepIndex: 5,
    part: 2,
    id: '4.2',
    numberLabel: 'Scene 4.2',
    title: 'What Will We Eat on Mars?',
    narration:
      'Inventory crates hold freeze-dried rations, while Sprout waits under LED lights for soil and water.',
    ariaReport:
      'Crew nutrition index: 100%. Sprout hydroponic bay ready.',
    choices: [
      {
        letter: 'A',
        label: 'Packaged food only',
        effectText: 'Zero prep time',
        sideEffectText: 'Food -10%, Morale -10%',
        realMarsTip:
          'Eating only freeze-dried rations lowers crew morale and skips fresh vitamins.',
        resolve: () => ({
          deltas: { food: -10, morale: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Same salty pouch every night? Crew morale dipped without fresh greens.',
          outcomeSummary: 'Food -10, Morale -10',
          isRisky: true,
        }),
      },
      {
        letter: 'B',
        label: 'Grow plants only',
        effectText: 'Sprout +10% growth',
        sideEffectText: 'Food -10% early, Power -10%',
        realMarsTip:
          'Crops take weeks to mature, so relying 100% on plants creates an early calorie gap.',
        resolve: () => ({
          deltas: { food: -10, sproutHealth: 10, power: -10, science: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Sprout loves the full greenhouse bay, though our stomachs grumbled waiting for harvest.',
          outcomeSummary: 'Sprout +10, Food -10, Power -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Both (rations + Sprout garden)',
        effectText: 'Food +5%, Sprout +5%, Morale +5%',
        sideEffectText: 'Mass -5%, Power -5%',
        realMarsTip:
          'Combining shelf-stable Earth rations with fresh hydroponic greens keeps astronauts healthy and happy.',
        resolve: () => ({
          deltas: { food: 5, sproutHealth: 5, morale: 5, mass: -5, power: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Best of both worlds![/color] Warm rations now plus fresh lettuce leaves from Sprout!',
          outcomeSummary: 'Safe Food, Mass -5, Power -5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Fresh Mars-grown plants boost nutrition, recycle air, and lift astronaut morale alongside packed rations.',
  },
  {
    kind: 'choice',
    stepIndex: 6,
    part: 2,
    id: '4.3',
    numberLabel: 'Scene 4.3',
    title: 'Where Do We Build on Mars?',
    narration:
      'Mars lacks a strong magnetic field, so cosmic radiation hits the surface all day and night.',
    ariaReport:
      'Surface radiation: 2.4x higher than shielded regolith shelter.',
    choices: [
      {
        letter: 'A',
        label: 'On open surface',
        effectText: 'Fast setup & full Sun',
        sideEffectText: 'Shield -12%, Thermal -5%',
        realMarsTip:
          'Unshielded surface domes expose astronauts to constant cosmic rays and extreme night cold.',
        resolve: () => ({
          deltas: { shield: -12, thermal: -5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Quick to pitch, yes — but radiation sensors warn our walls are too thin.',
          outcomeSummary: 'Shield -12, Surface Camp',
          isRisky: true,
        }),
      },
      {
        letter: 'B',
        label: 'Cover dome with Mars soil',
        effectText: 'Shield +20%, Thermal +5%',
        sideEffectText: 'Digging effort (Suit -5%)',
        realMarsTip:
          'Piling Martian regolith over inflatable domes blocks radiation and stabilizes temperature.',
        resolve: () => ({
          deltas: { shield: 20, thermal: 5, suit: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Solid Martian masonry![/color] Regolith soil shields us from radiation.',
          outcomeSummary: 'Shield +20, Thermal +5, Suit -5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Build inside a lava tube cave',
        effectText: 'Shield +25%',
        sideEffectText: 'Power access -10% (long cable)',
        realMarsTip:
          'Ancient Mars volcanic lava tubes provide massive rock roofs against radiation and micrometeoroids.',
        resolve: () => ({
          deltas: { shield: 25, power: -10, science: 10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Natural fortress![/color] That cave roof gives awesome protection, even with longer power cables.',
          outcomeSummary: 'Shield +25, Power -10',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Covering habitats with Martian soil or building inside lava tubes protects crews from space radiation and temperature swings.',
  },
  {
    kind: 'choice',
    stepIndex: 7,
    part: 2,
    id: '4.4',
    numberLabel: 'Scene 4.4',
    title: 'How Do We Make Power on Mars?',
    narration:
      'A chilly Martian sunset approaches. Our base needs steady electricity through 12-hour freezing nights.',
    ariaReport:
      'Mars solar flux: 43% of Earth. Night low temperature: -78°C.',
    choices: [
      {
        letter: 'A',
        label: 'Solar panels only',
        effectText: 'Clean daytime energy',
        sideEffectText: 'Power -12% (day only, dark at night)',
        realMarsTip:
          'Solar panels drop to zero at sunset and lose output during regional Mars dust storms.',
        resolve: () => ({
          deltas: { power: -12, thermal: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Great during noon, Cadet, though heaters sagged through the freezing Martian night.',
          outcomeSummary: 'Power -12 (day only)',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Batteries only',
        effectText: 'Quiet overnight run',
        sideEffectText: 'Power -18% (gradual drain)',
        realMarsTip:
          'Batteries only store power — without generation, reserves deplete steadily.',
        resolve: () => ({
          deltas: { power: -18 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Batteries cannot recharge themselves! Reserve voltage is dropping.',
          outcomeSummary: 'Power -18 (declines)',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Small nuclear power unit',
        effectText: 'Power +15% (24/7 steady)',
        sideEffectText: 'Mass -10% (heavy unit)',
        realMarsTip:
          'Compact fission reactors (like NASA Kilopower) run reliably through Mars nights and multi-week dust storms.',
        resolve: () => ({
          deltas: { power: 15, mass: -10, morale: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]24/7 Mars power locked![/color] Even dust storms cannot shut down our reactor.',
          outcomeSummary: 'Power +15, Mass -10',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Every Mars outpost starts with the same 4 questions: air, food, shelter, and power.',
  },

  // PART 3: UNDER PRESSURE (Steps 8-12)
  {
    kind: 'choice',
    stepIndex: 8,
    part: 3,
    id: '5.1',
    numberLabel: 'Scene 5.1',
    title: 'The Scrubber Fails',
    narration:
      'Weeks into outpost life, the main CO2 air scrubber sputters to a halt. Stale air builds up in the hub.',
    ariaReport: 'Carbon dioxide rising: 1.4% and climbing. Action required.',
    choices: [
      {
        letter: 'A',
        label: 'Use backup cartridges',
        effectText: 'O2 +5% (clean air fast)',
        sideEffectText: 'Cartridges -3 (or O2 -10% if empty)',
        realMarsTip:
          'Chemical LiOH cartridges scrub CO2 instantly while preserving crew focus.',
        resolve: (prof) =>
          prof.co2Cartridges >= 3
            ? {
                deltas: { oxygen: 5 },
                cartridgeDelta: -3,
                outcomeExpr: 'happy',
                outcomeReyes:
                  '[color=#2EE59D]Air cleared immediately![/color] Good thing we packed backup cartridges.',
                outcomeSummary: 'O2 +5, Cartridges -3',
                isRisky: false,
              }
            : {
                deltas: { oxygen: -10 },
                cartridgeDelta: -prof.co2Cartridges,
                outcomeExpr: 'worried',
                outcomeReyes:
                  'Not enough cartridges left! Air quality dipped until we improvised.',
                outcomeSummary: 'Low Cartridges · O2 -10',
                isRisky: true,
              },
      },
      {
        letter: 'B',
        label: 'Repair the scrubber',
        effectText: 'Cartridges saved',
        sideEffectText: 'CO2 up during fix (Health -5%, Science -5%)',
        realMarsTip:
          'Fixing mechanical scrubbers keeps long-term reserves intact at a brief workload cost.',
        resolve: () => ({
          deltas: { health: -5, science: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Greasy knuckles, Cadet, but you rebuilt the blower motor and saved our cartridges.',
          outcomeSummary: 'Cartridges saved, Health -5, Science -5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Slow your activity',
        effectText: 'Less CO2 exhaled',
        sideEffectText: 'Science progress -15%',
        realMarsTip:
          'Resting cuts crew oxygen demand and CO2 output while delaying experiments.',
        resolve: () => ({
          deltas: { science: -15, morale: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Staying calm slowed CO2 buildup, though our geology experiments fell behind.',
          outcomeSummary: 'Science -15, Morale -5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'On Mars, removing exhaled carbon dioxide is just as urgent as supplying fresh oxygen.',
  },
  {
    kind: 'choice',
    stepIndex: 9,
    part: 3,
    id: '5.2',
    numberLabel: 'Scene 5.2',
    title: 'Sprout Is Struggling',
    narration:
      'You check the greenhouse tray. Sprout’s crisp green leaves have turned pale and weak.',
    ariaReport:
      'Chlorophyll index low. Hydroponic tray needs light, nutrients, or hardy seed swap.',
    choices: [
      {
        letter: 'A',
        label: 'Increase grow light intensity',
        effectText: 'Sprout +12%, Food +5%',
        sideEffectText: 'Power -10%',
        realMarsTip:
          'Full-spectrum LED lights drive photosynthesis when Martian sunlight is weak.',
        resolve: () => ({
          deltas: { sproutHealth: 12, food: 5, power: -10, morale: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Look at Sprout perk up![/color] Extra light turned those leaves deep green again.',
          outcomeSummary: 'Sprout +12, Food +5, Power -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Add more water & nutrients',
        effectText: 'Sprout +12%, Food +5%',
        sideEffectText: 'Water -10%',
        realMarsTip:
          'Balanced hydroponic mineral solution revives pale leaves rapidly.',
        resolve: () => ({
          deltas: { sproutHealth: 12, food: 5, water: -10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Fresh nutrients worked![/color] Sprout is drinking well and growing strong.',
          outcomeSummary: 'Sprout +12, Food +5, Water -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Switch to hardy root crops',
        effectText: 'Outpost stability + (Sprout +5%)',
        sideEffectText: 'Nutrition - (Food -8%, Morale -5%)',
        realMarsTip:
          'Hardy potatoes & radishes survive low light better, though less vitamin-rich than leafy greens.',
        resolve: () => ({
          deltas: { sproutHealth: 5, food: -8, morale: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Hardy tubers are safer under stress, though the crew misses fresh salad.',
          outcomeSummary: 'Stability +5, Food -8, Morale -5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Plants in space act as living health monitors — pale leaves warn of light, water, or mineral trouble early.',
  },
  {
    kind: 'minigame_leak',
    stepIndex: 10,
    part: 3,
    id: 'MG-2',
    numberLabel: 'Mini-Game 2',
    title: 'Fix The Habitat Leak!',
  },
  {
    kind: 'choice',
    stepIndex: 11,
    part: 3,
    id: '5.3',
    numberLabel: 'Scene 5.3',
    title: 'Micrometeoroid Swarm on Mars',
    narration:
      'Pings rattle across the habitat roof like metallic rain as tiny space pebbles pierce Mars’ thin atmosphere.',
    ariaReport:
      'Mars surface pressure too thin to vaporize micrometeoroids. Hull impacts rising.',
    choices: [
      {
        letter: 'A',
        label: 'Add extra outer armor layer',
        effectText: 'Shield +15%',
        sideEffectText: 'Mass -10% (cargo panels used)',
        realMarsTip:
          'Reusing empty lander panels and sandbags strengthens habitat roofs against fast pebbles.',
        resolve: () => ({
          deltas: { shield: 15, mass: -10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Smart shielding![/color] Those outer cargo plates deflected the swarm cleanly.',
          outcomeSummary: 'Shield +15, Mass -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Move crew to inner core room',
        effectText: 'Crew safety high',
        sideEffectText: 'Work stops (Science -10%)',
        realMarsTip:
          'Shelter in inner airlocks whenever high-flux meteor showers cross Mars.',
        resolve: () => ({
          deltas: { science: -10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Everyone stayed safe inside the core bay until the pebble shower ended.',
          outcomeSummary: 'Crew safe, Science -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Patch dents afterwards',
        effectText: 'No delay to work',
        sideEffectText: 'O2 -10%',
        realMarsTip:
          'Reactive patching risks slow cabin air leaks before repairs finish.',
        resolve: () => ({
          deltas: { oxygen: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Two pebbles poked pinholes in the dome! Patching afterward cost us [color=#FF4D6D]10% O2[/color].',
          outcomeSummary: 'O2 -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Mars’ atmosphere is 100 times thinner than Earth’s, so tiny meteoroids hit the ground instead of burning up as shooting stars.',
  },
  {
    kind: 'choice',
    stepIndex: 12,
    part: 3,
    id: '5.4',
    numberLabel: 'Scene 5.4',
    title: 'Long Night & Global Mars Dust Storm',
    narration:
      'The Sun disappears behind a towering amber wall of Martian dust. Solar panels go dark for weeks.',
    ariaReport:
      'Solar generation: 4%. Storm duration estimate: 21 sols.',
    choices: [
      {
        letter: 'A',
        label: 'Drain main batteries',
        effectText: 'All outpost labs stay active',
        sideEffectText: 'Power -25%',
        realMarsTip:
          'Running full science loads during a multi-week Mars dust storm drains batteries dangerously low.',
        resolve: () => ({
          deltas: { power: -25, science: 5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Labs kept running, but our main batteries took a [color=#FF4D6D]heavy 25% hit[/color].',
          outcomeSummary: 'Power -25, Science +5',
          isRisky: true,
        }),
      },
      {
        letter: 'B',
        label: 'Shut down non-essentials',
        effectText: 'Power +5% saved',
        sideEffectText: 'Science -10%, Crops paused (Sprout -10%, Food -5%)',
        realMarsTip:
          'NASA rovers and habitats hibernate non-essential gear to survive global dust storms.',
        resolve: () => ({
          deltas: { power: 5, science: -10, sproutHealth: -10, food: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Tough hibernation call, Cadet, though our main power grid stayed healthy.',
          outcomeSummary: 'Power +5, Science -10, Sprout -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Switch to backup fuel cell power',
        effectText: 'Outpost systems & Sprout steady',
        sideEffectText: 'Fuel -20% (reserve consumed)',
        realMarsTip:
          'Backup fuel cells carry critical loads when one energy source fails.',
        resolve: () => ({
          deltas: { fuel: -20, power: 10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Backup reserve saved the day![/color] That is why we always build margins.',
          outcomeSummary: 'Power +10, Reserve Fuel -20',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Good plans have margins. When one system fails during a weeks-long Mars dust storm, backup systems must carry the load.',
  },

  // PART 4: CRISIS (Steps 13-16)
  {
    kind: 'choice',
    stepIndex: 13,
    part: 4,
    id: '6.1',
    numberLabel: 'Scene 6.1',
    title: 'Dirty Water, Falling Oxygen Together',
    narration:
      'Two critical alarms sound at once! Dust clogged the water recycler right as oxygen generation dropped.',
    ariaReport:
      'Water purity: 42% (fault). O2 generation: 55% (falling).',
    choices: [
      {
        letter: 'A',
        label: 'Flush and restart water loop',
        effectText: 'Clean water loop restored',
        sideEffectText: 'Water -20%, Power -10%',
        realMarsTip:
          'Flushing clogged loops wastes reserve water but prevents bacterial biofilm damage.',
        resolve: () => ({
          deltas: { water: -20, power: -10, health: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Water loop is spotless again, though flushing cost reserve water and power.',
          outcomeSummary: 'Water -20, Power -10, Loop Clean',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Fix oxygen first, use reserve water',
        effectText: 'O2 +10% stabilized',
        sideEffectText: 'Water -15%',
        realMarsTip:
          'Always stabilize breathable air before water, since humans survive minutes without O2 vs days without water.',
        resolve: () => ({
          deltas: { oxygen: 10, water: -15 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Right priority order![/color] Air comes first, and reserve water kept us going.',
          outcomeSummary: 'O2 +10, Water -15',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Split the crew to fix both',
        effectText: 'Chance to fix both (+O2, +Water)',
        sideEffectText: 'Morale -10% (high stress if low morale fails)',
        realMarsTip:
          'Dividing a tired crew works only if team morale and training stay high.',
        resolve: (prof) =>
          prof.resources.morale >= 70
            ? {
                deltas: { oxygen: 8, water: 5, morale: -10 },
                outcomeExpr: 'happy',
                outcomeReyes:
                  '[color=#2EE59D]Great teamwork under stress![/color] Both teams fixed their loops in time.',
                outcomeSummary: 'Both Fixed · O2 +8, Water +5, Morale -10',
                isRisky: false,
              }
            : {
                deltas: { oxygen: -10, water: -10, morale: -15 },
                outcomeExpr: 'worried',
                outcomeReyes:
                  'Too exhausted! Splitting up stretched the team thin and [color=#FF4D6D]both loops slipped[/color].',
                outcomeSummary: 'Split Failed · O2 -10, Water -10',
                isRisky: true,
              },
      },
    ],
    lesson:
      'In simultaneous emergencies, remember the Rule of Threes: minutes without air, days without water, weeks without food.',
  },
  {
    kind: 'choice',
    stepIndex: 14,
    part: 4,
    id: '6.2',
    numberLabel: 'Scene 6.2',
    title: 'Plant Disease During Low Power',
    narration:
      'Brown fungal spots spread across half of the greenhouse tray while power reserves run tight.',
    ariaReport:
      'Botanical blight detected in 40% of crops. Power reserve: constrained.',
    choices: [
      {
        letter: 'A',
        label: 'Destroy infected plants',
        effectText: 'Remaining crops 100% safe',
        sideEffectText: 'Food -15%, Sprout -10%',
        realMarsTip:
          'Removing infected seedlings quickly stops fungal spores from wiping out the whole greenhouse.',
        resolve: () => ({
          deltas: { food: -15, sproutHealth: -10, science: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Hard call, Cadet, yet cutting out the blight protected the rest of our greenhouse.',
          outcomeSummary: 'Food -15, Sprout -10, Blight Stopped',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Isolate tray & study',
        effectText: 'Sprout +5% chance, Science +5%',
        sideEffectText: 'Risk remains (Food -8%)',
        realMarsTip:
          'Quarantine tents isolate sick plants without discarding healthy backup shoots.',
        resolve: () => ({
          deltas: { sproutHealth: 5, food: -8, science: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Smart quarantine![/color] Isolating the tray saved Sprout and taught us how Martian humidity spreads mold.',
          outcomeSummary: 'Sprout +5, Food -8, Science +5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Cut crop lights to save power',
        effectText: 'Power +12%',
        sideEffectText: 'Food -25%, Sprout -15%',
        realMarsTip:
          'Shutting off grow lights weakens healthy plants and worsens fungal rot in dark damp air.',
        resolve: () => ({
          deltas: { power: 12, food: -25, sproutHealth: -15, morale: -5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Darkness fed the mold! We gained power, but [color=#FF4D6D]lost a huge share of crops[/color].',
          outcomeSummary: 'Power +12, Food -25, Sprout -15',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Closed-loop Martian greenhouses must quarantine plant disease fast — there are no seed stores next door.',
  },
  {
    kind: 'choice',
    stepIndex: 15,
    part: 4,
    id: '6.3',
    numberLabel: 'Scene 6.3',
    title: 'Radiation During Mars Spacewalk',
    narration:
      'A teammate is repairing an outdoor weather mast 300 meters away when a solar flare radiation siren blares!',
    ariaReport:
      'Solar particle spike incoming! Unshielded EVA exposure dangerous in 3 minutes.',
    choices: [
      {
        letter: 'A',
        label: 'Recall teammate now',
        effectText: 'Crew health safe (Health 0)',
        sideEffectText: 'Weather mast unfinished (Science -10%)',
        realMarsTip:
          'Human safety always overrides science equipment on Mars.',
        resolve: () => ({
          deltas: { science: -10, morale: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Crew life comes first![/color] They sprinted straight back through the airlock in time.',
          outcomeSummary: 'Crew Safe, Science -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Let them finish short task',
        effectText: 'Weather mast done (Science +10%)',
        sideEffectText: 'Health -15%',
        realMarsTip:
          'Delaying shelter during solar flares causes dangerous radiation doses.',
        resolve: () => ({
          deltas: { health: -15, science: 10, morale: -5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'The sensor works, but your crewmate took a [color=#FF4D6D]radiation dose[/color]. Never gamble with flares!',
          outcomeSummary: 'Health -15, Science +10',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Shelter inside nearby rover',
        effectText: 'Moderate shielding (Science -5%)',
        sideEffectText: 'Health -5%',
        realMarsTip:
          'Pressurized rovers act as emergency storm shelters when habitats are too far to reach on foot.',
        resolve: () => ({
          deltas: { health: -5, science: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Smart field thinking — crouching inside the rover’s heavy battery bay blocked most of the flare.',
          outcomeSummary: 'Health -5, Science -5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Mars has no thick magnetic shield like Earth, so spacewalking astronauts must shelter immediately when a solar flare hits.',
  },
  {
    kind: 'choice',
    stepIndex: 16,
    part: 4,
    id: '6.4',
    numberLabel: 'Scene 6.4',
    title: 'Power Triage on Mars',
    narration:
      'Total outpost power drops sharply as storm clouds thicken. We cannot power everything at once.',
    mcDelayedMessage: {
      delayMinutes: 16,
      message:
        'Mission Control: Telemetry shows storm widening. Emergency troubleshooting will lag up to 24 minutes each way — prioritize survival systems!',
    },
    reyesPrompt:
      'Earth’s message took 16 minutes to get here. Triage our outpost systems right now!',
    choices: [
      {
        letter: 'A',
        label: 'Life support, heat, then comms',
        effectText: 'Air & heat protected (O2 +5%, Thermal +5%)',
        sideEffectText: 'Food -10%, Science -10%',
        realMarsTip:
          'Power triage always guards breathable air and thermal survival before science or radio power.',
        resolve: () => ({
          deltas: { oxygen: 5, thermal: 5, food: -10, science: -10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Textbook power triage![/color] Air and cabin warmth stayed rock solid.',
          outcomeSummary: 'O2 +5, Thermal +5, Food -10, Science -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Keep crops lit, lower cabin heat',
        effectText: 'Sprout +5%, Food +5%',
        sideEffectText: 'Thermal -15%, Morale -5%',
        realMarsTip:
          'Freezing the crew habitat saves plants short-term but risks hypothermia and frozen pipes.',
        resolve: () => ({
          deltas: { sproutHealth: 5, food: 5, thermal: -15, morale: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Sprout stayed cozy, though we are shivering in parkas inside the hub!',
          outcomeSummary: 'Sprout +5, Thermal -15',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Boost comms for Earth help',
        effectText: 'High-gain Earth dish online',
        sideEffectText: 'Earth delay 4–24 min · Power -15%, Health -10%, Thermal -10%',
        realMarsTip:
          'Because Earth-Mars radio delay is 4–24 minutes each way, Earth cannot rescue an outpost in real time.',
        resolve: () => ({
          deltas: { power: -15, health: -10, thermal: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'High-gain radio drained our grid while we waited 16 minutes for a reply! [color=#FF4D6D]You are the commander on Mars.[/color]',
          outcomeSummary: 'Delayed Help · Power -15, Health -10, Thermal -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Mars radio signals take 4 to 24 minutes each way. Real Mars crews must run power triage themselves — life support and heat come first.',
  },

  // STEP 17: FINALE RANKING
  {
    kind: 'finale_ranking',
    stepIndex: 17,
    part: 5,
    id: 'FINALE',
    numberLabel: 'Scene 6.5 · Finale',
    title: 'The Storm of Everything',
  },
];

export interface FinalePrioritySpec {
  id: Level3PriorityId;
  label: string;
  resourceKey: ResourceKey;
  rank1Summary: string;
  rank4Summary: string;
  deltasByRank: [
    Partial<Record<ResourceKey, number>>, // Rank 1
    Partial<Record<ResourceKey, number>>, // Rank 2
    Partial<Record<ResourceKey, number>>, // Rank 3
    Partial<Record<ResourceKey, number>>, // Rank 4
  ];
}

export const FINALE_PRIORITIES: Record<Level3PriorityId, FinalePrioritySpec> = {
  air: {
    id: 'air',
    label: 'Air (Life Support & O2)',
    resourceKey: 'oxygen',
    rank1Summary: 'O2 +20, Crew safe',
    rank4Summary: 'O2 -30, Crew cannot breathe',
    deltasByRank: [
      { oxygen: 20, health: 10 },
      { oxygen: 8 },
      { oxygen: -8 },
      { oxygen: -30, health: -15 },
    ],
  },
  power: {
    id: 'power',
    label: 'Power (Habitat Grid)',
    resourceKey: 'power',
    rank1Summary: 'Power +20, Lights stay on',
    rank4Summary: 'Power -30, Outpost goes dark',
    deltasByRank: [
      { power: 20, thermal: 5 },
      { power: 8 },
      { power: -8 },
      { power: -30, thermal: -10 },
    ],
  },
  food: {
    id: 'food',
    label: 'Food (Crops & Sprout)',
    resourceKey: 'food',
    rank1Summary: 'Food +20, Sprout survives',
    rank4Summary: 'Food -25, Sprout dies',
    deltasByRank: [
      { food: 20, sproutHealth: 20, morale: 10 },
      { food: 8, sproutHealth: 8 },
      { food: -8, sproutHealth: -8 },
      { food: -25, sproutHealth: -30, morale: -10 },
    ],
  },
  shield: {
    id: 'shield',
    label: 'Shield (Radiation Armor)',
    resourceKey: 'shield',
    rank1Summary: 'Shield +20, Radiation safe',
    rank4Summary: 'Shield -25, Radiation damage',
    deltasByRank: [
      { shield: 20, health: 5 },
      { shield: 8 },
      { shield: -8 },
      { shield: -25, health: -15 },
    ],
  },
};
