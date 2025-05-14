import { Vector3, Color3 } from "@babylonjs/core";

export interface MapDebugConfig {
  groundGrid: boolean;
  gizmoPosition: boolean;
  gizmoScale: boolean;
  gizmoRotation: boolean;
  lightGizmo: boolean;
  inspector: boolean;
}

export interface MapGroundConfig {
  width: number;
  height: number;
}

export interface MapCameraConfig {
  initialRadius: number;
  minRadius: number;
  maxRadius: number;
  panningSensibility: number;
  wheelDeltaPercentage: number;
  lowerBetaLimit: number;
  upperBetaLimit: number;
  moveSpeed: number;
  edgeScrollThreshold: number;
}

export interface MapBuildingSize {
  width: number;
  depth: number;
  height: number;
}

export interface MapBuildingConfig {
  interactible: boolean;
  size: MapBuildingSize;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  modelName: string;
  highlightColor: Color3;
}

export interface MapEnvironmentConfig {
  modelName: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  interactible: boolean;
}

export interface MapAnimatedModelConfig {
  modelName: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  animationName: string;
  animationSpeed: number;
  loopAnimation: boolean;
  interactible?: boolean;
  isMoving: boolean;
  path?: {
    points: Array<{
      position: Vector3;
      rotation: Vector3;
    }>;
    duration: number;
    loop: boolean;
  };
}

export interface MapConfig {
  debug: MapDebugConfig;
  ground: MapGroundConfig;
  camera: MapCameraConfig;
  buildings: MapBuildingConfig[];
  environments: MapEnvironmentConfig[];
  animatedModels: MapAnimatedModelConfig[];
  baseColor: Color3;
}
