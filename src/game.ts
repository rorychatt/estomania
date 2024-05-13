import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';

// Credit to https://threejsfundamentals.org/threejs/threejs-offscreencanvas-w-orbitcontrols.html

export class Game {
    
    constructor() {

    }
}

export class Camera {

    cameraObject: THREE.PerspectiveCamera = new THREE.PerspectiveCamera;
    controls?: OrbitControls;

    constructor(cameraSettings: CameraSettings) {
        this.cameraObject.fov = cameraSettings.fov;
        this.cameraObject.aspect = cameraSettings.aspect;
        this.cameraObject.near = cameraSettings.near;
        this.cameraObject.far = cameraSettings.far;
        this.cameraObject.position.copy(cameraSettings.position);
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

}

export type CameraSettings = {
    fov: number;
    aspect: number;
    near: 0.1;
    far: 100;
    position: THREE.Vector3
}

export function init(data) {   /* eslint-disable-line no-unused-vars */
    const { canvas, inputElement } = data;
    const renderer = new THREE.WebGLRenderer({ canvas });

    const camera = new Camera({
        fov: 75,
        aspect: 2,
        near: 0.1,
        far: 100,
        position: new THREE.Vector3(0, 0, 4)
    })

    console.log(inputElement)

    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({
            color,
        });

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;

        return cube;
    }

    const cubes = [
        makeInstance(geometry, 0x44aa88, 0),
        makeInstance(geometry, 0x8844aa, -2),
        makeInstance(geometry, 0xaa8844, 2),
    ];

    class PickHelper {
        raycaster: any;
        pickedObject: any;
        pickedObjectSavedColor: any;
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
        }
        pick(normalizedPosition, scene, camera, time) {
            // restore the color if there is a picked object
            if (this.pickedObject) {
                this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                this.pickedObject = undefined;
            }

            // cast a ray through the frustum
            this.raycaster.setFromCamera(normalizedPosition, camera);
            // get the list of objects the ray intersected
            const intersectedObjects = this.raycaster.intersectObjects(scene.children);
            if (intersectedObjects.length) {
                // pick the first object. It's the closest one
                this.pickedObject = intersectedObjects[0].object;
                // save its color
                this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                // set its emissive color to flashing red/yellow
                this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
            }
        }
    }

    const pickPosition = { x: -2, y: -2 };
    const pickHelper = new PickHelper();
    clearPickPosition();

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = inputElement.clientWidth;
        const height = inputElement.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            camera.cameraObject.aspect = inputElement.clientWidth / inputElement.clientHeight;
            camera.cameraObject.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        pickHelper.pick(pickPosition, scene, camera, time);

        renderer.render(scene, camera.cameraObject);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function getCanvasRelativePosition(event) {
        const rect = inputElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / inputElement.clientWidth) * 2 - 1;
        pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;  // note we flip Y
    }

    function clearPickPosition() {
        // unlike the mouse which always has a position
        // if the user stops touching the screen we want
        // to stop picking. For now we just pick a value
        // unlikely to pick something
        pickPosition.x = -100000;
        pickPosition.y = -100000;
    }

    inputElement.addEventListener('mousemove', setPickPosition);
    inputElement.addEventListener('mouseout', clearPickPosition);
    inputElement.addEventListener('mouseleave', clearPickPosition);

    inputElement.addEventListener('touchstart', (event) => {
        // prevent the window from scrolling
        event.preventDefault();
        setPickPosition(event.touches[0]);
    }, { passive: false });

    inputElement.addEventListener('touchmove', (event) => {
        setPickPosition(event.touches[0]);
    });

    inputElement.addEventListener('touchend', clearPickPosition);
}

=======
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Game {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;

    constructor() {
        this._setupRenderer();
        this._setupScene();
        this._setupCamera();
        this._setupControls();
        this._setupEventListeners();
    }

    createHexGridMap(grid: { position: { x: number; z: number } }[][]) {
        const hexGridGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);
        const hexGridMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: false,
        });

        grid.forEach((row: { position: { x: number; z: number } }[]) => {
            row.forEach((hex: { position: { x: number; z: number } }) => {
                if (hex) {
                    const hexMesh = new THREE.Mesh(
                        hexGridGeometry,
                        hexGridMaterial
                    );
                    hexMesh.rotation.y = Math.PI / 2;
                    const zOffsetPointy =
                        hex.position.x % 2 === 0 ? Math.sqrt(3) / 2 : 0;
                    hexMesh.position.set(
                        hex.position.x * 1.5,
                        0,
                        hex.position.z * Math.sqrt(3) + zOffsetPointy
                    );
                    this.scene.add(hexMesh);
                }
            });
        });
    }

    _setupRenderer() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    _setupScene() {
        this.scene = new THREE.Scene();
    }

    _setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        //Camera default position hard coding for future
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
    }

    _setupControls() {
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    _setupEventListeners() {
        this._setupRaycaster();
    }

    _setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        const that = this;

        function onMouseMove(event) {
            that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        function onMouseClick(event) {
            that.raycaster.setFromCamera(that.mouse, that.camera);
            const intersects = that.raycaster.intersectObjects(
                that.scene.children,
                true
            );
            if (intersects.length > 0) {
                const object = intersects[0].object;
                console.log("Clicked on:", intersects[0].object);
                that.scene.remove(object);
            }
        }

        window.addEventListener("mousemove", onMouseMove, false);
        window.addEventListener("click", onMouseClick, false);
    }
}
