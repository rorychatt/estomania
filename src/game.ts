import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';

// Credit to https://threejsfundamentals.org/threejs/threejs-offscreencanvas-w-orbitcontrols.html

export let game: Game;

export class Game {

    camera: Camera;
    renderer: THREE.Renderer;
    scene: THREE.Scene;
    pickHelper: PickHelper;
    inputElement: Element;

    constructor(canvas: HTMLCanvasElement, inputElement: Element, cameraSettings: CameraSettings) {

        this.renderer = new THREE.WebGLRenderer({ canvas })
        this.camera = new Camera(cameraSettings, inputElement)
        this.scene = new THREE.Scene();
        this.pickHelper = new PickHelper(inputElement)
        this.inputElement = inputElement

        this.setupGlobalLights();


        const geometry = new THREE.BoxGeometry(1, 1, 1);

        const that = this

        function makeInstance(geometry, color, x) {
            const material = new THREE.MeshPhongMaterial({
                color,
            });

            const cube = new THREE.Mesh(geometry, material);
            that.addObject(cube)

            cube.position.x = x;

            return cube;
        }

        const cubes = [
            makeInstance(geometry, 0x44aa88, 0),
            makeInstance(geometry, 0x8844aa, -2),
            makeInstance(geometry, 0xaa8844, 2),
        ];

        
        function render() {
            if (that.resizeRendererToDisplaySize()) {
                that.camera.updateProjectionMatrix(that.inputElement.clientWidth, that.inputElement.clientHeight);
            }

            that.pickHelper.pick(that.scene, that.camera.cameraObject)
            that.renderer.render(that.scene, that.camera.cameraObject)
            requestAnimationFrame(render)
        }

        requestAnimationFrame(render)

    }

    loadMapData(data){
        console.log(data)
    }

    addObject(object: THREE.Object3D<THREE.Object3DEventMap>) {
        this.scene.add(object)
    }

    setupGlobalLights() {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        this.addObject(light)
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

}

export class Camera {

    cameraObject: THREE.PerspectiveCamera = new THREE.PerspectiveCamera;
    controls?: OrbitControls;

    constructor(cameraSettings: CameraSettings, inputElement?: Element) {
        this.cameraObject.fov = cameraSettings.fov;
        this.cameraObject.aspect = cameraSettings.aspect;
        this.cameraObject.near = cameraSettings.near;
        this.cameraObject.far = cameraSettings.far;
        this.cameraObject.position.copy(cameraSettings.position);
        if (inputElement) {
            this.setControls(inputElement)
        }
    }

    setControls(inputElement: Element) {
        this.controls = new OrbitControls(this.cameraObject, inputElement)
        this.controls.target.set(0, 0, 0);
        this.controls.update()
    }

