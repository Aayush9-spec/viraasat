'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Environment, MeshTransmissionMaterial, PresentationControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

export function Viraasat3DHero() {
    return (
        <div className="w-full h-[500px] md:h-[600px] relative z-10 flex items-center justify-center">
            <Canvas camera={{ position: [0, 0, 12], fov: 35 }}>
                <HeroScene />
            </Canvas>
        </div>
    );
}

function HeroScene() {
    const { theme } = useTheme();
    // Dynamic color based on theme - default to gold/amber
    const primaryColor = theme === 'dark' ? '#fbbf24' : '#d97706';
    const secondaryColor = theme === 'dark' ? '#f59e0b' : '#b45309';
    const accentColor = theme === 'dark' ? '#10b981' : '#059669'; // Emerald accent

    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color={primaryColor} />

            <Environment preset="city" />

            <PresentationControls
                global
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 4, Math.PI / 4]}
                azimuth={[-Math.PI / 4, Math.PI / 4]}
                config={{ mass: 2, tension: 400 }}
                snap={{ mass: 4, tension: 400 }}
            >
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                    <group>
                        {/* Central Heritage Core */}
                        <HeritageCore primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />
                    </group>
                </Float>
            </PresentationControls>

            <Sparkles
                count={100}
                scale={12}
                size={3}
                speed={0.4}
                opacity={0.5}
                color={secondaryColor}
                noise={0.1}
            />
        </>
    );
}

function HeritageCore({ primaryColor, secondaryColor, accentColor }: { primaryColor: string, secondaryColor: string, accentColor: string }) {
    const coreRef = useRef<THREE.Group>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const ring3Ref = useRef<THREE.Mesh>(null);
    const gemRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = Math.sin(t * 0.2) * 0.5;
            ring1Ref.current.rotation.y = t * 0.3;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.x = t * 0.2;
            ring2Ref.current.rotation.z = Math.cos(t * 0.3) * 0.5;
        }
        if (ring3Ref.current) {
            ring3Ref.current.rotation.y = -t * 0.1;
            ring3Ref.current.rotation.z = Math.sin(t * 0.2) * 0.2;
        }
        if (gemRef.current) {
            gemRef.current.rotation.y = t * 0.5;
            gemRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
            gemRef.current.position.y = Math.sin(t) * 0.1;
        }
    });

    return (
        <group ref={coreRef}>
            {/* Inner Gem - The "Soul" of Heritage */}
            <mesh ref={gemRef} scale={0.8}>
                <octahedronGeometry args={[1, 0]} />
                <MeshTransmissionMaterial
                    background={new THREE.Color(primaryColor)}
                    backside
                    backsideThickness={1}
                    samples={10}
                    thickness={3}
                    chromaticAberration={0.1}
                    anisotropy={0.3}
                    distortion={0.4}
                    distortionScale={0.3}
                    temporalDistortion={0.5}
                    clearcoat={1}
                    attenuationDistance={0.5}
                    attenuationColor={primaryColor}
                    color="#ffffff"
                />
            </mesh>

            {/* Inner Golden Ring */}
            <mesh ref={ring1Ref}>
                <torusGeometry args={[1.8, 0.08, 16, 100]} />
                <meshPhysicalMaterial
                    color={primaryColor}
                    metalness={1}
                    roughness={0.1}
                    emissive={primaryColor}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Middle Intricate Ring */}
            <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.4, 0.04, 16, 100]} />
                <meshStandardMaterial color={secondaryColor} metalness={0.8} roughness={0.2} wireframe />
            </mesh>

            {/* Outer Protective Ring */}
            <mesh ref={ring3Ref}>
                <torusGeometry args={[3.2, 0.02, 16, 100]} />
                <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.2} transparent opacity={0.5} />
            </mesh>

            {/* Floating Particles/Orbs within the core */}
            <mesh position={[2, 1, 0]} scale={0.2}>
                <sphereGeometry />
                <meshStandardMaterial color={primaryColor} metalness={1} roughness={0} />
            </mesh>
            <mesh position={[-2, -1, 0.5]} scale={0.15}>
                <sphereGeometry />
                <meshStandardMaterial color={secondaryColor} metalness={1} roughness={0} />
            </mesh>
            <mesh position={[0, 2.5, -0.5]} scale={0.1}>
                <sphereGeometry />
                <meshStandardMaterial color={accentColor} metalness={1} roughness={0} />
            </mesh>
        </group>
    );
}
