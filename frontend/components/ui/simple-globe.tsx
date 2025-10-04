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
  targetMarkerIndex?: number; // Index of marker to center on
  isLocked?: boolean; // Whether globe is locked to marker or free to rotate
  onUnlock?: () => void; // Callback when user clicks globe to unlock
  onLock?: () => void; // Callback when user clicks marker to lock
  onMarkerClick?: (index: number) => void; // Callback when marker is clicked
}

export default function SimpleGlobe({ markers = [], targetMarkerIndex = 0, isLocked = true, onUnlock, onLock, onMarkerClick }: SimpleGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{
    targetRotationY: number;
    targetRotationX: number;
    isAnimating: boolean;
  }>({ targetRotationY: 0, targetRotationX: 0, isAnimating: false });
  
  // Store refs to avoid recreating Three.js scene
  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    globeYRotationGroup: THREE.Group | null;
    globeXRotationGroup: THREE.Group | null;
    markerGroup: THREE.Group | null;
    markerMeshes: THREE.Mesh[];
  }>({ scene: null, camera: null, renderer: null, globeYRotationGroup: null, globeXRotationGroup: null, markerGroup: null, markerMeshes: [] });

  // Effect for handling target marker changes without recreating scene
  useEffect(() => {
    if (!isLocked || !sceneRef.current.globeYRotationGroup) return;
    
    function rotateToMarker(markerIndex: number) {
      if (markerIndex < 0 || markerIndex >= markers.length) return;
      
      const marker = markers[markerIndex];
      
      // Convert lat/long to rotation angles with 80 degree Y offset
      const offsetDegrees = 80;
      const targetY = -(marker.long * Math.PI / 180) + (offsetDegrees * Math.PI / 180);
      const targetX = (marker.lat * Math.PI / 180);
      
      animationRef.current.targetRotationY = targetY;
      animationRef.current.targetRotationX = targetX;
      animationRef.current.isAnimating = true;
    }

    if (markers.length > 0 && targetMarkerIndex >= 0 && targetMarkerIndex < markers.length) {
      rotateToMarker(targetMarkerIndex);
    }
  }, [targetMarkerIndex, isLocked, markers.length]); // Only depend on index and length, not the array itself

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4.5); // Position camera to center the globe

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    mountRef.current.appendChild(renderer.domElement);

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

    // Create separate groups for horizontal and vertical rotation
    const globeYRotationGroup = new THREE.Group(); // Horizontal rotation (always around world Y-axis)
    const globeXRotationGroup = new THREE.Group(); // Vertical tilt (child of Y rotation)
    
    globeYRotationGroup.position.set(0, 0, 0);
    scene.add(globeYRotationGroup);
    globeYRotationGroup.add(globeXRotationGroup);
    
    camera.lookAt(1.5, 0, 0);

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
    globeXRotationGroup.add(globe);

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
    globeXRotationGroup.add(points);

    // Create marker group (will be populated dynamically)
    const markerGroup = new THREE.Group();
    globeXRotationGroup.add(markerGroup);
    
    // Store refs for use in other effects (after markerGroup is created)
    sceneRef.current = { scene, camera, renderer, globeYRotationGroup, globeXRotationGroup, markerGroup, markerMeshes: [] };
    
    let hoveredMarker: THREE.Mesh | null = null;

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
      
      // Check for marker hover
      if (sceneRef.current.markerMeshes.length > 0) {
        const markerIntersects = raycaster.intersectObjects(sceneRef.current.markerMeshes, false);
        
        // Reset previous hovered marker
        if (hoveredMarker && (!markerIntersects.length || markerIntersects[0].object !== hoveredMarker)) {
          hoveredMarker.scale.setScalar(1);
          hoveredMarker = null;
          if (mountRef.current) {
            mountRef.current.style.cursor = 'grab';
          }
        }
        
        // Set new hovered marker
        if (markerIntersects.length > 0) {
          const newHover = markerIntersects[0].object as THREE.Mesh;
          if (newHover !== hoveredMarker) {
            hoveredMarker = newHover;
            hoveredMarker.scale.setScalar(1.5);
            if (mountRef.current) {
              mountRef.current.style.cursor = 'pointer';
            }
          }
        }
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
      
      // Handle smooth rotation animation to target (only when locked)
      if (isLocked && animationRef.current.isAnimating && !isDragging) {
        const lerpFactor = 0.05; // Smoothness of animation (lower = smoother but slower)
        
        // Smoothly interpolate towards target rotation
        const deltaY = animationRef.current.targetRotationY - globeYRotationGroup.rotation.y;
        const deltaX = animationRef.current.targetRotationX - globeYRotationGroup.rotation.x;
        
        globeYRotationGroup.rotation.y += deltaY * lerpFactor;
        globeYRotationGroup.rotation.x += deltaX * lerpFactor;
        
        // Stop animating when close enough
        if (Math.abs(deltaY) < 0.001 && Math.abs(deltaX) < 0.001) {
          animationRef.current.isAnimating = false;
        }
      } else if (!isLocked && !isDragging && !animationRef.current.isAnimating) {
        // Passive rotation of globe (only when unlocked, not dragging, and not animating)
        globeYRotationGroup.rotation.y += 0.001;
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

        // Horizontal rotation - always around world Y-axis
        globeYRotationGroup.rotation.y += deltaX * rotationSpeed;
        globeYRotationGroup.rotation.x += deltaY * rotationSpeed;

        previousMousePosition = { x: evt.clientX, y: evt.clientY };
      }
    }

    function onMouseDown(evt: MouseEvent) {
      // Check if clicking on a marker
      if (hoveredMarker) {
        const markerData = hoveredMarker.userData.markerData;
        const markerIndex = hoveredMarker.userData.markerIndex;
        console.log('Marker clicked:', markerData);
        
        // Lock to this marker and notify parent
        if (onLock) {
          onLock();
        }
        if (onMarkerClick) {
          onMarkerClick(markerIndex);
        }
        
        return; // Don't start dragging if clicking a marker
      }
      
      // If clicking on globe (not marker) and currently locked, unlock it
      if (isLocked && onUnlock) {
        onUnlock();
      }
      
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

    // Set initial cursor
    if (mountRef.current) {
      mountRef.current.style.cursor = 'grab';
    }
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onResize);

    // Initial rotation to first marker if locked
    if (isLocked && markers.length > 0 && targetMarkerIndex >= 0 && targetMarkerIndex < markers.length) {
      const marker = markers[targetMarkerIndex];
      const offsetDegrees = 80;
      const targetY = -(marker.long * Math.PI / 180) + (offsetDegrees * Math.PI / 180);
      const targetX = (marker.lat * Math.PI / 180);
      
      animationRef.current.targetRotationY = targetY;
      animationRef.current.targetRotationX = targetX;
      animationRef.current.isAnimating = true;
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      
      const mount = mountRef.current;
      if (mount && mount.contains(renderer.domElement)) {
        mount.style.cursor = 'default';
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      // Clear refs
      sceneRef.current = { scene: null, camera: null, renderer: null, globeYRotationGroup: null, globeXRotationGroup: null, markerGroup: null, markerMeshes: [] };
    };
  }, []); // Only create scene once on mount

  // Effect to update markers when they change
  useEffect(() => {
    if (!sceneRef.current.markerGroup) return;

    const markerGroup = sceneRef.current.markerGroup;
    
    // Clear existing markers
    while (markerGroup.children.length > 0) {
      const child = markerGroup.children[0];
      markerGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    sceneRef.current.markerMeshes = [];

    // Add new markers
    if (markers.length > 0) {
      const markerGeometry = new THREE.SphereGeometry(0.02, 6, 6);
      
      markers.forEach((marker, index) => {
        const [x, y, z] = latLongToVector3(marker.lat, marker.long, 1.02);
        
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: marker.color || '#ff0000',
          transparent: true,
          opacity: 0.8,
        });
        
        const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
        markerMesh.position.set(x, y, z);
        markerMesh.userData = { markerIndex: index, markerData: marker, originalScale: 1 };

        markerGroup.add(markerMesh);
        sceneRef.current.markerMeshes.push(markerMesh);
      });
    }
  }, [markers]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} className="absolute inset-0" />;
}