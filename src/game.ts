import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";
import { HexGridMap } from "estomania-server/types/HexGridMap";
import { Game } from "estomania-server/types/Game";
import { Unit } from "estomania-server/types/Unit";

export let gameScene: GameScene;

export class GameScene {
    camera: Camera;
    renderer: THREE.Renderer;
    scene: THREE.Scene;
    pickHelper: PickHelper;
    inputElement: Element;
    hexGridMap: HexGridMap;
    objectHashMap: Map<string, THREE.Object3D<THREE.Object3DEventMap>> =
        new Map();

    constructor(
        canvas: HTMLCanvasElement,
        inputElement: Element,
        cameraSettings: CameraSettings
    ) {
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.camera = new Camera(cameraSettings, inputElement);
        this.scene = new THREE.Scene();
        this.pickHelper = new PickHelper(inputElement);
        this.inputElement = inputElement;

        this.setupGlobalLights();

        const that = this;

        function render() {
            if (that.resizeRendererToDisplaySize()) {
                that.camera.updateProjectionMatrix(
                    that.inputElement.clientWidth,
                    that.inputElement.clientHeight
                );
            }

            that.pickHelper.pick(that.scene, that.camera.cameraObject);
            that.renderer.render(that.scene, that.camera.cameraObject);
            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }

    raycastFromCamera() {
        this.pickObject();
    }

    loadGameSceneData(data: Game) {
        console.log(data);
        this.hexGridMap = data.hexGridMap;
        this.createMap();
        data.currentPlayers.forEach((player) => {
            player.units.forEach((unit) => {
                this.createUnit(unit);
            });
        });
    }

    createUnit(unit: Unit) {
        const unitGeometry = new THREE.BoxGeometry(1, 1, 1);
        const unitMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: false,
        });
        const unitMesh = new THREE.Mesh(unitGeometry, unitMaterial);
        unitMesh.position.set(unit.position.x, 0, unit.position.z);
        const parentHexUUID =
            this.hexGridMap.grid[unit.position.x][unit.position.z].uuid;
        const parentHex = this.getObjectByUuid(parentHexUUID);
        unitMesh.position.copy(parentHex.position);
        unitMesh.uuid = unit.uuid;

        // TODO: Update name from the players name
        this.createNameTag(unitMesh, unit.ownerName, unitMesh.position);

        this.addObject(unitMesh);
    }

    createMap() {
        const hexGridGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);
        const plainsGridMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: false,
        });
        const waterHexGridMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: false,
        });

        this.hexGridMap.grid.forEach((hexRow) => {
            hexRow.forEach((hex) => {
                if (hex) {
                    let hexMesh: THREE.Mesh;
                    switch (hex.tileType) {
                        case "plains":
                            hexMesh = new THREE.Mesh(
                                hexGridGeometry,
                                plainsGridMaterial
                            );
                            break;
                        case "water":
                            hexMesh = new THREE.Mesh(
                                hexGridGeometry,
                                waterHexGridMaterial
                            );
                            break;
                        default:
                            hexMesh = new THREE.Mesh(
                                hexGridGeometry,
                                plainsGridMaterial
                            );
                    }
                    hexMesh.rotation.y = Math.PI / 2;
                    const zOffsetPointy =
                        hex.position.x % 2 === 0 ? Math.sqrt(3) / 2 : 0;
                    hexMesh.position.set(
                        hex.position.x * 1.5,
                        0,
                        hex.position.z * Math.sqrt(3) + zOffsetPointy
                    );
                    hexMesh.uuid = hex.uuid;
                    this.addObject(hexMesh);
                }
            });
        });
    }

    pickObject() {
        this.pickHelper.pick(this.scene, this.camera.cameraObject);

        if (this.pickHelper.pickedObject) {
            console.log(this.pickHelper.pickedObject);
        } else {
            console.log(this.scene.children);
        }
    }

    addObject(object: THREE.Object3D<THREE.Object3DEventMap>) {
        this.objectHashMap.set(object.uuid, object);
        this.scene.add(object);
    }
    /**
     * @deprecated
     */
    removeObject(object: THREE.Object3D<THREE.Object3DEventMap>) {
        this.objectHashMap.delete(object.uuid);
        this.scene.remove(object);
    }

    createNameTag(
        parentObject: THREE.Object3D,
        text: string,
        position: THREE.Vector3
    ) {
        let canvas: HTMLCanvasElement | OffscreenCanvas;
        let context:
            | OffscreenCanvasRenderingContext2D
            | CanvasRenderingContext2D
            | null;

        if (typeof OffscreenCanvas !== "undefined") {
            canvas = new OffscreenCanvas(256, 128);
            context = canvas.getContext("2d");
        } else {
            canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 128;
            context = canvas.getContext("2d");
        }

        if (!context) return;

        context.font = "Bold 20px Arial";
        context.fillStyle = "rgba(255, 255, 255, 0.95)";
        context.fillText(text, 10, 50);

        const texture = new THREE.CanvasTexture(canvas);

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.copy(position);

        parentObject.add(sprite);
    }

    setupGlobalLights() {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        this.addObject(light);
    }

    resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const width = this.inputElement.clientWidth;
        const height = this.inputElement.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    getObjectByUuid(uuid: string) {
        return this.objectHashMap.get(uuid);
    }

    removeObjectByUuid(uuid: string) {
        const object = this.objectHashMap.get(uuid);
        if (object) {
            this.scene.remove(object);
            this.objectHashMap.delete(uuid);
        }
    }
}

