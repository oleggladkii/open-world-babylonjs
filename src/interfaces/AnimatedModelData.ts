import { Mesh, Vector3, AnimationGroup } from "@babylonjs/core";

export interface AnimatedModelData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  animationGroup: AnimationGroup | null;
}
