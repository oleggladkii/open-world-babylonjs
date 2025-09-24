<template lang="pug">
div
  // This component handles the residential family house
  // Loads and positions the house model with shadows and interactive pointer
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  Vector3,
  Scene,
  AbstractMesh,
  ArcRotateCamera,
  Angle,
  Observer,
  PointerInfo,
  PointerEventTypes,
} from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";
import { useInteractivePointer } from "@/composables/useInteractivePointer";
import { useCameraAnimation } from "@/composables/useCameraAnimation";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
  camera?: ArcRotateCamera | null;
  onHouseClick?: () => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();
const {
  createPointer,
  showPointer,
  hidePointer,
  dispose: disposePointer,
} = useInteractivePointer();
const { animateCameraToTarget, getIsAnimating } = useCameraAnimation();

let houseInstance: AbstractMesh[] = [];
let pointerObserver: Observer<PointerInfo> | null = null;

const createHouse = async () => {
  if (!props.scene) return;

  try {
    const houseResult = await loadModel(props.scene, {
      fileName: "residential_family_house.glb",
      rootUrl: "/assets/models/buildings/",
      position: new Vector3(20, 0, 14),
      scaling: new Vector3(16, 16, 16),
      name: "redHouse",
    });

    if (houseResult && houseResult.meshes.length > 0) {
      // Add shadows to all house meshes
      houseResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        props.addShadowCaster(mesh);
        houseInstance.push(mesh);
      });

      // Create interactive pointer above the house (initially hidden)
      createPointer(props.scene, {
        position: new Vector3(16, 0, 15), // House position
        height: 14, // Height above the house
        size: 5, // Size of the pointer
        rotationSpeed: 2, // Rotation speed
      });

      // Explicitly hide the pointer initially - it will be shown after chat interaction
      hidePointer();

      // Setup pointer interaction after house is loaded
      setupPointerInteraction();
    }
  } catch (error) {
    console.warn("Failed to load red roof house:", error);
  }
};

const showHousePointer = () => {
  showPointer();
};

const setupPointerInteraction = () => {
  if (!props.scene) return;

  pointerObserver = props.scene.onPointerObservable.add((pointerInfo) => {
    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

    // Check if picked mesh belongs to the house
    const isHouseMesh =
      pickedMesh &&
      houseInstance.some(
        (mesh) =>
          mesh === pickedMesh ||
          mesh.getChildMeshes().includes(pickedMesh as AbstractMesh),
      );

    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERMOVE:
        if (isHouseMesh) {
          const canvas = props.scene?.getEngine().getRenderingCanvas();
          if (canvas) {
            canvas.style.cursor = "pointer";
          }
          showPointer();
        } else {
          const canvas = props.scene?.getEngine().getRenderingCanvas();
          if (canvas) {
            canvas.style.cursor = "default";
          }
        }
        break;

      case PointerEventTypes.POINTERDOWN:
        if (isHouseMesh) {
          handleHouseClick();
        }
        break;
    }
  });
};

const handleHouseClick = async () => {
  if (!props.camera || !props.scene || getIsAnimating()) {
    return;
  }

  try {
    // Hide the pointer
    hidePointer();

    // Animate camera to house
    await animateCameraToTarget(props.camera, props.scene, {
      targetPosition: new Vector3(20, 1, 8), // House center position
      targetRadius: 1, // Distance from house
      targetAlpha: Angle.FromDegrees(-90).radians(), // Face the front of the house
      targetBeta: Angle.FromDegrees(120).radians(), // Slightly above ground level
    });

    // Call the callback to trigger screen fade
    if (props.onHouseClick) {
      props.onHouseClick();
    }
  } catch (error) {
    // Handle error silently
  }
};

const cleanup = () => {
  // Dispose all house meshes
  houseInstance.forEach((mesh) => {
    if (mesh && mesh.dispose) {
      mesh.dispose();
    }
  });
  houseInstance = [];

  // Dispose pointer observer
  if (pointerObserver && props.scene) {
    props.scene.onPointerObservable.remove(pointerObserver);
    pointerObserver = null;
  }

  // Dispose pointer
  disposePointer();
};

// Expose function to parent component
defineExpose({
  showHousePointer,
});

onMounted(() => {
  createHouse();
});

onUnmounted(() => {
  cleanup();
});
</script>
