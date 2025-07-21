import { Vector3, Color3, Angle } from "@babylonjs/core";
import { MapConfig } from "@/interfaces/MapConfig";

export const MAIN_MAP_CONFIG: MapConfig = {
  debug: {
    inspector: true,
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
    initialRadius: 180,
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
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        47.964393615722656,
        5.998289108276367,
        20.64552307128906
      ),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.3, 1.3, 1),
      modelName: "house_05.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(28.557052612304688, 5.998289108276367, 58.17578125),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1, 1.1, 1),
      modelName: "house_05.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        65.80436706542969,
        4.476771259307861,
        57.716957092285156
      ),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      scale: new Vector3(0.8, 1.1, 0.8),
      modelName: "house_05.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(8.103761672973633, 5, 20.99594497680664),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(9.999162673950195, 5, 57.27021408081055),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      scale: new Vector3(1, 1.3, 0.8),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        47.210357666015625,
        5.667227268218994,
        40.78350067138672
      ),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.3, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(9.203802108764648, 6, 39.96675109863281),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.4, 1.3, 0.9),
      modelName: "house_09.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(48.882816314697266, 6, 58.86723327636719),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1.4, 1.3, 0.9),
      modelName: "house_09.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
    {
      interactible: true,
      size: { width: 1, depth: 1, height: 1 },
      position: new Vector3(
        66.1789321899414,
        3.5620410442352295,
        22.357759475708008
      ),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      scale: new Vector3(1.4, 1.3, 0.9),
      modelName: "house_09.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
  ],
  environments: [
    // {
    //   position: new Vector3(
    //     -61.86184310913086,
    //     8.950078964233398,
    //     -38.10206985473633
    //   ),
    //   rotation: new Vector3(0, 0, 0),
    //   scale: new Vector3(1, 1, 1),
    //   modelName: "pine-tree.glb",
    // },
    // {
    //   position: new Vector3(
    //     -33.72332000732422,
    //     10.352472305297852,
    //     -48.158836364746094
    //   ),
    //   rotation: new Vector3(0, Angle.FromDegrees(80).radians(), 0),
    //   scale: new Vector3(1, 1, 1),
    //   modelName: "pine-tree.glb",
    // },
  ],
  animatedModels: [
    // {
    //   modelName: "female-walk-loop.glb",
    //   position: new Vector3(7.384357929229736, 6, 10.11191463470459),
    //   rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
    //   scale: new Vector3(1.7, 1.7, 1.7),
    //   animationName: "walk",
    //   animationSpeed: 1,
    //   loopAnimation: true,
    //   isMoving: true,
    //   path: {
    //     points: [
    //       {
    //         position: new Vector3(7.384357929229736, 6, 10.11191463470459),
    //         rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
    //       },
    //       {
    //         position: new Vector3(58.13905334472656, 6, 10.11191463470459),
    //         rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
    //       },
    //     ],
    //     duration: 6,
    //     loop: true,
    //   },
    // },
  ],
  baseColor: new Color3(0.6, 0.6, 0.6),
  sunLight: {
    enabled: true,
    position: new Vector3(120, 60, 150),
    direction: new Vector3(0, -0.12186115235090256, -5),
    intensity: 10,
    diffuse: new Color3(1, 1, 0.9),
    specular: new Color3(1, 1, 1),
    shadowEnabled: true,
    shadowMapSize: 1024,
    shadowBlur: true,
    shadowBlurKernel: 32,
    shadowDarkness: 0.2,
    shadowCasterNamePatterns: ["building_"],
  },
};
