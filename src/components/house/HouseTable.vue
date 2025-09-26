<template lang="pug">
div
  // Invisible component - table is created programmatically
  //- InteractionPrompt(
  //-   v-if="tableMesh && isLoaded"
  //-   text="Press E to use table"
  //-   :trigger-position="interactionPosition"
  //-   :trigger-radius="2"
  //-   :player-position="playerPosition"
  //-   :is-active="isActive"
  //-   key-binding="E"
  //-   @interact="handleUseTable"
  //- )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
// import InteractionPrompt from "../InteractionPrompt.vue";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  addShadowCaster: undefined,
  playerPosition: null,
  isActive: false,
});

const emit = defineEmits<{
  useTable: [position: Vector3];
}>();

// Refs
const tableMesh = ref<Mesh | null>(null);
const isLoaded = ref(false);
const interactionPosition = ref(new Vector3(-4.5, 0.5, -2.25)); // Position in front of table

const createTable = () => {
  if (!props.scene) {
    console.warn("Scene not available for table creation");
    return;
  }

  try {
    // Create brown material for table legs (wood-like)
    const brownMaterial = new StandardMaterial("tableLegMaterial", props.scene);
    brownMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Brown wood color
    brownMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
    brownMaterial.zOffset = -1; // Prevent z-fighting with floor

    // Create transparent glass material for table top
    const glassMaterial = new StandardMaterial("tableTopMaterial", props.scene);
    glassMaterial.diffuseColor = new Color3(0.9, 0.9, 1.0); // Slight blue tint
    glassMaterial.specularColor = new Color3(1.0, 1.0, 1.0); // High specular for glass
    glassMaterial.alpha = 0.3; // Transparent
    glassMaterial.backFaceCulling = false; // Show both sides
    glassMaterial.zOffset = 1; // Render glass on top

    // Table dimensions
    const tableHeight = 0.75; // Зменшуємо висоту столу
    const tableTopWidth = 1.2;
    const tableTopDepth = 2;
    const tableTopThickness = 0.1;
    const legWidth = 0.1;
    const legHeight = tableHeight - tableTopThickness;

    // Create table top
    const tableTop = MeshBuilder.CreateBox(
      "tableTop",
      {
        width: tableTopWidth,
        height: tableTopThickness,
        depth: tableTopDepth,
      },
      props.scene,
    );
    tableTop.position.set(-4.5, tableHeight - tableTopThickness / 2, -2.25);
    tableTop.material = glassMaterial;

    // Create 4 legs
    const legPositions = [
      {
        x: -tableTopWidth / 2 + legWidth / 2,
        z: -tableTopDepth / 2 + legWidth / 2,
      }, // Front left
      {
        x: tableTopWidth / 2 - legWidth / 2,
        z: -tableTopDepth / 2 + legWidth / 2,
      }, // Front right
      {
        x: -tableTopWidth / 2 + legWidth / 2,
        z: tableTopDepth / 2 - legWidth / 2,
      }, // Back left
      {
        x: tableTopWidth / 2 - legWidth / 2,
        z: tableTopDepth / 2 - legWidth / 2,
      }, // Back right
    ];

    const legs: Mesh[] = [];
    legPositions.forEach((pos, index) => {
      const leg = MeshBuilder.CreateBox(
        `tableLeg${index + 1}`,
        {
          width: legWidth,
          height: 1,
          depth: legWidth,
        },
        props.scene!,
      );
      leg.position.set(-4.5 + pos.x, 0.25, -2.25 + pos.z);
      leg.material = brownMaterial;
      legs.push(leg);
    });

    // Merge all table parts into one mesh
    const allTableParts = [tableTop, ...legs];
    const mergedTable = Mesh.MergeMeshes(
      allTableParts,
      true,
      true,
      undefined,
      false,
      true,
    );

    if (mergedTable) {
      mergedTable.name = "redTable";
      tableMesh.value = mergedTable;

      // Add physics impostor for collision
      mergedTable.physicsImpostor = new PhysicsImpostor(
        mergedTable,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0 },
        props.scene,
      );

      // Enable shadow casting and receiving
      mergedTable.receiveShadows = true;
      if (props.addShadowCaster) {
        props.addShadowCaster(mergedTable);
      }

      isLoaded.value = true;
      console.log("Red table created successfully");
    }
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

const handleUseTable = () => {
  if (tableMesh.value) {
    emit("useTable", tableMesh.value.position.clone());
  }
};

const cleanup = () => {
  if (tableMesh.value) {
    if (tableMesh.value.physicsImpostor) {
      tableMesh.value.physicsImpostor.dispose();
    }
    tableMesh.value.dispose();
    tableMesh.value = null;
  }
  isLoaded.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createTable();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createTable();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  tableMesh,
  isLoaded,
  cleanup,
});
</script>
