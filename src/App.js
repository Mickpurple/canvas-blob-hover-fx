import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

function App() {
  const IMG_SRC = "/images/cat-job.png";

  const tex = useLoader(THREE.TextureLoader, IMG_SRC);
  const img = useLoader(THREE.ImageLoader, IMG_SRC);

  const PLANE_SIZE = 1.0;

  const vertexShader = `

  
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_multiplier;

    void main() {
      vUv = uv;
      float dist = distance(uv, u_mouse);
      float decay = clamp(dist * 5.0, 1.0, 10.0);

      float ripple = sin(-3.14 * 10. * dist + u_time) * (0.02 / decay);

      vec3 newPosition = vec3(position.x, position.y, ripple * u_multiplier );

      vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
    }

    `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform float u_time;
    uniform vec2 u_resolution;

    uniform vec2 uImageSize;
    uniform vec2 uPlaneSize;
    uniform sampler2D uTexture;

    vec2 getCoverUv (vec2 uv, vec2 resolution, vec2 texResolution) {
      vec2 s = resolution; // Screen
      vec2 i = texResolution; // Image
      float rs = s.x / s.y;
      float ri = i.x / i.y;
      vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
      vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
      vec2 coverUv = uv * s / new + offset;
      return coverUv;
    }

    void main() {

      vec2 uv = vUv;
      vec2 coverUv = getCoverUv(uv, uPlaneSize, uImageSize);
    
      vec4 texture = texture2D(uTexture, uv); // coverUv was not working
      vec4 color = texture;

      gl_FragColor = vec4(color);
    }

    `;
  const [temp_uv, setTempUv] = useState([-0.5, -0.5]);

  const Page = () => {
    // const state = useThree();

    // This reference will give us direct access to the mesh
    const mesh = useRef();

    const [uvu, setUv] = useState([-0.5, -0.5]);

    const uniforms = useMemo(
      () => ({
        u_time: {
          type: "f",
          value: 0.0,
        },
        uTexture: { value: tex },
        uPlaneSize: { value: new THREE.Vector2(PLANE_SIZE, PLANE_SIZE) },
        uImageSize: { value: new THREE.Vector2(img.width, img.height) },
        u_mouse: { type: "vec2", value: new THREE.Vector2() },
        u_multiplier: { value: 0.0 },
      }),
      []
    );

    const multiplier_tween = gsap.timeline();

    multiplier_tween.to(uniforms.u_multiplier, {
      value: 1,
      duration: 0.1,
    });

    multiplier_tween.to(uniforms.u_multiplier, {
      value: 0,
      duration: 0.2,
    });

    useFrame((state) => {
      const { clock } = state;

      uniforms.u_time.value = clock.getElapsedTime();

      uniforms.u_mouse.value = uvu;
    });

    var test = [];

    return (
      <mesh
        ref={mesh}
        position={[0, 0, 0]}
        scale={1}
        onPointerMove={({ uv }) => {
          test = uv;
        }}
        onPointerEnter={({ uv }) => {
          setUv(uv);
          // if (!multiplier_tween.isActive()) {
          multiplier_tween.play();
          // }
        }}
        onPointerLeave={({ uv }) => {
          console.log("thiss");
          setUv(test);
          // if (!multiplier_tween.isActive()) {
          multiplier_tween.play();
          // }
        }}
      >
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE, 32, 32]} />
        <shaderMaterial
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
          uniforms={uniforms}
          // wireframe={true}
        />
      </mesh>
    );
  };

  return (
    <div className="mainDiv">
      <Canvas camera={{ position: [0.0, 0.0, 1.0], zoom: 1 }}>
        <Page />
      </Canvas>
    </div>
  );
}

export default App;
