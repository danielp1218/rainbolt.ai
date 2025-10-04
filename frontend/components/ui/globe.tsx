"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
}

export default function EarthScene({ markers = [] }: EarthSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(7, 0, 4); // Position camera to view globe
    

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
      opacity: 0.7,
      metalness: 0.3,
      roughness: 0.7,
    });
    const globe = new THREE.Mesh(geo, mat);
    globeGroup.add(globe);

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
intensity = pow(intensity, 2.0); // tweak exponent for softness/hardness
        
        vec3 glowColor = vec3(0.1, 0.4, 1.0);
        vec3 glow = glowColor * intensity * 2.0;
        
        gl_FragColor = vec4(glow, intensity);
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

  varying vec2 vUv;
  varying float vVisible;
  varying float vDist;

  void main() {
    if (floor(vVisible + 0.1) == 0.0) discard;
    float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
    vec3 color = texture2D(otherTexture, vUv).rgb;
    vec3 other = texture2D(colorTexture, vUv).rgb;
    float thresh = 0.03;
    if (vDist < thresh) {
      color = mix(color, other, (thresh - vDist) * 50.0);
    }
    gl_FragColor = vec4(color, alpha);
  }
`;

    const uniforms = {
      size: { type: "f", value: 4.0 },
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

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
    globeGroup.add(hemiLight); // Add light to globe group instead of scene

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
      renderer.render(scene, camera);
      globeGroup.rotation.y += 0.002;
      handleRaycast();
      orbitCtrl.update();
      
      // Update aurora time
      
      requestAnimationFrame(animate);
    }
    animate();

  function onMouseMove(evt: MouseEvent) {
      pointerPos.set(
        (evt.clientX / window.innerWidth) * 2 - 1,
        -(evt.clientY / window.innerHeight) * 2 + 1
      );
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

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} className="absolute inset-0" />;
}
