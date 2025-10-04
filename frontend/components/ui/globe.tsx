"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import getStarfield from "../../utils/getStarfield";
import { latLongToVector3 } from "../../utils/coordinates";

interface Location {
  lat: number;
  long: number;
  label?: string;
  color?: string;
}

interface EarthSceneProps {
  markers?: Location[];
  currentSection?: number;
}

export default function EarthScene({ markers = [], currentSection = 0 }: EarthSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetPosition = useRef(new THREE.Vector3(7, 0, 4));
  const targetLookAt = useRef(new THREE.Vector3(-7.7, 0, 0));

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(7, 0, 4); // Position camera to view globe
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    const orbitCtrl = new OrbitControls(camera, renderer.domElement);
    orbitCtrl.enableDamping = true;
    orbitCtrl.target.set(-7.7, 0, 0);

    orbitCtrl.enableZoom = false; // Disable zooming
    orbitCtrl.minDistance = 4; // Set minimum distance
    orbitCtrl.maxDistance = 4; // Set maximum distance to same as minimum to prevent zoom

    const raycaster = new THREE.Raycaster();
    const pointerPos = new THREE.Vector2();
    const globeUV = new THREE.Vector2();

    // Store reference to emoji for mouse following
    let emojiModel: THREE.Group | null = null;
    let emojiHead: THREE.Object3D | null = null;

    // Mouse tracking variables for proper raycasting (like the working example)
    const intersectionPoint = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    const plane = new THREE.Plane();
    const mousePosition = new THREE.Vector2();
    const headRaycaster = new THREE.Raycaster();

    const textureLoader = new THREE.TextureLoader();
    const starSprite = textureLoader.load("/circle.png");
    const otherMap = textureLoader.load("/04_rainbow1k.jpg");
    const colorMap = textureLoader.load("/00_earthmap1k.jpg");
    const elevMap = textureLoader.load("/01_earthbump1k.jpg");
    const alphaMap = textureLoader.load("/02_earthspec1k.jpg");

    const globeGroup = new THREE.Group();
    globeGroup.position.x = -6;
    globeGroup.position.y = 0;
    globeGroup.position.z = -0.5;
    scene.add(globeGroup);

    const geo = new THREE.IcosahedronGeometry(1, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      wireframe: true,
      displacementMap: elevMap,
      displacementScale: 0.05,
      transparent: true,
      opacity: 0.8, // Increased from 0.4 to make it more visible
      metalness: 0.3,
      roughness: 0.7,
    });
    const globe = new THREE.Mesh(geo, mat);
    globeGroup.add(globe);

    console.log('Globe created and added to globeGroup at position:', globeGroup.position);

    // Load and add emoji 3D model in the center of the sphere
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/rainbolt.glb', // Your GLB file
      (gltf) => {
        console.log('GLB model loaded successfully:', gltf);
        emojiModel = gltf.scene; // Store reference globally

        // Position the emoji at the WORLD center, same as globe center
        // Globe is at globeGroup position (-6, 0, -0.5), so put emoji there too
        emojiModel.position.set(-6, 0, -0.5);

        // Make it MUCH bigger so we can definitely see it
        emojiModel.scale.set(0.8, 0.8, 0.8);

        // Set initial rotation to face the right direction
        emojiModel.rotation.x = Math.PI * 0; // Tilt forward slightly (18 degrees)
        emojiModel.rotation.y = Math.PI * 0.25; // Rotate 45 degrees horizontally
        emojiModel.rotation.z = Math.PI * 0; // No roll

        // Enable rotation animation

        // Preserve original Blender materials - don't override them
        emojiModel.traverse((child) => {
          console.log('Traversing child:', child.name, child.type);
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh child:', child.name, child);
            if (child.material) {
              // Keep original material properties from Blender
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.castShadow = true;
              child.receiveShadow = true;
              // DON'T override color or emissive - keep Blender materials!
            }
          }

          // Try to find head bone/object for mouse following
          if (child.name.toLowerCase().includes('head') ||
            child.name.toLowerCase().includes('face') ||
            child.name.toLowerCase().includes('skull')) {
            console.log('Found potential head object:', child.name);
            emojiHead = child;
          }
        });

        // If no specific head found, use the whole model
        if (!emojiHead) {
          console.log('No specific head found, using whole model');
          emojiHead = emojiModel;
        } else {
          console.log('Using head object:', emojiHead);
        }

        // Add bright point lights specifically for the emoji
        const emojiLight = new THREE.PointLight(0xffffff, 1, 100); // Increased intensity and range
        emojiLight.position.copy(emojiModel.position);
        emojiLight.position.y += 1; // Move light slightly above emoji
        scene.add(emojiLight);

        // Add a second fill light from the front
        const emojiFillLight = new THREE.PointLight(0xffffff, 15, 100);
        emojiFillLight.position.set(
          emojiModel.position.x + 2, // In front of emoji
          emojiModel.position.y,
          emojiModel.position.z + 2
        );
        scene.add(emojiFillLight);

        console.log('Adding emoji model to SCENE at position:', emojiModel.position);
        console.log('GlobeGroup position:', globeGroup.position);
        console.log('Emoji model scale:', emojiModel.scale);
        scene.add(emojiModel); // Add to scene, NOT globeGroup
      },
      (progress) => {
        console.log('Loading progress:', progress);
      },
      (error) => {
        console.error('Error loading GLB model:', error);
      }
    );

    // Add markers
    const markerGroup = new THREE.Group();
    markers.forEach((marker) => {
      const [x, y, z] = latLongToVector3(marker.lat, marker.long, 1.02); // Slightly larger radius to place markers above surface

      const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: marker.color || '#ff0000',
        transparent: true,
        opacity: 0.8,
      });

      const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
      markerMesh.position.set(x, y, z);

      // Add glow effect to marker
      const markerGlowGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const markerGlowMaterial = new THREE.MeshBasicMaterial({
        color: marker.color || '#ff0000',
        transparent: true,
        opacity: 0.3,
      });
      const markerGlow = new THREE.Mesh(markerGlowGeometry, markerGlowMaterial);
      markerMesh.add(markerGlow);

      markerGroup.add(markerMesh);
    });
    globeGroup.add(markerGroup);

    // Add glow effect
    const glowVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const glowFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      
      void main() {
        float alignment = dot(vNormal, vPositionNormal);
// Flip it so edges are bright, center is dim
float intensity = 1.0 - smoothstep(0.0, 1.0, 1.0-abs(alignment));
intensity = pow(intensity, 3.0); // tweak exponent for softness/hardness
        
        vec3 glowColor = vec3(1.0, 0.1, 0.1);
        vec3 glow = glowColor * intensity * 1.0;
        
        gl_FragColor = vec4(glow, intensity * 0.5);
      }
    `;

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false // Ensure proper transparency
    });

    const glowMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.08, 32), // Reduced size to be closer to globe
      glowMaterial
    );
    globeGroup.add(glowMesh);

    // Create a second layer for interactive points
    const detail = 120;
    const pointsGeo = new THREE.IcosahedronGeometry(1.01, detail); // Slightly larger radius to avoid z-fighting

    // Shaders
    const vertexShader = `
  uniform float size;
  uniform sampler2D elevTexture;
  uniform vec2 mouseUV;

  varying vec2 vUv;
  varying float vVisible;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    float elv = texture2D(elevTexture, vUv).r;
    vec3 vNormal = normalMatrix * normal;
    vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
    mvPosition.z += 0.35 * elv;

    float dist = distance(mouseUV, vUv);
    float zDisp = 0.0;
    float thresh = 0.03;
    if (dist < thresh) {
      zDisp = (thresh - dist) * 4.0;
    }
    vDist = dist;
    mvPosition.z += zDisp;

    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
    const fragmentShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D alphaTexture;
  uniform sampler2D otherTexture;
  uniform sampler2D newTexture;


  varying vec2 vUv;
  varying float vVisible;
  varying float vDist;

  void main() {
    if (floor(vVisible + 0.1) == 0.0) discard;
    float alpha = (1.0 - texture2D(alphaTexture, vUv).r) * 0.6;
    vec3 color = texture2D(otherTexture, vUv).rgb;
    vec3 other = texture2D(colorTexture, vUv).rgb;
    float thresh = 0.03;
    if (vDist < thresh) {
      color = mix(color, other, (thresh - vDist) * 30.0);
    }
    gl_FragColor = vec4(color, alpha);
  }