export class Camera {
    cameraObject: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    controls?: OrbitControls;

    constructor(cameraSettings: CameraSettings, inputElement?: Element) {
        this.cameraObject.fov = cameraSettings.fov;
        this.cameraObject.aspect = cameraSettings.aspect;
        this.cameraObject.near = cameraSettings.near;
        this.cameraObject.far = cameraSettings.far;
        this.cameraObject.position.copy(cameraSettings.position);
        if (inputElement) {
            this.setControls(inputElement);
        }
    }

    setControls(inputElement: Element) {
        this.controls = new OrbitControls(this.cameraObject, inputElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setPosition(newPos: THREE.Vector3) {
        this.cameraObject.position.copy(newPos);
        if (this.controls) {
            this.controls.update();
        }
    }

    updateProjectionMatrix(clientWidth: number, clientHeight: number) {
        this.cameraObject.aspect = clientWidth / clientHeight;
        this.cameraObject.updateProjectionMatrix();
    }
}

export class PickHelper {
    raycaster: THREE.Raycaster;
    pickedObject: THREE.Object3D<THREE.Object3DEventMap> | null;
    inputElement: Element;
    pickPosition = { x: 0, y: 0 };

    constructor(inputElement: Element) {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.inputElement = inputElement;
        this.clearPickPosition = this.clearPickPosition.bind(this);
        this.setPickPosition = this.setPickPosition.bind(this);

        this.clearPickPosition();
        this.addEventListeners();
    }

    addEventListeners() {
        this.inputElement.addEventListener("mousemove", this.setPickPosition);
        this.inputElement.addEventListener("mouseout", this.clearPickPosition);
        this.inputElement.addEventListener(
            "mouseleave",
            this.clearPickPosition
        );

        this.inputElement.addEventListener(
            "touchstart",
            (event: any) => {
                event.preventDefault();
                this.setPickPosition(event.touches[0]);
            },
            { passive: false }
        );

        this.inputElement.addEventListener("touchmove", (event: any) => {
            this.setPickPosition(event.touches[0]);
        });

        this.inputElement.addEventListener("touchend", this.clearPickPosition);
    }

    pick(scene: THREE.Scene, camera: THREE.Camera) {
        if (this.pickedObject) {
            this.pickedObject = null;
        }
        this.raycaster.setFromCamera(
            new THREE.Vector2(this.pickPosition.x, this.pickPosition.y),
            camera
        );
        const intersectedObjects = this.raycaster.intersectObjects(
            scene.children
        );
        if (intersectedObjects.length) {
            this.pickedObject = intersectedObjects[0].object;
        }
    }

    getCanvasRelativePosition(event: any) {
        const rect = this.inputElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    setPickPosition(event: any) {
        const pos = this.getCanvasRelativePosition(event);
        this.pickPosition.x = (pos.x / this.inputElement.clientWidth) * 2 - 1;
        this.pickPosition.y = (pos.y / this.inputElement.clientHeight) * -2 + 1;
    }

    clearPickPosition() {
        this.pickPosition.x = -100000;
        this.pickPosition.y = -100000;
    }
}

export type CameraSettings = {
    fov: number;
    aspect: number;
    near: 0.1;
    far: 100;
    position: THREE.Vector3;
};

export function init(data: { canvas: any; inputElement: any }) {
    const { canvas, inputElement } = data;

    const cameraSettings: CameraSettings = {
        fov: 75,
        aspect: 2,
        near: 0.1,
        far: 100,
        position: new THREE.Vector3(3, 4, 5),
    };

    gameScene = new GameScene(canvas, inputElement, cameraSettings);
}
