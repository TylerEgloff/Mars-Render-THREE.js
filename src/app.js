import * as THREE from '../three137/three.module.js';
import { OrbitControls } from '../three137/OrbitControls.js';

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Create a camera, in this case, a perspective camera so distant objects appear further - look at 'frustrum'
        // P1: FOV (degrees), P2: Aspect ratio (we use whole window so divide those two dimensions)
        // P3: Near value; objects nearer will be cut off, P4: Far value; objects will be cut off
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 10, 100);
        // Set position that frustrum extends from. Recall that WebGL has EUS perspective; X points east, Y points up, Z points south.
        this.camera.position.set(0, 0, 50);

        // Create scene, background will be white
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaaaaaa);

        // Add directional light that points from it's position to a target (origin by default)
        const directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(-20, 10, 30);
        this.scene.add(directionalLight);

        // Create renderer, WebGL for games. Antialias prevents jagged edges.
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // Pixel ratio prevents blurring on different devices
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // Set size, using full window dimensions
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Renderer creates a domElement that needs to be added to HTML container to be visible
        container.appendChild(this.renderer.domElement);

        this.group = new THREE.Group();
        this.group.rotation.z - 23.5 / 360 * 2 * Math.PI;

        const sphereGeometry = new THREE.SphereGeometry(10, 64, 64);
        const sphereMaterial = new THREE.MeshStandardMaterial({ 
            color: (0xaa3333),
            
        });

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.group.add(this.sphere);

        this.scene.add(this.group);

        // Adds ability to rotate the scene with mouse or touch event
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true

        // The renderer callsback about 60fps
        // Takes a method, we pass render to draw the scene repeatedly.
        this.renderer.setAnimationLoop(this.render.bind(this));

        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        // On resize, we have to reset the camera aspect ratio and projection matrix
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        // Renderer needs to be resized to window size.
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };