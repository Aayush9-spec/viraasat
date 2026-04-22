'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial, Sphere, OrbitControls, Environment, Stars } from '@react-three/drei';
import { useRef, memo } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

export const Login3DBackground = memo(function Login3DBackground() {
    return (
        <div className="absolute inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]}>
                <SceneContent />
            </Canvas>
        </div>
    );
});

const SceneContent = memo(function SceneContent() {
    const { theme } = useTheme();
    // Adjusted colors for a more premium look
    const primaryColor = theme === 'dark' ? '#fbbf24' : '#f59e0b'; // Amber
    const secondaryColor = theme === 'dark' ? '#8b5cf6' : '#7c3aed'; // Violet (more contrast)
    const accentColor = '#10b981'; // Emerald

    return (
        <>
            {/* Improved Lighting Environment */}
            <Environment preset="city" />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color={primaryColor} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color={secondaryColor} />

            {/* Background Depth */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Floating Geometric Shapes */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <DistortedSphere position={[-3, 2, -2]} color={primaryColor} speed={2} distort={0.4} />
            </Float>

            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
                <DistortedSphere position={[3, -1, -3]} color={secondaryColor} scale={0.8} speed={3} distort={0.5} />
            </Float>

            <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
                <DistortedSphere position={[0, 3, -4]} color={accentColor} scale={0.6} speed={1.5} distort={0.3} />
            </Float>

            {/* Rotating Rings */}
            <RotatingRing position={[2, 1, -5]} color={primaryColor} />
            <RotatingRing position={[-2, -2, -6]} color={secondaryColor} rotation={[Math.PI / 2, 0, 0]} />

            {/* Sparkles for magic effect */}
            <Sparkles
                count={80}
                scale={12}
                size={3}
                speed={0.4}
                opacity={0.5}
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
});

const DistortedSphere = memo(function DistortedSphere({
    position,
    color,
    scale = 1,
    speed = 2,
    distort = 0.4
}: {
    position: [number, number, number],
    color: string,
    scale?: number,
    speed?: number,
    distort?: number
}) {
    return (
        <mesh position={position} scale={scale}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
                color={color}
                attach="material"
                distort={distort}
                speed={speed}
                roughness={0.1}
                metalness={0.9}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
});

const RotatingRing = memo(function RotatingRing({ position, color, rotation = [0, 0, 0] }: { position: [number, number, number], color: string, rotation?: [number, number, number] }) {
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.005;
            ringRef.current.rotation.x = rotation[0] + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
            ringRef.current.rotation.y += 0.002;
        }
    });

    return (
        <mesh ref={ringRef} position={position} rotation={rotation}>
            <torusGeometry args={[1.5, 0.05, 32, 100]} />
            <meshStandardMaterial
                color={color}
                metalness={1}
                roughness={0.1}
                transparent
                opacity={0.6}
                emissive={color}
                emissiveIntensity={0.2}
            />
        </mesh>
    );
});
