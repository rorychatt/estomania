import * as THREE from "three";
import io from "socket.io-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const socket = io("http://localhost:3000");

socket.on("mapData", function (grid) {
    console.log("Received map data", grid);
    createHexGridMap(grid);
});

function createHexGridMap(grid: { position: { x: number; z: number } }[][]) {
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
                scene.add(hexMesh);
            }
        });
    });
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 50, 100); // Position the camera above the map
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log("Clicked on:", intersects[0].object);
        scene.remove(object);
    }
}

window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("click", onMouseClick, false);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
