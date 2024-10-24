// Altered code ref: https://github.com/bobbyroe/threejs-earth

import * as THREE from "../libs/three.module.js";

export default function createStarfield({ numStars = 2000 } = {}) {
  
  // Generate random positions for stars
  function generateRandomStarPosition() {
    const radius = Math.random() * 25 + 100;  // Starfield radius
    const theta = 2 * Math.PI * Math.random();  // Random angle around the sphere
    const phi = Math.acos(2 * Math.random() - 1);  // Random inclination

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  const vertices = [];
  const starColors = [];

  // Generate star positions and their colors
  for (let i = 0; i < numStars; i++) {
    const starPosition = generateRandomStarPosition();

    vertices.push(starPosition.x, starPosition.y, starPosition.z);

    const starColor = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    starColors.push(starColor.r, starColor.g, starColor.b);
  }

  // Create buffer geometry and add the vertex and color info
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,  // Use colors from geometry
    map: new THREE.TextureLoader().load('./textures/star.png'),
    transparent: true,
    alphaTest: 0.5,
    blending: THREE.AdditiveBlending,
  });

  const starfield = new THREE.Points(geometry, starMaterial);
  return starfield;
}
