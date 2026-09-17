'use client';

import * as React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const initialCameraPosition: [number, number, number] = [7, 5, 7];
const roomTarget: [number, number, number] = [0, 1, 0];

function RoomGeometry() {
  return (
    <group>
      <mesh receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#d5c7b6" roughness={0.88} />
      </mesh>
      <mesh receiveShadow position={[0, 3, -5]}>
        <boxGeometry args={[10, 6, 0.2]} />
        <meshStandardMaterial color="#e8e0d4" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[-5, 3, 0]}>
        <boxGeometry args={[0.2, 6, 10]} />
        <meshStandardMaterial color="#ddd2c2" roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[2.8, 1, -3.8]}>
        <boxGeometry args={[1.4, 2, 0.35]} />
        <meshStandardMaterial color="#b58c68" roughness={0.75} />
      </mesh>
    </group>
  );
}

function CameraControls({ resetCameraRef }: Readonly<{ resetCameraRef: React.MutableRefObject<() => void> }>) {
  const controlsRef = React.useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const { camera } = useThree();

  React.useEffect(() => {
    resetCameraRef.current = () => {
      camera.position.set(...initialCameraPosition);
      controlsRef.current?.target.set(...roomTarget);
      controlsRef.current?.update();
    };

    return () => {
      resetCameraRef.current = () => undefined;
    };
  }, [camera, resetCameraRef]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      minDistance={3}
      maxDistance={16}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.08}
      target={roomTarget}
    />
  );
}

export function StaticRoomCanvas({
  resetCameraRef,
  onReady,
}: Readonly<{
  resetCameraRef: React.MutableRefObject<() => void>;
  onReady: () => void;
}>) {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 1.5]}
      camera={{ position: initialCameraPosition, fov: 45, near: 0.1, far: 50 }}
      onCreated={onReady}
    >
      <color attach="background" args={['#e8eef3']} />
      <ambientLight intensity={0.8} />
      <directionalLight
        castShadow
        intensity={1.5}
        position={[5, 8, 4]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
      />
      <RoomGeometry />
      <CameraControls resetCameraRef={resetCameraRef} />
    </Canvas>
  );
}
