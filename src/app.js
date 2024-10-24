/**
 * TODO:
 * Custom shader which exaggerates depth (possibly spatially accurate sun - maybe minimap in bottom left showing where planet is)
 * Background & possibly a glow around perimeter of planet
 * Look into warping at poles
 * Survey performance metrics
 * UI with variable and detail level controls - rotation speed, light intensity, 
 * Possible rover easter egg
 */

import * as THREE from '../libs/three.module.js';
import { OrbitControls } from '../libs/OrbitControls.js';
import { getFresnelMat } from '/src/getFresnelMat.js';

// need a bundler to import jpg. Use would be to allow await load for loading bar
//import earthmap from "./textures/earthmap.jpg";

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Create a camera, in this case, a perspective camera so distant objects appear further - look at 'frustrum'
        // P1: FOV (degrees), P2: Aspect ratio (we use whole window so divide those two dimensions)
        // P3: Near value; objects nearer will be cut off, P4: Far value; objects will be cut off
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200);
        // Set position that frustrum extends from. Recall that WebGL has EUS perspective; X points east, Y points up, Z points south.
        this.camera.position.set(0, 0, 30);

        // Create scene, background will be white
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaaaaaa);

        // Add directional light that points from it's position to a target (origin by default)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

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
        this.group.rotation.z = 25.2 / 360 * 2 * Math.PI;

        // Might remove if no way to implement loading bar with TextureLoader
        const loader = new THREE.TextureLoader();
        // Topo map was horizontally translated to correct the longitude. Otherwise, the custom geometry won't align with texture
        loader.load('./textures/mars_topo4k.jpg', (topoMap) => {
            loader.load('./textures/mars_color4k.jpg', (colorMap) => {
                loader.load('./textures/mars_bump4k.jpg', (bumpMap) => {
                    topoMap.minFilter = THREE.LinearFilter; // Smooth sampling
                    colorMap.minFilter = THREE.LinearFilter;
                    bumpMap.minFilter = THREE.LinearFilter;

                    const resolution = 256;
                    const radius = 10;
                    const displacementMultiplier = 0.04;
                    const bumpScale = 0.2;
                    this.createPlanetGeometry(topoMap, colorMap, bumpMap, resolution, radius, displacementMultiplier, bumpScale);
                })
            })
        })

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
        this.group.rotateY(0.001);
        this.renderer.render(this.scene, this.camera);
    }

    createPlanetGeometry(topoMap, colorMap, bumpMap, resolution, radius, displacementMultiplier, bumpScale) {
        const geometry = new THREE.SphereBufferGeometry(radius, resolution, resolution);

        // Draw the topo map on a temporary canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = topoMap.image.width;
        canvas.height = topoMap.image.height;
        ctx.drawImage(topoMap.image, 0, 0);

        // Read the canvas pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Extract vertices from the sphere geometry
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Displace each vertex based on the topo map
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);

            // Normalize and convert to longitude and latitude
            const normalizedVertex = vertex.clone().normalize();
            const sphereCoords = this.pointToCoordinate(normalizedVertex);

            // Map longitude/latitude to UV coords (clamped from 0 to 1)
            const adjustedLongitude = sphereCoords.longitude;
            const u = (adjustedLongitude / (2 * Math.PI)) + 0.5;
            const v = 0.5 - (sphereCoords.latitude / Math.PI);

            // Get the corresponding pixel from the topo map
            const x = Math.floor(u * (canvas.width - 1));
            const y = Math.floor(v * (canvas.height - 1));
            const index = (y * canvas.width + x) * 4; // * 4 because pixel data is RGBA with 4 values per pixel
            const heightValue = pixels[index] / 255; // Extract the height value

            // Finally, displace the vertex with a multiplier variable
            const displacedRadius = radius * (1 + heightValue * displacementMultiplier);
            const displacedPoint = this.coordinateToPoint(sphereCoords, displacedRadius);

            // Update vertex position
            positionAttribute.setXYZ(i, displacedPoint.x, displacedPoint.y, displacedPoint.z);
        }

        // Tells Three that the vertex positions have been updated
        positionAttribute.needsUpdate = true;
        // Recompute vertex normals for lighting
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: bumpScale,
            wireframe: false
        });

        const earthMesh = new THREE.Mesh(geometry, material);
        this.group.add(earthMesh);

        // Add Fresnel glow
        const fresnelMat = getFresnelMat({
            rimHex: 0xff0077, // Pinkish-red glow
            facingHex: 0x000000 // Inner color
        });
        const glowMesh = new THREE.Mesh(geometry, fresnelMat);
        glowMesh.scale.setScalar(1.01);
        this.group.add(glowMesh);
    }

    // Convert a point on the unit sphere to latitude and longitude (in radians), ref: https://github.com/SebLague/Geographical-Adventures
    pointToCoordinate(point) {
        const latitude = Math.asin(point.y);
        const longitude = Math.atan2(point.x, point.z);
        return { latitude, longitude };
    }

    // Convert latitude and longitude back to a 3D point on the sphere
    coordinateToPoint(coordinate, radius) {
        const x = radius * Math.cos(coordinate.latitude) * Math.sin(coordinate.longitude);
        const y = radius * Math.sin(coordinate.latitude);
        const z = radius * Math.cos(coordinate.latitude) * Math.cos(coordinate.longitude);
        return new THREE.Vector3(x, y, z);
    }
}

export { App };