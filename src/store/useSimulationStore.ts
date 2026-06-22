import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CircleConfig {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  color: string;
}

export type SettingsPreset = "custom" | "calm" | "active";

interface SimulationState {
  circles: CircleConfig[];
  isPaused: boolean;
  currentPreset: SettingsPreset;
  addCircle: (circle: Omit<CircleConfig, "id"> & { id?: string }) => void;
  removeCircle: (id: string) => void;
  reset: () => void;
  togglePause: () => void;
  setPaused: (isPaused: boolean) => void;
  applyPreset: (preset: Exclude<SettingsPreset, "custom">) => void;
}

const createCircleId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `circle-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const DEFAULT_CIRCLES: CircleConfig[] = [
  {
    id: "starter-a",
    x: 250,
    y: 260,
    velocityX: 150,
    velocityY: 90,
    radius: 34,
    color: "#34b7ff",
  },
  {
    id: "starter-b",
    x: 610,
    y: 330,
    velocityX: -120,
    velocityY: 110,
    radius: 48,
    color: "#f97316",
  },
  {
    id: "starter-c",
    x: 470,
    y: 170,
    velocityX: 75,
    velocityY: -140,
    radius: 24,
    color: "#a3e635",
  },
];

const PRESET_CIRCLES: Record<Exclude<SettingsPreset, "custom">, CircleConfig[]> = {
  calm: [
    {
      id: "calm-a",
      x: 280,
      y: 220,
      velocityX: 75,
      velocityY: 45,
      radius: 42,
      color: "#38bdf8",
    },
    {
      id: "calm-b",
      x: 680,
      y: 420,
      velocityX: -65,
      velocityY: -55,
      radius: 54,
      color: "#c084fc",
    },
  ],
  active: [
    ...DEFAULT_CIRCLES,
    {
      id: "active-d",
      x: 780,
      y: 190,
      velocityX: -210,
      velocityY: 160,
      radius: 28,
      color: "#fb7185",
    },
    {
      id: "active-e",
      x: 175,
      y: 510,
      velocityX: 190,
      velocityY: -175,
      radius: 22,
      color: "#facc15",
    },
  ],
};

const cloneCircles = (circles: readonly CircleConfig[]): CircleConfig[] =>
  circles.map((circle) => ({ ...circle }));

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      circles: DEFAULT_CIRCLES,
      isPaused: true,
      currentPreset: "custom",
      addCircle: (circle) =>
        set((state) => ({
          circles: [...state.circles, { ...circle, id: circle.id ?? createCircleId() }],
          currentPreset: "custom",
        })),
      removeCircle: (id) =>
        set((state) => ({
          circles: state.circles.filter((circle) => circle.id !== id),
          currentPreset: "custom",
        })),
      reset: () =>
        set({
          circles: [],
          currentPreset: "custom",
        }),
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      setPaused: (isPaused) => set({ isPaused }),
      applyPreset: (currentPreset) =>
        set({
          circles: cloneCircles(PRESET_CIRCLES[currentPreset]),
          currentPreset,
        }),
    }),
    {
      name: "circle-physics-simulation",
      version: 1,
    },
  ),
);
