import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  tutorialCompleted: boolean;
  tutorialDismissed: boolean;
  currentStep: number;
  completedSteps: number[];
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  completeTutorial: () => void;
  dismissTutorial: () => void;
  resetTutorial: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      tutorialCompleted: false,
      tutorialDismissed: false,
      currentStep: 0,
      completedSteps: [],

      setCurrentStep: (step) => set({ currentStep: step }),

      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      completeTutorial: () =>
        set({ tutorialCompleted: true, tutorialDismissed: false }),

      dismissTutorial: () =>
        set({ tutorialDismissed: true }),

      resetTutorial: () =>
        set({
          tutorialCompleted: false,
          tutorialDismissed: false,
          currentStep: 0,
          completedSteps: [],
        }),
    }),
    {
      name: 'cnec-onboarding',
    }
  )
);