    setPosition(newPos: THREE.Vector3) {
        this.cameraObject.position.copy(newPos)
        if (this.controls) {
            this.controls.update()
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
    inputElement: Element
    pickPosition = { x: 0, y: 0 }

    constructor(inputElement: Element) {
        this.raycaster = new THREE.Raycaster()
        this.pickedObject = null;
        this.inputElement = inputElement
        this.clearPickPosition = this.clearPickPosition.bind(this)
        this.setPickPosition = this.setPickPosition.bind(this)

        this.clearPickPosition()
        this.addEventListeners()
    }

    addEventListeners() {
        this.inputElement.addEventListener('mousemove', this.setPickPosition);
        this.inputElement.addEventListener('mouseout', this.clearPickPosition);
        this.inputElement.addEventListener('mouseleave', this.clearPickPosition);

        this.inputElement.addEventListener('touchstart', (event: any) => {
            event.preventDefault();
            this.setPickPosition(event.touches[0]);
        }, { passive: false });

        this.inputElement.addEventListener('touchmove', (event: any) => {
            this.setPickPosition(event.touches[0]);
        });

        this.inputElement.addEventListener('touchend', this.clearPickPosition);

    }

    pick(scene: THREE.Scene, camera: THREE.Camera) {
        if (this.pickedObject) {
            this.pickedObject = null;
        }
        this.raycaster.setFromCamera(new THREE.Vector2(this.pickPosition.x, this.pickPosition.y), camera);
        const intersectedObjects = this.raycaster.intersectObjects(scene.children)
        if (intersectedObjects.length) {
            this.pickedObject = intersectedObjects[0].object
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
    position: THREE.Vector3
}

export function init(data) {
    const { canvas, inputElement } = data;

    const cameraSettings: CameraSettings = {
        fov: 75,
        aspect: 2,
        near: 0.1,
        far: 100,
        position: new THREE.Vector3(0, 0, 4)
    }

    game = new Game(canvas, inputElement, cameraSettings)
}

// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// export class Game {
//     renderer: THREE.WebGLRenderer;
//     scene: THREE.Scene;
//     camera: THREE.PerspectiveCamera;
//     controls: OrbitControls;
//     raycaster: THREE.Raycaster;
//     mouse: THREE.Vector2;

//     constructor() {
//         this._setupRenderer();
//         this._setupScene();
//         this._setupCamera();
//         this._setupControls();
//         this._setupEventListeners();
//     }

//     createHexGridMap(grid: { position: { x: number; z: number } }[][]) {
//         const hexGridGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);
//         const hexGridMaterial = new THREE.MeshBasicMaterial({
//             color: 0x00ff00,
//             wireframe: false,
//         });

//         grid.forEach((row: { position: { x: number; z: number } }[]) => {
//             row.forEach((hex: { position: { x: number; z: number } }) => {
//                 if (hex) {
//                     const hexMesh = new THREE.Mesh(
//                         hexGridGeometry,
//                         hexGridMaterial
//                     );
//                     hexMesh.rotation.y = Math.PI / 2;
//                     const zOffsetPointy =
//                         hex.position.x % 2 === 0 ? Math.sqrt(3) / 2 : 0;
//                     hexMesh.position.set(
//                         hex.position.x * 1.5,
//                         0,
//                         hex.position.z * Math.sqrt(3) + zOffsetPointy
//                     );
//                     this.scene.add(hexMesh);
//                 }
//             });
//         });
//     }

//     _setupRenderer() {
//         this.renderer = new THREE.WebGLRenderer();
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//         document.body.appendChild(this.renderer.domElement);
//     }

//     _setupScene() {
//         this.scene = new THREE.Scene();
//     }

//     _setupCamera() {
//         this.camera = new THREE.PerspectiveCamera(
//             75,
//             window.innerWidth / window.innerHeight,
//             0.1,
//             1000
//         );

//         //Camera default position hard coding for future
//         this.camera.position.set(0, 50, 100);
//         this.camera.lookAt(0, 0, 0);
//     }

//     _setupControls() {
//         this.controls = new OrbitControls(
//             this.camera,
//             this.renderer.domElement
//         );
//         this.controls.target.set(0, 0, 0);
//         this.controls.update();
//     }

//     _setupEventListeners() {
//         this._setupRaycaster();
//     }

//     _setupRaycaster() {
//         this.raycaster = new THREE.Raycaster();
//         this.mouse = new THREE.Vector2();

//         const that = this;

//         function onMouseMove(event) {
//             that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//             that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//         }

//         function onMouseClick(event) {
//             that.raycaster.setFromCamera(that.mouse, that.camera);
//             const intersects = that.raycaster.intersectObjects(
//                 that.scene.children,
//                 true
//             );
//             if (intersects.length > 0) {
//                 const object = intersects[0].object;
//                 console.log("Clicked on:", intersects[0].object);
//                 that.scene.remove(object);
//             }
//         }

//         window.addEventListener("mousemove", onMouseMove, false);
//         window.addEventListener("click", onMouseClick, false);
//     }
// }
