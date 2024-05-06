import * as THREE from "three";
import io from "socket.io-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const socket = io("http://localhost:3000");

socket.on("mapData", function (grid) {
    console.log("Received map data", grid);
    createHexGrid(grid);
});

function createHexGrid(grid) {

    const geometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
    });

    grid.forEach((row) => {
        row.forEach((hex) => {
            if (hex) {
                const hexMesh = new THREE.Mesh(geometry, material);
                hexMesh.rotation.x = Math.PI / 2;
                hexMesh.position.set(
                    hex.x * 1.5 + (hex.z % 2) * 0.75,
                    0,
                    hex.z * Math.sqrt(21)
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

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
