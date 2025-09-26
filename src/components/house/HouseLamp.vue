<template lang="pug">
div
  InteractionPrompt(
    text="Press E to switch light"
    :trigger-position="switchPosition"
    :trigger-radius="2.5"
    :player-position="playerPosition"
    :is-active="isActive"
    key-binding="E"
    @interact="handleSwitchInteraction"
  )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  PointLight,
  Color3,
  AbstractMesh,
  Mesh,
  MeshBuilder,
  StandardMaterial,
} from "@babylonjs/core";
import { useLoadModel } from "../../composables/useLoadModel";
import InteractionPrompt from "../InteractionPrompt.vue";

interface Props {
  scene: Scene;
  addShadowCaster: (mesh: AbstractMesh) => void;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  playerPosition: null,
  isActive: true,
});

const emit = defineEmits<{
  lightToggled: [isOn: boolean];
}>();

// State
const isLightOn = ref(false);
const lampMeshes = ref<AbstractMesh[]>([]);
const lampLights = ref<PointLight[]>([]);
const switchPosition = new Vector3(-0.2, 2.5, 4.5); // Wall switch position near window
let switchMaterial: StandardMaterial | null = null; // Store switch material reference
let switchToggle: Mesh | null = null; // Store switch toggle reference
const ceilingLamps = ref<Mesh[]>([]); // Store ceiling lamp meshes
const ceilingLights = ref<PointLight[]>([]); // Store ceiling point lights
const { loadModel } = useLoadModel();

// Lamp configurations
const lampConfigs = [
  {
    position: new Vector3(-1.3, 0, -6.5), // Near window, left side
    rotation: new Vector3(0, Math.PI / 4, 0), // 45 degree rotation
  },
  {
    position: new Vector3(-1.3, 0, -1.5), // Near window, right side
    rotation: new Vector3(0, -Math.PI / 4, 0), // -45 degree rotation
  },
];

const createWallSwitch = () => {
  if (!props.scene) return;

  // Create simple switch toggle
  switchToggle = MeshBuilder.CreateBox(
    "lightSwitchToggle",
    { width: 0.1, height: 0.4, depth: 0.4 },
    props.scene,
  );

  // Position toggle at switch position
  switchToggle.position = switchPosition.clone();

  // Create toggle material
  switchMaterial = new StandardMaterial("toggleMaterial", props.scene);
  switchMaterial.diffuseColor = isLightOn.value
    ? new Color3(0.3, 0.75, 0.3) // Green for ON
    : new Color3(0.62, 0.62, 0.62); // Gray for OFF
  switchMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
  switchToggle.material = switchMaterial;

  // Shadows disabled for performance
  // props.addShadowCaster(switchToggle);

  return { switchToggle, switchMaterial };
};

const createCeilingLamps = () => {
  if (!props.scene) return;

  // Room 1 ceiling lamps (6 lamps) - arranged in 2 rows of 3
  const room1Positions = [
    new Vector3(-8, 5.9, -7),
    new Vector3(-2, 5.9, -7),
    new Vector3(-8, 5.9, 0),
    new Vector3(-2, 5.9, 0),
    new Vector3(-8, 5.9, 7),
    new Vector3(-2, 5.9, 7),
  ];

  // Room 2 ceiling lamps (4 lamps) - arranged in 2x2 grid
  const room2Positions = [
    new Vector3(8, 5.9, 0),
    new Vector3(3, 5.9, 0),
    new Vector3(8, 5.9, 7),
    new Vector3(3, 5.9, 7),
  ];

  const allPositions = [...room1Positions, ...room2Positions];

  allPositions.forEach((position, index) => {
    // Create circular lamp mesh
    const lampMesh = MeshBuilder.CreateCylinder(
      `ceilingLamp_${index}`,
      {
        height: 0.1,
        diameter: 0.3,
        tessellation: 16,
      },
      props.scene,
    );
    lampMesh.position = position;

    // Create lamp material
    const lampMaterial = new StandardMaterial(
      `ceilingLampMaterial_${index}`,
      props.scene,
    );
    lampMaterial.diffuseColor = isLightOn.value
      ? new Color3(1, 0.9, 0.7) // Warm white when ON
      : new Color3(0.3, 0.3, 0.3); // Dark gray when OFF
    lampMaterial.emissiveColor = isLightOn.value
      ? new Color3(0.8, 0.7, 0.5) // Glowing when ON
      : new Color3(0, 0, 0); // No glow when OFF
    lampMesh.material = lampMaterial;

    ceilingLamps.value.push(lampMesh);

    // Create point light for each ceiling lamp
    const ceilingLight = new PointLight(
      `ceilingLight_${index}`,
      position.clone(),
      props.scene,
    );
    ceilingLight.intensity = isLightOn.value ? 0.6 : 0; // Start with lights on
    ceilingLight.diffuse = new Color3(1, 0.9, 0.7); // Warm white light
    ceilingLight.specular = new Color3(0.3, 0.3, 0.2);
    ceilingLight.range = 4; // Light range
    ceilingLight.radius = 0.05;

    ceilingLights.value.push(ceilingLight);
  });

  console.log(
    `Created ${allPositions.length} ceiling lamps (6 in room 1, 4 in room 2)`,
  );
};

