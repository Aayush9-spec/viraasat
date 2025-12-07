'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial, Sphere, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

export function Login3DBackground() {
    return (
        <div className="absolute inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                <SceneContent />
            </Canvas>
        </div>
    );
}

function SceneContent() {
    const { theme } = useTheme();
    const primaryColor = theme === 'dark' ? '#fbbf24' : '#f59e0b';
    const secondaryColor = theme === 'dark' ? '#f59e0b' : '#d97706';
    const accentColor = '#10b981';

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color={primaryColor} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color={secondaryColor} />

            {/* Floating Geometric Shapes */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <DistortedSphere position={[-3, 2, -2]} color={primaryColor} />
            </Float>

            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
                <DistortedSphere position={[3, -1, -3]} color={secondaryColor} scale={0.8} />
            </Float>

            <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
                <DistortedSphere position={[0, 3, -4]} color={accentColor} scale={0.6} />
            </Float>

            {/* Rotating Rings */}
            <RotatingRing position={[2, 1, -5]} color={primaryColor} />
            <RotatingRing position={[-2, -2, -6]} color={secondaryColor} rotation={[Math.PI / 2, 0, 0]} />

            {/* Sparkles for magic effect */}
            <Sparkles
                count={50}
                scale={15}
                size={2}
                speed={0.3}
                opacity={0.3}
                color={primaryColor}
            />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 2}
            />
        </>
    );
}

function DistortedSphere({ position, color, scale = 1 }: { position: [number, number, number], color: string, scale?: number }) {
    return (
        <mesh position={position} scale={scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <MeshDistortMaterial
                color={color}
                attach="material"
                distort={0.4}
                speed={2}
                roughness={0.2}
                metalness={0.8}
                transparent
                opacity={0.6}
            />
        </mesh>
    );
}

function RotatingRing({ position, color, rotation = [0, 0, 0] }: { position: [number, number, number], color: string, rotation?: [number, number, number] }) {
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.01;
            ringRef.current.rotation.x = rotation[0] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <mesh ref={ringRef} position={position} rotation={rotation}>
            <torusGeometry args={[1.5, 0.1, 16, 100]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
        </mesh>
    );
}
