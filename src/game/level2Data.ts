import { CadetProfile, ResourceKey, ReyesExpression } from './types';

export interface MarsChoiceOutcome {
  deltas: Partial<Record<ResourceKey, number>>;
  repairKitDelta?: number;
  outcomeExpr: ReyesExpression;
  outcomeReyes: string;
  outcomeSummary: string;
  isRisky: boolean;
}

export interface MarsHazardChoice {
  letter: 'A' | 'B' | 'C';
  label: string;
  effectText: string;
  sideEffectText: string;
  realMarsTip: string;
  resolve: (profile: CadetProfile) => MarsChoiceOutcome;
}

export interface MarsHazardSceneSpec {
  index: number; // 1..11
  id: string;
  numberLabel: string;
  title: string;
  narration: string;
  fixPrompt: string;
  fixButtonLabel: string;
  fixAttemptResult: string;
  reyesPrompt?: string;
  ariaReport?: string;
  mcDelayedMessage?: {
    delayMinutes: number;
    message: string;
  };
  choices: [MarsHazardChoice, MarsHazardChoice, MarsHazardChoice];
  lesson: string;
}

export const MARS_TRANSIT_SCENES: MarsHazardSceneSpec[] = [
  {
    index: 1,
    id: '2.1',
    numberLabel: 'Scene 2.1',
    title: 'Mars Dust Storm',
    narration:
      'Fine red dust sweeps across the solar wing and camera lenses as we adjust our Mars-bound array.',
    fixPrompt:
      'Red dust is coating the solar wing! Try running the electrostatic wipers first.',
    fixButtonLabel: 'Try Solar Wipers',
    fixAttemptResult:
      'Wipers cleared loose grains, but sticky static dust keeps building — pick your strategy!',
    ariaReport:
      'Solar efficiency dropping to 62%. Sticky electrostatic dust coating 38% of array cells.',
    reyesPrompt:
      'That red dust is sharp and sticky, Cadet. How should we handle the power drop?',
    choices: [
      {
        letter: 'A',
        label: 'Shelter in habitat',
        effectText: 'Suit stays clean & safe',
        sideEffectText: 'Power -15%',
        realMarsTip:
          'Shelter inside during peak dust gusts and rely on stored battery reserves.',
        resolve: () => ({
          deltas: { power: -15 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Safe choice. Your suit stayed clean, though our battery reserve took a dip.',
          outcomeSummary: 'Power -15, Suit safe',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Keep working and clean panels',
        effectText: 'Power +10%',
        sideEffectText: 'Suit -15%',
        realMarsTip:
          'Never risk suit seals in abrasive dust when automated wipers or power rationing work.',
        resolve: () => ({
          deltas: { power: 10, suit: -15 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Power is back up, but those sharp dust grains scratched your [color=#FF4D6D]suit seals[/color].',
          outcomeSummary: 'Power +10, Suit -15',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Cut non-essential systems',
        effectText: 'Power +10%',
        sideEffectText: 'Food -5% (grow lights dimmed)',
        realMarsTip:
          'Smart load-shedding saves power without risking crew suits.',
        resolve: () => ({
          deltas: { power: 10, food: -5, sproutHealth: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Smart load management![/color] Turning down extras kept the ship steady.',
          outcomeSummary: 'Power +10, Food -5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Mars dust blocks sunlight and sticks to surfaces with static charge. Global Mars storms can last for weeks.',
  },
  {
    index: 2,
    id: '2.2',
    numberLabel: 'Scene 2.2',
    title: 'Solar Storm',
    narration:
      'Warning lights pulse amber in the cabin. A burst of high-energy solar particles is racing toward our Mars trajectory.',
    fixPrompt:
      'Radiation alarm is flashing! Try testing the storm deflectors & hull sensors first.',
    fixButtonLabel: 'Test Storm Deflectors',
    fixAttemptResult:
      'Deflectors trimmed minor static, but the main proton wave is arriving — decide how to protect the crew!',
    mcDelayedMessage: {
      delayMinutes: 12,
      message:
        'Mission Control: Radiation spike expected along Mars corridor. Immediate help will be late due to Earth-Mars light delay.',
    },
    reyesPrompt:
      'Earth sent that warning 12 minutes ago — we are on our own right now. Make the call!',
    choices: [
      {
        letter: 'A',
        label: 'Move to shielded core',
        effectText: 'Crew radiation stays low',
        sideEffectText: 'Work stops · Power -5%',
        realMarsTip:
          'Real Mars crews shelter inside water-walled storm shelters at the core of the ship.',
        resolve: () => ({
          deltas: { power: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Good call, Cadet.[/color] Water tanks around the core blocked the worst radiation.',
          outcomeSummary: 'Radiation low, Power -5',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Turn heavy side to Sun',
        effectText: 'Shield stays intact',
        sideEffectText: 'Fuel -10%',
        realMarsTip:
          'Orienting propulsion mass toward the Sun shields electronics at a small fuel cost.',
        resolve: () => ({
          deltas: { fuel: -10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Smart maneuver! Using our heavy hull as a shield protected us, costing a bit of fuel.',
          outcomeSummary: 'Fuel -10, Shield OK',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Ignore the alert',
        effectText: 'No schedule delay',
        sideEffectText: 'Health -30%, Power -15% (electronics reset)',
        realMarsTip:
          'Ignoring solar proton events risks acute crew sickness and fried avionics.',
        resolve: () => ({
          deltas: { health: -30, power: -15 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Ouch! Charged particles hit our [color=#FF4D6D]crew health and electronics[/color]. Always respect solar storms.',
          outcomeSummary: 'Health -30, Power -15',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Solar storms send fast charged particles across space. Shelter behind the most mass — like water tanks and cargo — because Mars has no strong magnetic shield.',
  },
  {
    index: 3,
    id: '2.3',
    numberLabel: 'Scene 2.3',
    title: 'Space Junk',
    narration:
      'Long-range radar pings a fast-moving fragment crossing our orbital transfer lane on the way to Mars.',
    fixPrompt:
      'Fast space junk is crossing our lane! Try scanning its trajectory & priming thrusters.',
    fixButtonLabel: 'Scan & Prime Thrusters',
    fixAttemptResult:
      'Radar locked object at 11.4 km/s — choose how to handle the collision threat!',
    ariaReport:
      'Debris tracked: 1 object. Closing speed 11.4 km/s. Impact window in 28 seconds.',
    choices: [
      {
        letter: 'A',
        label: 'Avoidance burn',
        effectText: 'Zero hull damage',
        sideEffectText: 'Fuel -10%',
        realMarsTip:
          'Executing an early small thruster burn avoids hypervelocity collisions completely.',
        resolve: () => ({
          deltas: { fuel: -10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Clean dodge![/color] Spending a little fuel beats risking a hull puncture.',
          outcomeSummary: 'Fuel -10, Hull safe',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Trust the shield',
        effectText: 'Fuel saved',
        sideEffectText: 'Shield -15%',
        realMarsTip:
          'Whipple shields absorb minor impacts, though they degrade armor for later hazards.',
        resolve: () => ({
          deltas: { shield: -15 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Clang! Our Whipple shield took the hit, though the outer armor is thinner now.',
          outcomeSummary: 'Shield -15',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Ignore radar ping',
        effectText: 'No burn or prep',
        sideEffectText: 'Power -20%, O2 -10% (micro-leak)',
        realMarsTip:
          'Even paint-fleck debris at 11 km/s can sever power lines or puncture pressurized hulls.',
        resolve: () => ({
          deltas: { power: -20, oxygen: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Direct graze! Debris clipped a [color=#FF4D6D]power conduit and air line[/color].',
          outcomeSummary: 'Power -20, O2 -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Even tiny junk travels faster than a rifle bullet in space. Because kinetic energy grows with speed squared, avoiding debris is far safer than absorbing a hit.',
  },
  {
    index: 4,
    id: '2.4',
    numberLabel: 'Scene 2.4',
    title: 'Meteoroid',
    narration:
      'A sudden streak of white light flashes across the forward viewport as our ship passes through a faint comet dust stream.',
    fixPrompt:
      'Bright meteoroids are streaking past the window! Inspect hull armor sensors first.',
    fixButtonLabel: 'Inspect Hull Armor',
    fixAttemptResult:
      'Outer armor is holding for now, but micrometeoroid flux is +240% — choose your defense!',
    ariaReport:
      'Micrometeoroid flux elevated +240%. Hull stress sensors active.',
    choices: [
      {
        letter: 'A',
        label: 'Reinforce shield',
        effectText: 'Shield +10%',
        sideEffectText: 'Mass -10% (cargo shifted)',
        realMarsTip:
          'Shifting dense cargo panels outward reinforces Whipple armor against micrometeoroids.',
        resolve: () => ({
          deltas: { mass: -10, shield: 10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Great engineering![/color] Layered shielding absorbed the micrometeoroids cleanly.',
          outcomeSummary: 'Shield +10, Mass -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Move crew away from outer walls',
        effectText: 'Crew protected',
        sideEffectText: 'Fuel -5% (attitude drift)',
        realMarsTip:
          'Moving crew to interior compartments keeps people safe during dust-stream crossings.',
        resolve: () => ({
          deltas: { fuel: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Everyone stayed safe in the inner bay while the dust stream passed.',
          outcomeSummary: 'Crew safe, Fuel -5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Repair after impact',
        effectText: 'No pre-action taken',
        sideEffectText: 'O2 -15%, Repair Kit -1',
        realMarsTip:
          'Waiting until after impact wastes precious breathable oxygen and consumes repair kits.',
        resolve: (prof) => ({
          deltas: { oxygen: -15 },
          repairKitDelta: prof.repairKits > 0 ? -1 : 0,
          outcomeExpr: 'worried',
          outcomeReyes:
            prof.repairKits > 0
              ? 'We patched the hole, but we lost [color=#FF4D6D]oxygen and 1 Repair Kit[/color].'
              : 'No Repair Kit left! That impact leaked [color=#FF4D6D]precious oxygen[/color].',
          outcomeSummary: 'O2 -15, Repair Kit -1',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Micrometeoroids are tiny — often smaller than a grain of sand — yet travel tens of kilometers per second. Layered Whipple walls break them apart and spread the energy.',
  },
  {
    index: 5,
    id: '2.5',
    numberLabel: 'Scene 2.5',
    title: 'Extreme Heat',
    narration:
      'Unfiltered sunlight bakes the starboard hull. The cabin thermometer climbs steadily, and Sprout begins to droop in its tray.',
    fixPrompt:
      'Cabin heat is climbing and Sprout is drooping! Try checking the radiator valves first.',
    fixButtonLabel: 'Check Coolant Valves',
    fixAttemptResult:
      'Valves are open, yet cabin temp still reads 34.8°C — choose your cooling plan!',
    ariaReport:
      'Cabin temperature: 34.8°C and rising. Sprout leaf turgor dropping.',
    choices: [
      {
        letter: 'A',
        label: 'Turn on active cooling',
        effectText: 'Thermal +10%',
        sideEffectText: 'Power -10%, Water -5%',
        realMarsTip:
          'Closed-loop liquid radiators pull heat from the cabin and reject it safely to space.',
        resolve: () => ({
          deltas: { power: -10, water: -5, thermal: 10, sproutHealth: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            'Ah, much cooler! Look at [color=#2EE59D]Sprout perking right back up[/color].',
          outcomeSummary: 'Thermal +10, Power -10, Water -5',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Rotate to shade hot side',
        effectText: 'Thermal +5%, Power 0%',
        sideEffectText: 'Fuel -5%',
        realMarsTip:
          'Rotating shaded panels away from direct Sun reduces thermal buildup naturally.',
        resolve: () => ({
          deltas: { fuel: -5, thermal: 5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Rotating into shade cooled the hull nicely without draining battery power.',
          outcomeSummary: 'Thermal +5, Fuel -5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Do nothing',
        effectText: 'Zero power or fuel used',
        sideEffectText: 'Thermal -30%, Health -10%, Sprout -15%',
        realMarsTip:
          'Without active heat rejection, cabins rapidly overheat and wilt life-support plants.',
        resolve: () => ({
          deltas: { thermal: -30, health: -10, food: -10, sproutHealth: -15 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Way too hot in here! [color=#FF4D6D]Sprout is wilting[/color] and crew health dipped.',
          outcomeSummary: 'Thermal -30, Health -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'There is no air in space to carry heat away by wind or convection. Spacecraft can only shed heat by glowing infrared radiation out through radiator panels.',
  },
  {
    index: 6,
    id: '2.6',
    numberLabel: 'Scene 2.6',
    title: 'Oxygen Repair',
    narration:
      'A faint, steady hiss echoes near the storage bulkhead. Cabin pressure sensors confirm air is escaping.',
    fixPrompt:
      'Air is hissing out of the cabin bulkhead! Try clamping the leaking valve by hand first.',
    fixButtonLabel: 'Try Clamping Leak',
    fixAttemptResult:
      'Clamping slowed the hiss slightly, but air is still escaping — choose how to fix it properly!',
    ariaReport:
      'Oxygen pressure falling at 2.8% per minute. Remember: no resupply ships on the way to Mars.',
    choices: [
      {
        letter: 'A',
        label: 'Patch leak now',
        effectText: 'O2 stays stable',
        sideEffectText: 'Repair Kit -1',
        realMarsTip:
          'Finding and sealing the root leak immediately preserves critical Mars-transit oxygen.',
        resolve: (prof) =>
          prof.repairKits > 0
            ? {
                deltas: { oxygen: 5 },
                repairKitDelta: -1,
                outcomeExpr: 'happy',
                outcomeReyes:
                  '[color=#2EE59D]Great fix![/color] Good thing you brought a Repair Kit — the hiss stopped right away.',
                outcomeSummary: 'O2 stable, Repair Kit -1',
                isRisky: false,
              }
            : {
                deltas: { oxygen: -10, suit: -5 },
                outcomeExpr: 'worried',
                outcomeReyes:
                  'We improvised a patch since you had no Repair Kit, losing a little [color=#FF4D6D]oxygen[/color].',
                outcomeSummary: 'No Repair Kit · O2 -10',
                isRisky: false,
              },
      },
      {
        letter: 'B',
        label: 'Seal off module',
        effectText: 'O2 stays stable',
        sideEffectText: 'Mass -10% (equipment locked out)',
        realMarsTip:
          'Closing bulkhead hatches stops air loss immediately when a patch kit is unavailable.',
        resolve: () => ({
          deltas: { mass: -10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Hatch sealed. We saved our air, though we lost access to equipment inside that bay.',
          outcomeSummary: 'O2 stable, Mass -10',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Top up from reserves',
        effectText: 'No repair needed now',
        sideEffectText: 'O2 -25% over time',
        realMarsTip:
          'Pumping reserve oxygen into a leaking cabin empties tanks before reaching Mars.',
        resolve: () => ({
          deltas: { oxygen: -25 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Careful! Pumping extra air only hides the leak — our [color=#FF4D6D]oxygen dropped 25%[/color].',
          outcomeSummary: 'O2 -25 over time',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Always fix the cause of a leak, not just the symptom. On a months-long Mars transit, you cannot order an emergency oxygen delivery from Earth.',
  },
  {
    index: 7,
    id: '2.7',
    numberLabel: 'Scene 2.7',
    title: 'Battery Power',
    narration:
      'The main battery gauge flashes amber. Sunlight grows noticeably fainter as our ship coasts farther from the Sun toward Mars.',
    fixPrompt:
      'Cabin lights dimmed and battery is at 54%! Try resetting the main power bus first.',
    fixButtonLabel: 'Reset Power Bus',
    fixAttemptResult:
      'Bus reset finished, but sunlight is only 48% this far from the Sun — decide your power plan!',
    ariaReport:
      'Solar irradiance down to 48% of Earth orbit. Battery charge: 54%.',
    choices: [
      {
        letter: 'A',
        label: 'Angle panels toward Sun',
        effectText: 'Power +20%',
        sideEffectText: 'Brief tracking motor draw',
        realMarsTip:
          'Precision solar-array tracking maximizes every photon of weak outer-solar sunlight.',
        resolve: () => ({
          deltas: { power: 20 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Nice tracking![/color] Aiming the wings squarely at the Sun boosted our batteries.',
          outcomeSummary: 'Power +20',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Fold panels away',
        effectText: 'Panels protected',
        sideEffectText: 'Power -15%',
        realMarsTip:
          'Stowing solar wings is useful during thruster burns, not during normal cruise power shortages.',
        resolve: () => ({
          deltas: { power: -15 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Folding the wings kept them safe, but we missed out on charging our batteries.',
          outcomeSummary: 'Power -15',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Ignore low battery alert',
        effectText: 'No action taken',
        sideEffectText: 'Power -30%, O2 -10% (scrubber dip)',
        realMarsTip:
          'Low battery power starves CO2 scrubbers and oxygen generators.',
        resolve: () => ({
          deltas: { power: -30, oxygen: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Air scrubbers slowed down when [color=#FF4D6D]battery power dropped[/color]!',
          outcomeSummary: 'Power -30, O2 -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Solar panels must face the Sun directly, and batteries bridge the dark gaps. Mars receives less than half as much sunlight as Earth, so every watt counts.',
  },
  {
    index: 8,
    id: '2.8',
    numberLabel: 'Scene 2.8',
    title: 'Suit Integrity',
    narration:
      'During an exterior sensor check on the hull, your wrist suit gauge blinks yellow with a tiny pressure drop.',
    fixPrompt:
      'Ice crystals are leaking from your EVA wrist ring! Try twisting the glove lock tight.',
    fixButtonLabel: 'Tighten Wrist Lock',
    fixAttemptResult:
      'Lock feels firmer, but pressure is still slipping 0.8%/min — decide what to do next!',
    ariaReport:
      'EVA Suit wrist-ring pressure: 91% and slipping 0.8% per minute.',
    choices: [
      {
        letter: 'A',
        label: 'Return inside and repair',
        effectText: 'Suit +15%',
        sideEffectText: 'Fuel -5% (airlock cycle & delay)',
        realMarsTip:
          'Aborting a spacewalk early when a suit seal alerts is standard NASA safety protocol.',
        resolve: () => ({
          deltas: { suit: 15, fuel: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Smart and disciplined.[/color] Never gamble with a suit seal outside the airlock.',
          outcomeSummary: 'Suit +15, Fuel -5',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Patch on the spot',
        effectText: 'Suit +10% (short term)',
        sideEffectText: 'O2 -5%',
        realMarsTip:
          'Field patches buy minutes to get back to the airlock, not hours of extra work.',
        resolve: () => ({
          deltas: { suit: 10, oxygen: -5 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'The field tape held long enough, though you vented a little oxygen.',
          outcomeSummary: 'Suit +10, O2 -5',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Keep working outside',
        effectText: 'Task finished quickly',
        sideEffectText: 'Suit -25%, O2 -20%',
        realMarsTip:
          'A tiny pinhole leak in vacuum can rapidly escalate into an emergency depressurization.',
        resolve: () => ({
          deltas: { suit: -25, oxygen: -20 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Whoa, too close! That pinhole widened and drained [color=#FF4D6D]suit pressure and oxygen[/color].',
          outcomeSummary: 'Suit -25, O2 -20',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'A spacesuit is a tiny personal spaceship. Even a small leak in vacuum can turn into an emergency in seconds.',
  },
  {
    index: 9,
    id: '2.9',
    numberLabel: 'Scene 2.9',
    title: 'Thermal Balance',
    narration:
      'Halfway through cruise, the sunlit side of our spacecraft is scorching hot while the opposite shadow side builds frost.',
    fixPrompt:
      'Half the ship is baking while the other freezes! Test the attitude gyro wheels first.',
    fixButtonLabel: 'Test Attitude Gyros',
    fixAttemptResult:
      'Gyro wheels spun up cleanly — now choose how to balance the +112°C / -128°C hull split!',
    ariaReport:
      'Hull differential: +112°C sunlit side / -128°C shadow side.',
    choices: [
      {
        letter: 'A',
        label: 'Start a slow barbecue roll',
        effectText: 'Thermal +10%',
        sideEffectText: 'Power -2% (tiny gyro draw)',
        realMarsTip:
          'Apollo and Mars transit spacecraft use a gentle slow roll to heat all sides evenly.',
        resolve: () => ({
          deltas: { power: -2, thermal: 10 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Classic spaceflight trick![/color] A slow roll evens out hull temperature for almost zero power.',
          outcomeSummary: 'Thermal +10, Power -2',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Run heaters and coolers full blast',
        effectText: 'Thermal +10%',
        sideEffectText: 'Power -15%',
        realMarsTip:
          'Internal heaters work, though rotating the ship saves massive electrical power.',
        resolve: () => ({
          deltas: { power: -15, thermal: 10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Temperatures leveled out, though running both heaters and coolers cost extra power.',
          outcomeSummary: 'Thermal +10, Power -15',
          isRisky: false,
        }),
      },
      {
        letter: 'C',
        label: 'Stay fixed in one angle',
        effectText: 'No roll or heaters',
        sideEffectText: 'Thermal -30%, Power -10% (systems fail)',
        realMarsTip:
          'Extreme hot-cold warping strains joints and freezes propulsion valves.',
        resolve: () => ({
          deltas: { thermal: -30, power: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Frost jammed a valve and heat stressed the panels! [color=#FF4D6D]Thermal balance dropped[/color].',
          outcomeSummary: 'Thermal -30, Power -10',
          isRisky: true,
        }),
      },
    ],
    lesson:
      'Spacecraft rotate in a gentle "barbecue roll" to even out heat from the Sun so one side does not overheat while the other freezes.',
  },
  {
    index: 10,
    id: '2.10',
    numberLabel: 'Scene 2.10',
    title: 'Mars Gravity, Speed & Distance',
    narration:
      'The rusty red disk of Mars fills the forward window! Its gravity field begins tugging our ship faster toward capture.',
    fixPrompt:
      'Mars gravity is accelerating us! Fire a short guidance pulse to measure capture speed.',
    fixButtonLabel: 'Measure Capture Speed',
    fixAttemptResult:
      'Speed measured at 42,000 km out — choose your Mars orbital capture maneuver!',
    ariaReport:
      'Distance to Mars: 42,000 km. Mars surface gravity: 3.72 m/s². Capture burn required.',
    choices: [
      {
        letter: 'A',
        label: 'Slow approach from far out',
        effectText: 'Fuel +10% saved',
        sideEffectText: 'Food -10%, Water -10% (longer trip)',
        realMarsTip:
          'Matching Mars velocity gently from afar saves critical landing fuel at a small supply cost.',
        resolve: () => ({
          deltas: { fuel: 10, food: -10, water: -10, sproutHealth: -5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Textbook Mars capture![/color] Taking it slow saved fuel for landing.',
          outcomeSummary: 'Fuel +10, Food -10, Water -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Fast approach, late braking',
        effectText: 'Arrive quickly',
        sideEffectText: 'Fuel -30%, Health -10% (heavy G-load)',
        realMarsTip:
          'Late retro-burns waste huge amounts of propellant and slam crews with high G-forces.',
        resolve: () => ({
          deltas: { fuel: -30, health: -10 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Whoa, hard braking! That late burn cost us [color=#FF4D6D]30% Fuel[/color] and shook the cabin.',
          outcomeSummary: 'Fuel -30, Health -10',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Aerocapture flyby to trade speed',
        effectText: 'Fuel +10% if Shield ≥ 60 & Power ≥ 50',
        sideEffectText: 'Otherwise Fuel -20%',
        realMarsTip:
          'Skimming Mars upper atmosphere trades speed cleanly only when shields and guidance power are strong.',
        resolve: (prof) => {
          const passes =
            prof.resources.shield >= 60 && prof.resources.power >= 50;
          return passes
            ? {
                deltas: { fuel: 10, thermal: -5 },
                outcomeExpr: 'happy',
                outcomeReyes:
                  '[color=#2EE59D]Bullseye flyby![/color] Your strong shield and power nailed the gravity assist!',
                outcomeSummary: 'Timing passed · Fuel +10',
                isRisky: false,
              }
            : {
                deltas: { fuel: -20, shield: -10 },
                outcomeExpr: 'worried',
                outcomeReyes:
                  'Our shield or power was too low for a clean flyby — we burned [color=#FF4D6D]extra fuel[/color] to recover!',
                outcomeSummary: 'Timing missed · Fuel -20',
                isRisky: true,
              };
        },
      },
    ],
    lesson:
      'Mars gravity depends on its size and mass (about 38% of Earth gravity). Your incoming speed and distance decide how much fuel is needed to slow down into Mars orbit.',
  },
  {
    index: 11,
    id: '2.11',
    numberLabel: 'Scene 2.11',
    title: 'Mars Shadow Navigation',
    narration:
      'Our final capture orbit curves behind the night side of Mars. Ahead lies the cold planetary shadow.',
    fixPrompt:
      'We are slipping into Mars cold shadow! Check night batteries & star-tracker lock.',
    fixButtonLabel: 'Check Night Systems',
    fixAttemptResult:
      'Star tracker locked for a 38-minute eclipse — choose your path behind Mars!',
    mcDelayedMessage: {
      delayMinutes: 14,
      message:
        'Mission Control: Entering Mars eclipse zone. You will lose sunlight for 38 minutes behind the Red Planet.',
    },
    choices: [
      {
        letter: 'A',
        label: 'Stay in sunlight arc',
        effectText: 'Power +10%',
        sideEffectText: 'Thermal -10% (long sunlit pass)',
        realMarsTip:
          'Sun-synchronous polar arcs keep solar arrays illuminated continuously.',
        resolve: () => ({
          deltas: { power: 10, thermal: -10 },
          outcomeExpr: 'normal',
          outcomeReyes:
            'Staying in sunlight topped off our batteries, though the hull warmed slightly.',
          outcomeSummary: 'Power +10, Thermal -10',
          isRisky: false,
        }),
      },
      {
        letter: 'B',
        label: 'Enter Mars shadow deep',
        effectText: 'Thermal +5% cool-down',
        sideEffectText: 'Power -20%',
        realMarsTip:
          'Deep planetary eclipse cuts solar generation to zero and forces reliance on batteries.',
        resolve: () => ({
          deltas: { power: -20, thermal: 5 },
          outcomeExpr: 'worried',
          outcomeReyes:
            'Pitch dark behind Mars! Our [color=#FF4D6D]battery power dropped 20%[/color] in the cold shadow.',
          outcomeSummary: 'Power -20, Thermal +5',
          isRisky: true,
        }),
      },
      {
        letter: 'C',
        label: 'Cross shadow quickly on balanced arc',
        effectText: 'Balanced thermal & power',
        sideEffectText: 'Fuel -5%',
        realMarsTip:
          'Short eclipse crossings keep batteries healthy and cabin temperatures comfortable.',
        resolve: () => ({
          deltas: { fuel: -5, power: 5, thermal: 5 },
          outcomeExpr: 'happy',
          outcomeReyes:
            '[color=#2EE59D]Smooth flying, Cadet![/color] We skimmed across Mars shadow cleanly and locked into orbit!',
          outcomeSummary: 'Balanced · Fuel -5, Power +5, Thermal +5',
          isRisky: false,
        }),
      },
    ],
    lesson:
      'Mars shadow is cold and has zero solar power. Mission planners carefully time battery reserves whenever a spacecraft flies behind the Red Planet.',
  },
];
