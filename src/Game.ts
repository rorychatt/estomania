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
