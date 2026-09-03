'use client';

import * as THREE from 'three';
import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image, Environment, ScrollControls, useScroll, useTexture } from '@react-three/drei';
// @ts-ignore
import { easing } from 'maath';
import '../lib/three-utils';
import { products } from '@/lib/data';
import { useRouter } from 'next/navigation';

export const Carousel3D = () => {
    // Only use first 12 products for the carousel
    const carouselProducts = useMemo(() => products.slice(0, 12), []);

    return (
        <div className="h-[500px] w-full relative">
            <Canvas camera={{ position: [0, 0, 100], fov: 15 }}>
                <ScrollControls pages={4} infinite>
                    <Rig rotation={[0, 0, 0.15]}>
                        <Carousel items={carouselProducts} />
                    </Rig>
                </ScrollControls>
                {/* Removed background prop to let the global Background3D show through */}
                <Environment preset="dawn" blur={0.5} />
            </Canvas>
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none text-gray-500 text-sm">
                Scroll to explore &bull; Click to view details
            </div>
        </div>
    );
};

function Rig(props: any) {
    const ref = useRef<THREE.Group>(null);
    const scroll = useScroll();
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y = -scroll.offset * (Math.PI * 2); // Rotate contents
        }
        if (state.events.update) state.events.update(); // Raycasts every frame rather than on pointer-move
        // @ts-ignore
        easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y + 1.5, 10], 0.3, delta); // Move camera
        state.camera.lookAt(0, 0, 0); // Look at center
    });
    return <group ref={ref} {...props} />;
}

function Carousel({ radius = 1.4, items }: { radius?: number, items: typeof products }) {
    const count = items.length;
    return (
        <>
            {items.map((product, i) => (
                <Card
                    key={product.id}
                    product={product}
                    url={product.images[0]}
                    position={[Math.sin((i / count) * Math.PI * 2) * radius, 0, Math.cos((i / count) * Math.PI * 2) * radius]}
                    rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
                />
            ))}
        </>
    );
}

function Card({ url, product, ...props }: { url: string; product: any;[key: string]: any }) {
    const ref = useRef<any>(null);
    const [hovered, hover] = useState(false);
    const router = useRouter();

    const pointerOver = (e: any) => {
        e.stopPropagation();
        hover(true);
        // Change cursor
        document.body.style.cursor = 'pointer';
    };

    const pointerOut = () => {
        hover(false);
        document.body.style.cursor = 'auto';
    };

    const handleClick = () => {
        router.push(`/product/${product.id}`);
    };

    useFrame((state, delta) => {
        if (ref.current) {
            // @ts-ignore
            easing.damp3(ref.current.scale, hovered ? 1.2 : 1, 0.1, delta);
            // @ts-ignore
            easing.damp(ref.current.material, 'radius', hovered ? 0.25 : 0.1, 0.2, delta); // Radius prop might vary depending on Image impl
            // @ts-ignore
            easing.damp(ref.current.material, 'zoom', hovered ? 1 : 1.2, 0.2, delta);
        }
    });

    return (
        // eslint-disable-next-line jsx-a11y/alt-text -- drei <Image> is a 3D mesh, not an <img> element
        <Image
            ref={ref}
            url={url}
            transparent
            side={THREE.DoubleSide}
            onPointerOver={pointerOver}
            onPointerOut={pointerOut}
            onClick={handleClick}
            {...props}
        >
            <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
        </Image>
    );
}
