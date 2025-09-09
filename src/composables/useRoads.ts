import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  Texture,
} from "@babylonjs/core";
import asphaltTextureUrl from "../assets/textures/asphalt-color.jpg";
import pavingStonesTextureUrl from "../assets/textures/pavingStones-color.jpg";

export interface RoadConfig {
  // Basic road settings
  asphaltColor?: Color3;
  asphaltSpecular?: Color3;

  // Road markings settings
  markingsColor?: Color3;
  markingsWidth?: number;

  // Curb settings
  curbColor?: Color3;
  curbHeight?: number;
  curbWidth?: number;

  // Sidewalk settings
  sidewalkColor?: Color3;
  addSidewalk?: boolean;

  // Road segments
  roads?: Array<{
    name: string;
    width: number;
    height: number;
    position: Vector3;
    addMarkings?: boolean; // Whether to add road markings to this road
    addCurbs?: boolean; // Whether to add curbs to this road
  }>;
}

export const useRoads = () => {
  const createRoads = (scene: Scene, config: RoadConfig = {}) => {
    // Create textured asphalt material for main street
    const texturedAsphaltMaterial = new StandardMaterial(
      "texturedAsphaltMaterial",
      scene,
    );
    const asphaltTexture = new Texture(asphaltTextureUrl, scene);
    asphaltTexture.uOffset = 0;
    asphaltTexture.vOffset = 0;
    asphaltTexture.uScale = 20;
    asphaltTexture.vScale = 6;

    texturedAsphaltMaterial.diffuseTexture = asphaltTexture;
    texturedAsphaltMaterial.diffuseColor = new Color3(1, 1, 1); // White to show texture properly
    texturedAsphaltMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

    // Create gray asphalt material for other roads
    const grayAsphaltMaterial = new StandardMaterial(
      "grayAsphaltMaterial",
      scene,
    );
    grayAsphaltMaterial.diffuseColor =
      config.asphaltColor || new Color3(0.3, 0.3, 0.3);
    grayAsphaltMaterial.specularColor =
      config.asphaltSpecular || new Color3(0.1, 0.1, 0.1);

    // Create road markings material
    const markingsMaterial = new StandardMaterial("markingsMaterial", scene);
    markingsMaterial.diffuseColor = config.markingsColor || new Color3(1, 1, 1); // White markings
    markingsMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

    // Create curb material
    const curbMaterial = new StandardMaterial("curbMaterial", scene);
    curbMaterial.diffuseColor = config.curbColor || new Color3(0.5, 0.5, 0.5); // Light gray curbs
    curbMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

    // Create sidewalk material with paving stones texture
    const sidewalkMaterial = new StandardMaterial("sidewalkMaterial", scene);
    const pavingTexture = new Texture(pavingStonesTextureUrl, scene);
    pavingTexture.uOffset = 0;
    pavingTexture.vOffset = 0;
    pavingTexture.uScale = 12;
    pavingTexture.vScale = 2;

    sidewalkMaterial.diffuseTexture = pavingTexture;
    sidewalkMaterial.diffuseColor = config.sidewalkColor || new Color3(1, 1, 1);
    sidewalkMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

    // Default roads if none provided
    const defaultRoads = [
      {
        name: "asphaltGarage",
        width: 10,
        height: 16,
        position: new Vector3(11, 0.01, 4),
        addMarkings: false,
      },
      {
        name: "asphaltStreet",
        width: 60,
        height: 16,
        position: new Vector3(0, 0.01, -12),
        addMarkings: true, // Add markings to main street
        addCurbs: true, // Add curbs to main street
      },
      {
        name: "asphaltDoor",
        width: 2,
        height: 8,
        position: new Vector3(19.3, 0.01, 0),
        addMarkings: false,
      },
    ];

    const roads = config.roads || defaultRoads;
    const createdRoads: Mesh[] = [];
    const createdMarkings: Mesh[] = [];
    const createdCurbs: Mesh[] = [];
    const createdSidewalks: Mesh[] = [];

    // Helper function to create road markings
    const createRoadMarkings = (roadConfig: {
      name: string;
      width: number;
      height: number;
      position: Vector3;
      addMarkings?: boolean;
    }) => {
      const markingsWidth = config.markingsWidth || 0.3;

      // Create two parallel stripes
      const leftMarking = MeshBuilder.CreateGround(
        `${roadConfig.name}_marking_left`,
        {
          width: markingsWidth,
          height: roadConfig.width,
          subdivisions: 1,
        },
        scene,
      );

      const rightMarking = MeshBuilder.CreateGround(
        `${roadConfig.name}_marking_right`,
        {
          width: markingsWidth,
          height: roadConfig.width,
          subdivisions: 1,
        },
        scene,
      );

      // Position markings slightly above the road surface
      const markingHeight = roadConfig.position.y + 0.002;

      leftMarking.position = new Vector3(
        0,
        markingHeight,
        roadConfig.position.z + 0.6,
      );
      leftMarking.rotation = new Vector3(0, Math.PI / 2, 0);

      rightMarking.position = new Vector3(
        0,
        markingHeight,
        roadConfig.position.z,
      );
      rightMarking.rotation = new Vector3(0, Math.PI / 2, 0);

      // Apply material
      leftMarking.material = markingsMaterial;
      rightMarking.material = markingsMaterial;

      leftMarking.receiveShadows = true;
      rightMarking.receiveShadows = true;

      createdMarkings.push(leftMarking, rightMarking);
    };

    // Helper function to create road curbs
    const createRoadCurbs = (roadConfig: {
      name: string;
      width: number;
      height: number;
      position: Vector3;
      addCurbs?: boolean;
    }) => {
      const curbHeight = config.curbHeight || 0.2;
      const curbWidth = config.curbWidth || 0.3;

      // Create curbs along the long sides of the road
      const leftCurb1 = MeshBuilder.CreateBox(
        `${roadConfig.name}_curb_left_1`,
        {
          width: curbWidth,
          height: curbHeight,
          depth: roadConfig.width,
        },
        scene,
      );
      const leftCurb2 = MeshBuilder.CreateBox(
        `${roadConfig.name}_curb_left_2`,
        {
          width: curbWidth,
          height: curbHeight,
          depth: roadConfig.width,
        },
        scene,
      );

      const rightCurb1 = MeshBuilder.CreateBox(
        `${roadConfig.name}_curb_right`,
        {
          width: curbWidth,
          height: curbHeight,
          depth: 36,
        },
        scene,
      );
      const rightCurb2 = MeshBuilder.CreateBox(
        `${roadConfig.name}_curb_right_2`,
        {
          width: curbWidth,
          height: curbHeight,
          depth: 14,
        },
        scene,
      );

      // Position curbs at the edges of the road
      const curbY = roadConfig.position.y + curbHeight / 2;

      leftCurb1.position = new Vector3(0, curbY, -20.1);
      leftCurb1.rotation = new Vector3(0, Math.PI / 2, 0);

      leftCurb2.position = new Vector3(0, curbY, -24.1);
      leftCurb2.rotation = new Vector3(0, Math.PI / 2, 0);

      rightCurb1.position = new Vector3(-12, curbY, -4.1);
      rightCurb1.rotation = new Vector3(0, Math.PI / 2, 0);

      rightCurb2.position = new Vector3(23, curbY, -4.1);
      rightCurb2.rotation = new Vector3(0, Math.PI / 2, 0);

      // Apply material
      leftCurb1.material = curbMaterial;
      leftCurb2.material = curbMaterial;
      rightCurb1.material = curbMaterial;
      rightCurb2.material = curbMaterial;

      // Enable shadow casting and receiving
      leftCurb1.receiveShadows = true;
      leftCurb2.receiveShadows = true;
      rightCurb1.receiveShadows = true;
      rightCurb2.receiveShadows = true;

      createdCurbs.push(leftCurb1, leftCurb2, rightCurb1, rightCurb2);
    };

    // Helper function to create sidewalk
    const createSidewalk = () => {
      const sidewalk = MeshBuilder.CreateGround(
        "sidewalk",
        {
          width: 60,
          height: 4,
          subdivisions: 1,
        },
        scene,
      );

      sidewalk.position = new Vector3(0, 0.005, -22);
      sidewalk.material = sidewalkMaterial;
      sidewalk.receiveShadows = true;

      createdSidewalks.push(sidewalk);
    };

    roads.forEach((roadConfig) => {
      const road = MeshBuilder.CreateGround(
        roadConfig.name,
        {
          width: roadConfig.width,
          height: roadConfig.height,
          subdivisions: 1,
        },
        scene,
      );

      road.position = roadConfig.position;
      // Use textured material for asphaltStreet, gray material for others
      road.material =
        roadConfig.name === "asphaltStreet"
          ? texturedAsphaltMaterial
          : grayAsphaltMaterial;
      road.receiveShadows = true;

      createdRoads.push(road);

      // Add road markings if enabled for this road
      if (roadConfig.addMarkings) {
        createRoadMarkings(roadConfig);
      }

      // Add road curbs if enabled for this road
      if (roadConfig.addCurbs) {
        createRoadCurbs(roadConfig);
      }
    });

    // Create sidewalk if enabled
    if (config.addSidewalk !== false) {
      createSidewalk();
    }

    return {
      roads: createdRoads,
      markings: createdMarkings,
      curbs: createdCurbs,
      sidewalks: createdSidewalks,
      texturedMaterial: texturedAsphaltMaterial,
      grayMaterial: grayAsphaltMaterial,
      markingsMaterial,
      curbMaterial,
      sidewalkMaterial,
    };
  };

  return {
    createRoads,
  };
};
