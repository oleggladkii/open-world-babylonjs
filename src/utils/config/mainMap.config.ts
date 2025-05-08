import { Vector3, Color3, Angle } from "@babylonjs/core";

export const MAIN_MAP_CONFIG = {
  debug: false,
  ground: {
    width: 200,
    height: 200,
  },
  camera: {
    initialRadius: 100,
    minRadius: 10,
    maxRadius: 100,
    panningSensibility: 50,
    wheelDeltaPercentage: 0.01,
    lowerBetaLimit: Angle.FromDegrees(20).radians(),
    upperBetaLimit: Angle.FromDegrees(75).radians(),
    moveSpeed: 0.8,
    edgeScrollThreshold: 20,
  },
  buildings: [
    {
      interactible: true,
      size: { width: 17, depth: 10, height: 6 },
      position: new Vector3(28, 5, 3),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1, 1.3, 1.2),
      modelName: "house_04.glb",
      highlightColor: new Color3(0.2, 0.8, 0.2),
    },
    {
      interactible: true,
      size: { width: 20, depth: 30, height: 7 },
      position: new Vector3(49, 6, 20),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.15, 1.1, 1),
      modelName: "house_01.glb",
      highlightColor: new Color3(0.8, 0.2, 0.2),
    },
    {
      interactible: true,
      size: { width: 13, depth: 17, height: 20 },
      position: new Vector3(8, 5, 22),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
  ],
  baseColor: new Color3(0.6, 0.6, 0.6),
} as const;
