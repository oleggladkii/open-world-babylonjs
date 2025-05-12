import { Vector3, Color3, Angle } from "@babylonjs/core";
import { MapConfig } from "@/interfaces/MapConfig";

export const MAIN_MAP_CONFIG: MapConfig = {
  debug: {
    groundGrid: false,
    buildingGizmoPosition: false,
    buildingGizmoScale: false,
    buildingGizmoRotation: false,
    lightGizmo: true,
  },
  ground: {
    width: 200,
    height: 200,
  },
  camera: {
    initialRadius: 100,
    minRadius: 50,
    maxRadius: 150,
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
      position: new Vector3(7.743345737457275, 5, 22),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        27.929122924804688,
        6.271093845367432,
        42.24798583984375
      ),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.3, 1.3, 1),
      modelName: "house_05.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
  ],
  environments: [
    {
      interactible: true,
      position: new Vector3(
        -64.78382110595703,
        19.061641693115234,
        -36.627166748046875
      ),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      modelName: "pine-tree.glb",
    },
    {
      interactible: true,
      position: new Vector3(
        -33.72332000732422,
        15.061641693115234,
        -48.158836364746094
      ),
      rotation: new Vector3(0, Angle.FromDegrees(80).radians(), 0),
      scale: new Vector3(1, 1, 1),
      modelName: "pine-tree.glb",
    },
  ],
  baseColor: new Color3(0.6, 0.6, 0.6),
};
