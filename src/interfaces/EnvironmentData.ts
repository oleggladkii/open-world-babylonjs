import { Mesh, Vector3 } from "@babylonjs/core";

export interface EnvironmentData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}
