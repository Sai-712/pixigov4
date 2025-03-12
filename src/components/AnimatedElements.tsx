import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { OrbitControls, Float, Text3D } from '@react-three/drei';
import { colors, transforms, shadows } from '../config/theme';

interface AnimatedBoxProps {
  position: [number, number, number];
  color?: string;
  scale?: number;
  rotation?: [number, number, number];
}

const AnimatedBox: React.FC<AnimatedBoxProps> = ({
  position,
  color = colors.turquoise,
  scale = 1,
  rotation = [0, 0, 0]
}) => {
  const [hovered, setHovered] = React.useState(false);
  
  const { scaleAnim } = useSpring({
    scaleAnim: hovered ? [scale * 1.2, scale * 1.2, scale * 1.2] : [scale, scale, scale],
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    <animated.mesh
      position={position}
      rotation={rotation}
      scale={scaleAnim}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </animated.mesh>
  );
};

export const FloatingElement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Float
      speed={2}
      rotationIntensity={1}
      floatIntensity={2}
      floatingRange={[-0.1, 0.1]}
    >
      {children}
    </Float>
  );
};

export const AnimatedScene: React.FC<{
  width?: string;
  height?: string;
  children: React.ReactNode;
}> = ({ width = '100%', height = '400px', children }) => {
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: colors.champagne }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls enableZoom={false} />
        {children}
      </Canvas>
    </div>
  );
};

export const AnimatedText: React.FC<{
  text: string;
  position?: [number, number, number];
  color?: string;
  size?: number;
}> = ({
  text,
  position = [0, 0, 0],
  color = colors.turquoise,
  size = 0.5
}) => {
  const [fontError, setFontError] = React.useState(false);

  if (fontError) {
    return (
      <FloatingElement>
        <Text3D
          font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
          size={size}
          height={0.2}
          position={position}
        >
          {text}
          <meshStandardMaterial color={color} />
        </Text3D>
      </FloatingElement>
    );
  }

  return (
    <FloatingElement>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={size}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        position={position}
        onError={() => setFontError(true)}
      >
        {text}
        <meshStandardMaterial color={color} />
      </Text3D>
    </FloatingElement>
  );
};

export { AnimatedBox };