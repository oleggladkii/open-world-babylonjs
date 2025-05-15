import { Vector3, Color3, Angle } from "@babylonjs/core";
import { MapConfig } from "@/interfaces/MapConfig";

export const MAIN_MAP_CONFIG: MapConfig = {
  debug: {
    inspector: false,
    groundGrid: false,
    lightGizmo: false,
    gizmoPosition: false,
    gizmoScale: false,
    gizmoRotation: false,
  },
  ground: {
    width: 200,
    height: 200,
  },
  camera: {
    initialRadius: 100,
    minRadius: 50,
    maxRadius: 200,
    panningSensibility: 50,
    wheelDeltaPercentage: 0.01,
    lowerBetaLimit: Angle.FromDegrees(20).radians(),
    upperBetaLimit: Angle.FromDegrees(75).radians(),
    moveSpeed: 0.8,
    edgeScrollThreshold: 20,
  },
  buildings: [
    {
      interactible: false,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(28, 5, 3),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1, 1.3, 1.2),
      modelName: "house_04.glb",
      highlightColor: new Color3(0.2, 0.8, 0.2),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(49, 6, 20),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.15, 1.1, 1),
      modelName: "house_01.glb",
      highlightColor: new Color3(0.8, 0.2, 0.2),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(7.743345737457275, 5, 22),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: false,
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
    {
      interactible: false,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        48.61846923828125,
        5.667227268218994,
        41.224761962890625
      ),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.3, 1.3, 0.7),
      modelName: "house_06.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: false,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(8.572281837463379, 6, 41.688819885253906),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.4, 1.3, 0.9),
      modelName: "house_09.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: false,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(49.12409210205078, 6, 60.03775405883789),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1.4, 1.3, 0.9),
      modelName: "house_09.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
  ],
  environments: [
    {
      interactible: false,
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
      interactible: false,
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
  animatedModels: [
    {
      modelName: "female-walk-loop.glb",
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1.7, 1.7, 1.7),
      animationName: "walk",
      animationSpeed: 1,
      loopAnimation: true,
      isMoving: true,
      path: {
        points: [
          {
            position: new Vector3(7.384357929229736, 6, 10.11191463470459),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
          {
            position: new Vector3(58.13905334472656, 6, 10.11191463470459),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
          {
            position: new Vector3(
              58.13905334472656,
              5.076845645904541,
              51.76905822753906
            ),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
          {
            position: new Vector3(
              -0.052407484501600266,
              5.076845645904541,
              51.76905822753906
            ),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
          {
            position: new Vector3(
              -0.052407484501600266,
              5.076845645904541,
              10.11191463470459
            ),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
          {
            position: new Vector3(7.384357929229736, 6, 10.11191463470459),
            rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
          },
        ],
        duration: 120,
        loop: true,
      },
    },
  ],
  baseColor: new Color3(0.6, 0.6, 0.6),
};
