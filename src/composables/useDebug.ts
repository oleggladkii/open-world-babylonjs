import {
  Mesh,
  Scene,
  UtilityLayerRenderer,
  PositionGizmo,
  ScaleGizmo,
  PlaneRotationGizmo,
  MeshBuilder,
  Color3,
  Vector3,
  Light,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  StandardMaterial,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { MapBuildingConfig } from "@/interfaces/MapConfig";

export const useDebug = () => {
  const setupBuildingGizmoPosition = (
    mesh: Mesh,
    buildingConfig: MapBuildingConfig,
    scene: Scene
  ): void => {
    try {
      const utilLayer = new UtilityLayerRenderer(scene);
      const positionGizmo = new PositionGizmo(utilLayer);
      positionGizmo.attachedMesh = mesh;
      positionGizmo.onDragEndObservable.add(() => {
        console.log("New building position:", {
          name: buildingConfig.modelName,
          positionX: mesh.position._x,
          positionY: mesh.position._y,
          positionZ: mesh.position._z,
        });
      });
    } catch (error) {
      console.error("Failed to setup building gizmo:", error);
    }
  };

  const setupBuildingGizmoScale = (
    mesh: Mesh,
    buildingConfig: MapBuildingConfig,
    scene: Scene
  ): void => {
    try {
      const utilLayer = new UtilityLayerRenderer(scene);
      const scaleGizmo = new ScaleGizmo(utilLayer);
      scaleGizmo.attachedMesh = mesh;
      scaleGizmo.onDragEndObservable.add(() => {
        console.log("New building scale:", {
          name: buildingConfig.modelName,
          scaleX: mesh.scaling._x,
          scaleY: mesh.scaling._y,
          scaleZ: mesh.scaling._z,
        });
      });
    } catch (error) {
      console.error("Failed to setup building scale gizmo:", error);
    }
  };

  const setupBuildingGizmoRotation = (
    mesh: Mesh,
    buildingConfig: MapBuildingConfig,
    scene: Scene
  ): void => {
    try {
      const utilLayer = new UtilityLayerRenderer(scene);
      const rotationGizmo = new PlaneRotationGizmo(
        new Vector3(0, 1, 0),
        Color3.Red(),
        utilLayer
      );
      rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;
      rotationGizmo.attachedMesh = mesh;
    } catch (error) {
      console.error("Failed to setup building rotation gizmo:", error);
    }
  };

  const createGroundGrid = (
    scene: Scene,
    width: number,
    height: number
  ): void => {
    try {
      const grid = MeshBuilder.CreateGround(
        "grid",
        {
          width,
          height,
          subdivisions: 20,
        },
        scene
      );
      grid.position.y = 10;
      const gridMaterial = new GridMaterial("gridMaterial", scene);
      gridMaterial.majorUnitFrequency = 5;
      gridMaterial.minorUnitVisibility = 0.5;
      gridMaterial.gridRatio = 1;
      gridMaterial.mainColor = new Color3(1, 1, 1);
      gridMaterial.lineColor = new Color3(0.5, 0.5, 0.5);
      gridMaterial.opacity = 0.3;
      grid.material = gridMaterial;
    } catch (error) {
      console.error("Failed to create ground grid:", error);
    }
  };

  const setupLightGizmo = (light: Light, scene: Scene): void => {
    try {
      // Create a small sphere to represent the light position
      const lightMesh = MeshBuilder.CreateSphere(
        `lightGizmo_${light.name}`,
        { diameter: 0.5 },
        scene
      );
      // Set the mesh position to match the light
      if (light instanceof HemisphericLight) {
        lightMesh.position = light.direction;
      } else if (light instanceof DirectionalLight) {
        lightMesh.position = light.direction;
      } else if (light instanceof PointLight || light instanceof SpotLight) {
        lightMesh.position = light.position;
      }

      // Create utility layer and position gizmo
      const utilLayer = new UtilityLayerRenderer(scene);
      const positionGizmo = new PositionGizmo(utilLayer);
      positionGizmo.attachedMesh = lightMesh;

      // Update light position when gizmo is moved
      positionGizmo.onDragEndObservable.add(() => {
        if (
          light instanceof HemisphericLight ||
          light instanceof DirectionalLight
        ) {
          light.direction = lightMesh.position;
        } else if (light instanceof PointLight || light instanceof SpotLight) {
          light.position = lightMesh.position;
        }
        console.log("New light position:", {
          name: light.name,
          positionX: lightMesh.position._x,
          positionY: lightMesh.position._y,
          positionZ: lightMesh.position._z,
        });
      });

      // Add color to the gizmo based on light type
      const material = new StandardMaterial(
        `lightGizmoMat_${light.name}`,
        scene
      );
      if (light instanceof HemisphericLight) {
        material.emissiveColor = new Color3(0.5, 0.5, 1);
      } else if (light instanceof DirectionalLight) {
        material.emissiveColor = new Color3(1, 1, 0.5);
      } else if (light instanceof PointLight) {
        material.emissiveColor = new Color3(1, 0.5, 0.5);
      } else if (light instanceof SpotLight) {
        material.emissiveColor = new Color3(0.5, 1, 0.5);
      }
      lightMesh.material = material;
    } catch (error) {
      console.error("Failed to setup light gizmo:", error);
    }
  };

  return {
    setupBuildingGizmoPosition,
    setupBuildingGizmoScale,
    setupBuildingGizmoRotation,
    createGroundGrid,
    setupLightGizmo,
  };
};
