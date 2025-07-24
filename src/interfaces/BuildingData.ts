import { Mesh, Vector3 } from "@babylonjs/core";

export interface BuildingData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}
