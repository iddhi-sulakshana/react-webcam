import { create } from "zustand";

export type StepStatus = "pending" | "completed" | "rejected";

export interface Step {
    selfie: StepStatus;
    document: StepStatus;
    liveness: StepStatus;
    complete: StepStatus;
}

interface VerificationStore {
    steps: Step;
    currentStep: number;

    // Actions
    setStepStatus: (stepId: keyof Step, status: StepStatus) => void;
    setCurrentStep: (stepId: number) => void;
    resetSteps: () => void;
    getStepStatus: (stepId: keyof Step) => StepStatus;
    getCompletedCount: () => number;
    getRejectedCount: () => number;
}

const initialSteps: Step = {
    selfie: "completed",
    document: "completed",
    liveness: "completed",
    complete: "pending",
};

export const useVerificationStore = create<VerificationStore>((set, get) => ({
    steps: initialSteps,
    currentStep: 1,

    setStepStatus: (stepId: keyof Step, status: StepStatus) => {
        set((state) => ({
            steps: {
                ...state.steps,
                [stepId]: status,
            },
        }));
    },

    setCurrentStep: (stepId: number) => {
        set({ currentStep: stepId });
    },

    resetSteps: () => {
        set({
            steps: initialSteps,
            currentStep: 1,
        });
    },

    getStepStatus: (stepId: keyof Step) => {
        return get().steps[stepId] || "pending";
    },

    getCompletedCount: () => {
        return Object.values(get().steps).filter((step) => step === "completed")
            .length;
    },

    getRejectedCount: () => {
        return Object.values(get().steps).filter((step) => step === "rejected")
            .length;
    },
}));
