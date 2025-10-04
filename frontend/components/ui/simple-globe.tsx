"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import getStarfield from "../../utils/getStarfield";
import { latLongToVector3 } from "../../utils/coordinates";

interface Location {
  lat: number;
  long: number;
  label?: string;
  color?: string;
}

interface SimpleGlobeProps {
  markers?: Location[];
}

export default function SimpleGlobe({ markers = [] }: SimpleGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7); // Position camera to center the globe

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Manual rotation variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotationSpeed = 0.005;

    const raycaster = new THREE.Raycaster();
    const pointerPos = new THREE.Vector2();
    const globeUV = new THREE.Vector2();

    const textureLoader = new THREE.TextureLoader();
    const starSprite = textureLoader.load("/circle.png");
    const otherMap = textureLoader.load("/04_rainbow1k.jpg");
    const colorMap = textureLoader.load("/00_earthmap1k.jpg");
    const elevMap = textureLoader.load("/01_earthbump1k.jpg");
    const alphaMap = textureLoader.load("/02_earthspec1k.jpg");

    const globeGroup = new THREE.Group();
    globeGroup.position.x = 0;
    globeGroup.position.y = 0;
    globeGroup.position.z = 0;
    // Set rotation order to keep Y-axis vertical
    globeGroup.rotation.order = 'XYZ';
    scene.add(globeGroup);
    camera.lookAt(2, 0, 0);

    // Simple globe geometry and material - optimized
    const geo = new THREE.IcosahedronGeometry(1, 12); // Reduced from 16 to 12
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      wireframe: true,
      displacementMap: elevMap,
      displacementScale: 0.04, // Reduced slightly
      transparent: true,
      opacity: 0.8,
      metalness: 0.3,
      roughness: 0.7,
    });
    const globe = new THREE.Mesh(geo, mat);
    globeGroup.add(globe);

    // Create interactive points layer - optimized
    const detail = 50; // Reduced from 80 for better performance
    const pointsGeo = new THREE.IcosahedronGeometry(1.01, detail); // Slightly larger radius to avoid z-fighting

    // Shaders for interactive points
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
      size: { type: "f", value: 5.0 }, // Reduced point size for performance
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
      depthTest: true,
      blending: THREE.NormalBlending, // Optimize blending
    });

    const points = new THREE.Points(pointsGeo, pointsMat);
    globeGroup.add(points);

    // Add markers if provided
    if (markers.length > 0) {
      const markerGroup = new THREE.Group();
      // Use shared geometry for all markers for better performance
      const markerGeometry = new THREE.SphereGeometry(0.02, 6, 6); // Further reduced segments for performance
      
      markers.forEach((marker) => {
        const [x, y, z] = latLongToVector3(marker.lat, marker.long, 1.02);
        
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: marker.color || '#ff0000',
          transparent: true,
          opacity: 0.8,
        });
        
        const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
        markerMesh.position.set(x, y, z);

        markerGroup.add(markerMesh);
      });
      globeGroup.add(markerGroup);
    }

    // Basic lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 2);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    // Add stars background
    const stars = getStarfield({ numStars: 1500, sprite: starSprite }); // Reduced for performance
    scene.add(stars);


    let frameCount = 0;
    function handleRaycast() {
      raycaster.setFromCamera(pointerPos, camera);
      // Update world matrix to account for rotations
      globe.updateMatrixWorld(true);
      const intersects = raycaster.intersectObject(globe, false);
      if (intersects.length > 0 && intersects[0].uv) {
        globeUV.copy(intersects[0].uv);
        uniforms.mouseUV.value.copy(globeUV);
      }
    }

    function animate() {
      frameCount++;
      
      // Only run raycast every 3 frames for better performance
      if (frameCount % 3 === 0) {
        handleRaycast();
      }
      
      // Passive rotation of stars
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;
      
      // Passive rotation of globe (only when not dragging)
      if (!isDragging) {
        globeGroup.rotation.y += 0.001;
      }
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    function onMouseMove(evt: MouseEvent) {
      // Get mouse position relative to the canvas
      const rect = renderer.domElement.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      
      pointerPos.set(
        (x / rect.width) * 2 - 1,
        -(y / rect.height) * 2 + 1
      );

      if (isDragging) {
        const deltaX = evt.clientX - previousMousePosition.x;
        const deltaY = evt.clientY - previousMousePosition.y;

        // Allow X (vertical tilt) and Y (horizontal rotation) but lock Z to prevent slanting
        globeGroup.rotation.y += deltaX * rotationSpeed;
        globeGroup.rotation.x += deltaY * rotationSpeed;
        
        // Clamp X rotation to prevent flipping upside down
        const maxRotation = Math.PI / 2.5; // Limit to about 72 degrees
        globeGroup.rotation.x = Math.max(-maxRotation, Math.min(maxRotation, globeGroup.rotation.x));
        
        // Lock Z rotation to 0 to prevent slanting
        globeGroup.rotation.z = 0;

        previousMousePosition = { x: evt.clientX, y: evt.clientY };
      }
    }

    function onMouseDown(evt: MouseEvent) {
      isDragging = true;
      previousMousePosition = { x: evt.clientX, y: evt.clientY };
    }

    function onMouseUp() {
      isDragging = false;
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [markers]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} className="absolute inset-0" />;
}