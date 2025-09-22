import { create } from "zustand";

export type StepStatus = "pending" | "approved" | "rejected" | "manual_review";

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
    setSteps: (steps: Step) => void;
}

const initialSteps: Step = {
    selfie: "pending",
    document: "pending",
    liveness: "pending",
    complete: "pending",
};

export const useVerificationStore = create<VerificationStore>((set, get) => ({
    steps: initialSteps,
    currentStep: 1,

    setSteps: (steps: Step) => {
        set({ steps });
    },

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
        return Object.values(get().steps).filter(
            (step) => step === "approved" || step === "manual_review"
        ).length;
    },

    getRejectedCount: () => {
        return Object.values(get().steps).filter((step) => step === "rejected")
            .length;
    },
}));
