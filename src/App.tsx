/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ViewportShell } from './components/ViewportShell';
import { SaveManager } from './game/saveManager';
import { CadetProfile } from './game/types';
import { Level1Main } from './scenes/Level1Main';
import { Level2MarsMain } from './scenes/Level2MarsMain';
import { Level3MarsMain } from './scenes/Level3MarsMain';
import { StartScreen } from './scenes/StartScreen';

export default function App() {
  const [activeProfile, setActiveProfile] = useState<CadetProfile | null>(null);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  const renderActiveScene = () => {
    if (!activeProfile) {
      return (
        <StartScreen
          onEnterGame={(profile) => {
            setActiveProfile(profile);
            setActiveLevel(
              profile.cadetLevel >= 3 ? 3 : profile.cadetLevel >= 2 ? 2 : 1
            );
          }}
        />
      );
    }

    if (activeLevel === 3) {
      return (
        <Level3MarsMain
          key={`${activeProfile.username}-l3`}
          initialProfile={activeProfile}
          onQuitToMenu={() => setActiveProfile(null)}
        />
      );
    }

    if (activeLevel === 2) {
      return (
        <Level2MarsMain
          key={`${activeProfile.username}-l2`}
          initialProfile={activeProfile}
          onQuitToMenu={() => setActiveProfile(null)}
          onBackToLevel1={() => {
            const fresh = SaveManager.getUserProfile(activeProfile.username);
            if (fresh) {
              setActiveProfile(fresh);
            }
            setActiveLevel(1);
          }}
          onStartLevel3={(updatedProfile) => {
            setActiveProfile(updatedProfile);
            setActiveLevel(3);
          }}
        />
      );
    }

    return (
      <Level1Main
        key={`${activeProfile.username}-l1`}
        initialProfile={activeProfile}
        onQuitToMenu={() => setActiveProfile(null)}
        onStartLevel2={(updatedProfile) => {
          setActiveProfile(updatedProfile);
          setActiveLevel(2);
        }}
      />
    );
  };

  return <ViewportShell>{renderActiveScene()}</ViewportShell>;
}
