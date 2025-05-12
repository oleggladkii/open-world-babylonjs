import { Vector3, Color3 } from "@babylonjs/core";

export interface MapDebugConfig {
  groundGrid: boolean;
  buildingGizmoPosition: boolean;
  buildingGizmoScale: boolean;
  buildingGizmoRotation: boolean;
  lightGizmo: boolean;
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
  interactible: boolean;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  modelName: string;
}

export interface MapConfig {
  debug: MapDebugConfig;
  ground: MapGroundConfig;
  camera: MapCameraConfig;
  buildings: MapBuildingConfig[];
  environments: MapEnvironmentConfig[];
  baseColor: Color3;
}