`;

    const uniforms = {
      size: { type: "f", value: 8.0 },
      colorTexture: { type: "t", value: colorMap },
      otherTexture: { type: "t", value: otherMap },
      elevTexture: { type: "t", value: elevMap },
      alphaTexture: { type: "t", value: alphaMap },
      mouseUV: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
    };

    const pointsMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const points = new THREE.Points(pointsGeo, pointsMat);
    globeGroup.add(points);

    // Enhanced lighting setup for better visibility
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 4);
    globeGroup.add(hemiLight);

    // Add a directional light to simulate sunlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 3, 5);
    globeGroup.add(directionalLight);

    // Add ambient light for overall brightness
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    globeGroup.add(ambientLight);

    // Add a point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(2, 2, 2);
    globeGroup.add(pointLight);

    const stars = getStarfield({ numStars: 4500, sprite: starSprite });
    scene.add(stars); // Stars stay in main scene

    function handleRaycast() {
      raycaster.setFromCamera(pointerPos, camera);
      const intersects = raycaster.intersectObjects([globe], false);
      if (intersects.length > 0 && intersects[0].uv) {
        globeUV.copy(intersects[0].uv);
        uniforms.mouseUV.value.copy(globeUV);
      }
    }

    function animate() {
      // Smooth camera movement
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetPosition.current, 0.05);

        // Smooth camera look-at
        const currentLookAt = new THREE.Vector3();
        cameraRef.current.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(cameraRef.current.position.length());
        currentLookAt.add(cameraRef.current.position);
        currentLookAt.lerp(targetLookAt.current, 0.05);

        orbitCtrl.target.copy(targetLookAt.current);
      }

      renderer.render(scene, camera);
      globeGroup.rotation.y += 0.001;

      handleRaycast();
      orbitCtrl.update();

      requestAnimationFrame(animate);
    }
    animate();

    function onMouseMove(evt: MouseEvent) {
      pointerPos.set(
        (evt.clientX / window.innerWidth) * 2 - 1,
        -(evt.clientY / window.innerHeight) * 2 + 1
      );

      // Use Euler angles with specific rotation order for better control
      if (emojiModel) {
        // Convert mouse to normalized device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

        console.log('Mouse:', mouse.x, mouse.y);

        // Create Euler angles with YXZ order (yaw, pitch, roll)
        const rotationSensitivity = 0.8;
        const baseRotationX = Math.PI * 0.05; // Even less tilt - make emoji look more upward
        const baseRotationY = Math.PI * 0.25; // Base side turn

        // Calculate target rotations - REVERSED movements
        const targetX = baseRotationX - mouse.y * rotationSensitivity; // Pitch (up/down) - REVERSED
        const targetY = baseRotationY + mouse.x * rotationSensitivity; // Yaw (left/right) - REVERSED
        const targetZ = 0; // Roll

        // Set rotation using Euler angles with specific order
        emojiModel.rotation.set(targetX, targetY, targetZ, 'YXZ');

        console.log('Emoji Euler rotation set to:', targetX, targetY, targetZ);
        console.log('Actual rotation:', emojiModel.rotation.x, emojiModel.rotation.y, emojiModel.rotation.z);
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update camera position when section changes
  useEffect(() => {
    // Define camera positions for each section
    const positions: Record<number, { position: [number, number, number]; lookAt: [number, number, number] }> = {
      0: { position: [7, 0, 4], lookAt: [-7.7, 0, 0] },        // Hero - default view
      1: { position: [8, 0, -8], lookAt: [-7.7, 0, 0] },          // Features - right angle
      2: { position: [-10, 0, 0], lookAt: [-7.7, 0, 0] },         // About - left angle
      3: { position: [8, 0, -2], lookAt: [-7.7, 0, 0] },         // Team - bottom angle
      4: { position: [8, 0, -8], lookAt: [-7.7, 0, 0] },          // Contact - top view
    };

    const config = positions[currentSection] || positions[0];
    targetPosition.current.set(...config.position);
    targetLookAt.current.set(...config.lookAt);
  }, [currentSection]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} className="absolute inset-0" />;
}
