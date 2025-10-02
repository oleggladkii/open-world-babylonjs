<template lang="pug">
div
  InteractionPrompt(
    text="Press E to switch light"
    :trigger-position="switchPosition"
    :trigger-radius="2.5"
    :player-position="playerPosition"
    :is-active="isActive"
    :key-binding="KEY_CODES.E"
    @interact="handleSwitchInteraction"
  )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
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
import { KEY_CODES } from "../../constants/keyCodes";

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
const isLightOn = ref(true);
const lampMeshes = ref<AbstractMesh[]>([]);
const lampLights = ref<PointLight[]>([]);
const switchPosition = new Vector3(-0.2, 2.5, 4.5); // Wall switch position near window
let switchMaterial: StandardMaterial | null = null; // Store switch material reference
let switchToggle: Mesh | null = null; // Store switch toggle reference
let switchIndicator: Mesh | null = null; // Store switch indicator reference
let switchIndicatorMaterial: StandardMaterial | null = null; // Store switch indicator material reference
let switchGlowLight: PointLight | null = null; // Store switch glow light reference
const ceilingLamps = ref<Mesh[]>([]); // Store ceiling lamp meshes
const ceilingLights = ref<PointLight[]>([]); // Store ceiling point lights
const { loadModel } = useLoadModel();

// Computed property to determine if interaction prompt is active
const isPromptActive = computed(() => {
  if (!props.isActive || !props.playerPosition) return false;

  const distance = Vector3.Distance(props.playerPosition, switchPosition);
  return distance <= 2.5; // Same trigger radius as InteractionPrompt
});

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

const updateSwitchMaterial = () => {
  if (!switchMaterial || !switchIndicatorMaterial) return;

  // Switch body stays gray always
  switchMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4); // Always gray
  switchMaterial.emissiveColor = new Color3(0, 0, 0); // No emissive on body

  // Update indicator based on light state and prompt state
  if (isLightOn.value) {
    // Light is ON - green indicator
    switchIndicatorMaterial.diffuseColor = new Color3(0.3, 0.75, 0.3); // Green
    switchIndicatorMaterial.emissiveColor = new Color3(0.2, 0.5, 0.2); // Green emissive
  } else {
    // Light is OFF - dark indicator
    switchIndicatorMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1); // Dark
    switchIndicatorMaterial.emissiveColor = new Color3(0, 0, 0); // No emissive
  }

  // Add warm glow to indicator when interaction prompt is active
  if (isPromptActive.value) {
    switchIndicatorMaterial.emissiveColor = isLightOn.value
      ? new Color3(0.4, 0.8, 0.4) // Brighter green when active and ON
      : new Color3(0.25, 0.22, 0.18); // Warm glow when active and OFF
  }

  // Control glow light intensity based on prompt state
  if (switchGlowLight) {
    switchGlowLight.intensity = isPromptActive.value ? 0.8 : 0;
  }
};

const createWallSwitch = () => {
  if (!props.scene) return;

  // Create switch body (gray box)
  switchToggle = MeshBuilder.CreateBox(
    "lightSwitchToggle",
    { width: 0.1, height: 0.4, depth: 0.4 },
    props.scene,
  );
  switchToggle.position = switchPosition.clone();

  // Create switch body material (always gray)
  switchMaterial = new StandardMaterial("toggleMaterial", props.scene);
  switchMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4); // Gray
  switchMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
  switchToggle.material = switchMaterial;

  // Create small indicator in the center
  switchIndicator = MeshBuilder.CreateBox(
    "lightSwitchIndicator",
    { width: 0.12, height: 0.1, depth: 0.1 }, // Slightly wider than switch body to avoid z-fighting
    props.scene,
  );
  // Position indicator slightly in front of the switch body
  switchIndicator.position = switchPosition.clone();
  switchIndicator.position.x += 0.01; // Move slightly forward

  // Create indicator material
  switchIndicatorMaterial = new StandardMaterial(
    "indicatorMaterial",
    props.scene,
  );
  switchIndicatorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
  switchIndicator.material = switchIndicatorMaterial;
  switchIndicator.material.zOffset = -1;

  // Create glow light for switch interaction feedback
  switchGlowLight = new PointLight(
    "switchGlowLight",
    switchPosition.clone(),
    props.scene,
  );
  switchGlowLight.intensity = 0; // Start with no glow
  switchGlowLight.diffuse = new Color3(0.25, 0.22, 0.18); // Red glow
  switchGlowLight.specular = new Color3(0.25, 0.22, 0.18); // Red specular
  switchGlowLight.range = 3; // Small range for subtle effect
  switchGlowLight.radius = 0.1; // Small radius for soft glow

  // Set initial material state
  updateSwitchMaterial();

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

  for (let i = 0; i < allPositions.length; i++) {
    const position = allPositions[i];
    // Create circular lamp mesh
    const lampMesh = MeshBuilder.CreateCylinder(
      `ceilingLamp_${i}`,
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
      `ceilingLampMaterial_${i}`,
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

    // No individual lights for ceiling lamps - only visual meshes
  }

  // Create one central ceiling light above carpet
  const centralCeilingLight = new PointLight(
    "centralCeilingLight",
    new Vector3(-5, 2, -4), // Center of carpet position
    props.scene,
  );

  // Configure central light properties
  centralCeilingLight.intensity = 0; // Start with lights off
  centralCeilingLight.diffuse = new Color3(1, 0.9, 0.7); // Warm white light
  centralCeilingLight.specular = new Color3(0.5, 0.5, 0.4); // Reduced specular
  centralCeilingLight.range = 15; // Large range to cover whole room
  centralCeilingLight.radius = 0.1; // Soft light

  ceilingLights.value.push(centralCeilingLight);

  console.log(
    `Created ${allPositions.length} ceiling lamps (visual only) + 1 central light at carpet center`,
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
          }
        });

        // Create point light for each lamp
        const lampLight = new PointLight(
          `lampLight_${i}`,
          new Vector3(config.position.x, config.position.y, config.position.z),
          props.scene,
        );

        // Configure light properties for better performance
        lampLight.intensity = 0.8; // Start with lights off
        lampLight.diffuse = new Color3(1, 0.9, 0.7); // Warm white light
        lampLight.specular = new Color3(0.5, 0.5, 0.4); // Reduced specular for performance
        lampLight.range = 6; // Reduced light range for better performance
        lampLight.radius = 0.05; // Smaller radius for better performance

        lampLights.value.push(lampLight);
      }
    }

    // Create wall switch after loading all lamps
    createWallSwitch();

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
    light.intensity = isLightOn.value ? 0.8 : 0;
  });

  // Toggle central ceiling light
  ceilingLights.value.forEach((light) => {
    light.intensity = isLightOn.value ? 1.5 : 0;
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

  // Update switch material (includes both color and emissive)
  updateSwitchMaterial();

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

  // Dispose switch indicator
  const switchIndicatorBox = props.scene?.getMeshByName("lightSwitchIndicator");
  if (switchIndicatorBox) {
    switchIndicatorBox.dispose();
  }

  // Dispose switch glow light
  if (switchGlowLight) {
    switchGlowLight.dispose();
  }

  // Reset switch references
  switchMaterial = null;
  switchToggle = null;
  switchIndicator = null;
  switchIndicatorMaterial = null;
  switchGlowLight = null;
};

// Watch for prompt active state changes to update switch emissive
watch(isPromptActive, () => {
  updateSwitchMaterial();
});

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
