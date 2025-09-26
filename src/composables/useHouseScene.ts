import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  CreateGround,
  CreateBox,
  StandardMaterial,
  Color3,
  Texture,
  Mesh,
  PhysicsImpostor,
} from "@babylonjs/core";
import { useCannonPhysics } from "./useCannonPhysics";

export interface RoomConfig {
  width: number;
  depth: number;
  height: number;
  position: Vector3;
}

export interface HouseGeometry {
  floors: Mesh[];
  walls: Mesh[];
  ceiling: Mesh[];
  doorways: Mesh[];
  exitTrigger: Mesh;
}

export const useHouseScene = () => {
  const { initPhysics, createWallPhysics, createFloorPhysics } =
    useCannonPhysics();

  let scene: Scene | null = null;
  let camera: FreeCamera | null = null;
  let houseGeometry: HouseGeometry | null = null;

  const createScene = (engine: Engine): Scene => {
    scene = new Scene(engine);

    // Initialize physics
    initPhysics(scene);

    // Setup lighting
    setupLighting(scene);

    // Create house geometry
    houseGeometry = createHouseGeometry(scene);

    return scene;
  };

  const createCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
  ): FreeCamera => {
    camera = new FreeCamera("houseCamera", new Vector3(0, 1.8, -3), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    // Disable default controls - we'll use custom FPS controls
    camera.inputs.clear();

    return camera;
  };

  const setupLighting = (scene: Scene) => {
    // Ambient light
    const hemisphericLight = new HemisphericLight(
      "houseAmbient",
      new Vector3(0, 1, 0),
      scene,
    );
    hemisphericLight.intensity = 0.4;
    hemisphericLight.diffuse = new Color3(1, 1, 0.9);

    // Directional light (like sunlight through windows)
    const directionalLight = new DirectionalLight(
      "houseSun",
      new Vector3(-1, -1, -1),
      scene,
    );
    directionalLight.intensity = 0.8;
    directionalLight.diffuse = new Color3(1, 0.95, 0.8);
  };

  const createHouseGeometry = (scene: Scene): HouseGeometry => {
    const geometry: HouseGeometry = {
      floors: [],
      walls: [],
      ceiling: [],
      doorways: [],
      exitTrigger: null as any,
    };

    // Room configurations
    const livingRoom: RoomConfig = {
      width: 40,
      depth: 40,
      height: 3,
      position: new Vector3(0, 0, 0),
    };

    const bedroom: RoomConfig = {
      width: 40,
      depth: 40,
      height: 3,
      position: new Vector3(45, 0, 0),
    };

    // Create rooms
    createRoom(scene, livingRoom, geometry, "living");
    createRoom(scene, bedroom, geometry, "bedroom");

    // Create connecting doorway between rooms
    createDoorway(scene, new Vector3(20, 0, 0), geometry);

    // Create exit door in living room
    createExitDoor(scene, new Vector3(-18, 0, -18), geometry);

    return geometry;
  };

  const createRoom = (
    scene: Scene,
    config: RoomConfig,
    geometry: HouseGeometry,
    roomName: string,
  ) => {
    const { width, depth, height, position } = config;

    // Floor
    const floor = CreateGround(
      `${roomName}Floor`,
      { width, height: depth },
      scene,
    );
    floor.position = position.clone();
    floor.position.y = 0; // Floor at ground level

    const floorMaterial = new StandardMaterial(`${roomName}FloorMat`, scene);
    floorMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Wood color
    floor.material = floorMaterial;

    geometry.floors.push(floor);
    createFloorPhysics(floor, scene);

    // Ceiling
    const ceiling = CreateGround(
      `${roomName}Ceiling`,
      { width, height: depth },
      scene,
    );
    ceiling.position = position.clone();
    ceiling.position.y = height;
    ceiling.rotation.z = Math.PI; // Flip upside down

    const ceilingMaterial = new StandardMaterial(
      `${roomName}CeilingMat`,
      scene,
    );
    ceilingMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9);
    ceiling.material = ceilingMaterial;

    geometry.ceiling.push(ceiling);
    createWallPhysics(ceiling, scene);

    // Walls
    createWalls(scene, config, geometry, roomName);
  };

  const createWalls = (
    scene: Scene,
    config: RoomConfig,
    geometry: HouseGeometry,
    roomName: string,
  ) => {
    const { width, depth, height, position } = config;
    const wallThickness = 0.2;

    // Wall material
    const wallMaterial = new StandardMaterial(`${roomName}WallMat`, scene);
    wallMaterial.diffuseColor = new Color3(0.8, 0.8, 0.7);

    // North wall (positive Z)
    const northWall = CreateBox(
      `${roomName}NorthWall`,
      { width: width + wallThickness, height, depth: wallThickness },
      scene,
    );
    northWall.position = position.clone();
    northWall.position.z += depth / 2;
    northWall.position.y += height / 2;
    northWall.material = wallMaterial;
    geometry.walls.push(northWall);
    createWallPhysics(northWall, scene);

    // South wall (negative Z)
    const southWall = CreateBox(
      `${roomName}SouthWall`,
      { width: width + wallThickness, height, depth: wallThickness },
      scene,
    );
    southWall.position = position.clone();
    southWall.position.z -= depth / 2;
    southWall.position.y += height / 2;
    southWall.material = wallMaterial;
    geometry.walls.push(southWall);
    createWallPhysics(southWall, scene);

    // East wall (positive X) - may have doorway
    if (roomName !== "living" || position.x <= 0) {
      const eastWall = CreateBox(
        `${roomName}EastWall`,
        { width: wallThickness, height, depth },
        scene,
      );
      eastWall.position = position.clone();
      eastWall.position.x += width / 2;
      eastWall.position.y += height / 2;
      eastWall.material = wallMaterial;
      geometry.walls.push(eastWall);
      createWallPhysics(eastWall, scene);
    }

    // West wall (negative X) - may have exit door
    if (roomName !== "living") {
      const westWall = CreateBox(
        `${roomName}WestWall`,
        { width: wallThickness, height, depth },
        scene,
      );
      westWall.position = position.clone();
      westWall.position.x -= width / 2;
      westWall.position.y += height / 2;
      westWall.material = wallMaterial;
      geometry.walls.push(westWall);
      createWallPhysics(westWall, scene);
    }
  };

  const createDoorway = (
    scene: Scene,
    position: Vector3,
    geometry: HouseGeometry,
  ) => {
    // Doorway is just empty space - no mesh needed
    // But we can create invisible trigger for interactions if needed
    const doorway = CreateBox(
      "doorway",
      { width: 1, height: 2, depth: 0.2 },
      scene,
    );
    doorway.position = position.clone();
    doorway.position.y += 1;
    doorway.isVisible = false;
    geometry.doorways.push(doorway);
  };

  const createExitDoor = (
    scene: Scene,
    position: Vector3,
    geometry: HouseGeometry,
  ) => {
    // Create exit trigger zone
    const exitTrigger = CreateBox(
      "exitTrigger",
      { width: 2, height: 2, depth: 1 },
      scene,
    );
    exitTrigger.position = position.clone();
    exitTrigger.position.y += 1;
    exitTrigger.isVisible = false; // Invisible trigger

    geometry.exitTrigger = exitTrigger;
  };

  const createPlayerMesh = (scene: Scene): Mesh => {
    // Create invisible box for player physics
    const player = CreateBox(
      "player",
      { width: 0.8, height: 1.8, depth: 0.8 },
      scene,
    );
    player.position = new Vector3(0, 0.9, 0); // Start in center of living room, lower height
    player.isVisible = false; // Player is invisible

    return player;
  };

  const dispose = () => {
    if (houseGeometry) {
      [
        ...houseGeometry.floors,
        ...houseGeometry.walls,
        ...houseGeometry.ceiling,
        ...houseGeometry.doorways,
      ].forEach((mesh) => {
        if (mesh.physicsImpostor) {
          mesh.physicsImpostor.dispose();
        }
        mesh.dispose();
      });

      if (houseGeometry.exitTrigger) {
        houseGeometry.exitTrigger.dispose();
      }
    }

    camera = null;
    scene = null;
    houseGeometry = null;
  };

  return {
    createScene,
    createCamera,
    createPlayerMesh,
    getExitTrigger: () => houseGeometry?.exitTrigger,
    dispose,
  };
};