const loadLamps = async () => {
  if (!props.scene) return;

  try {
    // Load lamps at both positions
    for (let i = 0; i < lampConfigs.length; i++) {
      const config = lampConfigs[i];

      const loadedModel = await loadModel(props.scene, {
        fileName: "ikea_lamp.glb",
        rootUrl: "/assets/models/house/",
        position: config.position,
        rotation: config.rotation,
        scaling: new Vector3(0.025, 0.025, 0.025),
        castShadows: false, // Disable shadows for lamps to improve performance
        receiveShadows: false,
        useCache: false, // Disable cache to ensure both lamps load
        optimizeMesh: true, // Enable mesh optimization
        name: `lamp_${i}`,
      });

      if (loadedModel) {
        // Store lamp meshes
        lampMeshes.value.push(...loadedModel.meshes);

        // Optimize meshes for better performance
        loadedModel.meshes.forEach((mesh) => {
          if (mesh instanceof Mesh) {
            mesh.freezeWorldMatrix(); // Freeze transformation matrix for static objects
            mesh.doNotSyncBoundingInfo = true; // Disable bounding info sync
            // Shadows disabled for performance
            // props.addShadowCaster(mesh);
            // mesh.receiveShadows = false;
          }
        });

        // Create point light for each lamp
        const lampLight = new PointLight(
          `lampLight_${i}`,
          new Vector3(
            config.position.x,
            config.position.y + 2,
            config.position.z,
          ),
          props.scene,
        );

        // Configure light properties for better performance
        lampLight.intensity = 0; // Start with lights off
        lampLight.diffuse = new Color3(1, 0.9, 0.7); // Warm white light
        lampLight.specular = new Color3(0.5, 0.5, 0.4); // Reduced specular for performance
        lampLight.range = 6; // Reduced light range for better performance
        lampLight.radius = 0.05; // Smaller radius for better performance

        lampLights.value.push(lampLight);

        console.log(
          `Lamp ${i + 1} loaded successfully at position:`,
          config.position,
        );
      }
    }

    // Create wall switch after loading all lamps
    createWallSwitch();
    console.log("Wall switch created at position:", switchPosition);

    // Create ceiling lamps
    createCeilingLamps();
  } catch (error) {
    console.error("Error loading lamps:", error);
  }
};

const toggleLights = () => {
  isLightOn.value = !isLightOn.value;

  // Toggle all lamp lights with reduced intensity for better performance
  lampLights.value.forEach((light) => {
    light.intensity = isLightOn.value ? 0.8 : 0; // Reduced from 1.2 to 0.8
  });

  // Toggle all ceiling lights
  ceilingLights.value.forEach((light) => {
    light.intensity = isLightOn.value ? 0.6 : 0;
  });

  // Update ceiling lamp materials (glow effect)
  ceilingLamps.value.forEach((lamp) => {
    if (lamp.material && lamp.material instanceof StandardMaterial) {
      const material = lamp.material as StandardMaterial;
      material.diffuseColor = isLightOn.value
        ? new Color3(1, 0.9, 0.7) // Warm white when ON
        : new Color3(0.3, 0.3, 0.3); // Dark gray when OFF
      material.emissiveColor = isLightOn.value
        ? new Color3(0.8, 0.7, 0.5) // Glowing when ON
        : new Color3(0, 0, 0); // No glow when OFF
    }
  });

  // Update switch toggle color only
  if (switchMaterial) {
    switchMaterial.diffuseColor = isLightOn.value
      ? new Color3(0.3, 0.75, 0.3) // Green for ON
      : new Color3(0.62, 0.62, 0.62); // Gray for OFF
  }

  emit("lightToggled", isLightOn.value);
  console.log(`Lights ${isLightOn.value ? "ON" : "OFF"}`);
};
const handleSwitchInteraction = () => {
  toggleLights();
};

const cleanup = () => {
  // Dispose lamp meshes
  lampMeshes.value.forEach((mesh) => {
    mesh.dispose();
  });
  lampMeshes.value = [];

  // Dispose lights
  lampLights.value.forEach((light) => {
    light.dispose();
  });
  lampLights.value = [];

  // Dispose ceiling lamps
  ceilingLamps.value.forEach((lamp) => {
    lamp.dispose();
  });
  ceilingLamps.value = [];

  // Dispose ceiling lights
  ceilingLights.value.forEach((light) => {
    light.dispose();
  });
  ceilingLights.value = [];

  // Dispose switch toggle
  const switchToggleBox = props.scene?.getMeshByName("lightSwitchToggle");
  if (switchToggleBox) {
    switchToggleBox.dispose();
  }

  // Reset switch references
  switchMaterial = null;
  switchToggle = null;
};

// Watch for scene changes
watch(
  () => props.scene,
  async (newScene) => {
    if (newScene) {
      await loadLamps(); // createWallSwitch() is already called inside loadLamps()
    }
  },
  { immediate: true },
);

onMounted(async () => {
  if (props.scene) {
    await loadLamps(); // createWallSwitch() is already called inside loadLamps()
  }
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
/* No styles needed for this component */
</style>
