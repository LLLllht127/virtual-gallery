import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── 展厅结构 ───────────────────────────────────────────────

function Floor({ color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]} receiveShadow>
      <planeGeometry args={[14, 16]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

function Ceiling({ color }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -3]}>
      <planeGeometry args={[14, 16]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Walls({ wallColor }) {
  return (
    <>
      {/* 前墙 (z = -11) */}
      <mesh position={[0, 2.5, -11]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* 后墙 (z = 5) */}
      <mesh position={[0, 2.5, 5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* 左墙 (x = -7) */}
      <mesh position={[-7, 2.5, -3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* 右墙 (x = 7) */}
      <mesh position={[7, 2.5, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
    </>
  );
}

// ─── 灯光系统 ───────────────────────────────────────────────

function Lighting({ spotlightColor, wallColor }) {
  const ambientIntensity = useMemo(() => {
    // 暗色模板需要更亮的环境光
    const c = new THREE.Color(wallColor);
    const brightness = (c.r + c.g + c.b) / 3;
    return brightness < 0.3 ? 1.5 : brightness < 0.6 ? 1.0 : 0.7;
  }, [wallColor]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight args={['#ffffff', wallColor, 0.6]} />
      <spotLight position={[-3, 4.5, 0]} intensity={2} angle={0.5} penumbra={0.6} color={spotlightColor} />
      <spotLight position={[0, 4.5, -3]} intensity={2} angle={0.5} penumbra={0.6} color={spotlightColor} />
      <spotLight position={[3, 4.5, 0]} intensity={2} angle={0.5} penumbra={0.6} color={spotlightColor} />
      <spotLight position={[0, 4.5, 3]} intensity={1.5} angle={0.5} penumbra={0.6} color={spotlightColor} />
      <pointLight position={[-5, 3, -3]} intensity={0.8} color={spotlightColor} distance={12} />
      <pointLight position={[5, 3, -3]} intensity={0.8} color={spotlightColor} distance={12} />
    </>
  );
}

// ─── 单幅画作（统一处理四面墙） ──────────────────────────────

/**
 * 根据 wall 属性计算 3D 位置与旋转
 * @param {string} wall - "front" | "back" | "left" | "right"
 * @param {number} x    - 沿墙水平偏移 (-5 ~ 5)
 * @param {number} y    - 垂直高度  (默认 2.2)
 * @returns {{ position: [x,y,z], rotation: [rx,ry,rz] }}
 */
function getWallTransform(wall, x, y = 2.2) {
  switch (wall) {
    case 'back':
      return { position: [x, y, 4.6], rotation: [0, Math.PI, 0] };
    case 'left':
      // z 轴映射：展厅 z ∈ [-9, 3]，对应 x 偏移
      return { position: [-6.6, y, x], rotation: [0, Math.PI / 2, 0] };
    case 'right':
      return { position: [6.6, y, x], rotation: [0, -Math.PI / 2, 0] };
    case 'front':
    default:
      return { position: [x, y, -10.6], rotation: [0, 0, 0] };
  }
}

/** 推断墙面的辅助函数（向后兼容没有 wall 字段的旧数据） */
function inferWall(artwork) {
  if (artwork.wall) return artwork.wall;
  if (artwork.z >= -2) return 'front';
  if (artwork.z <= -5) return 'back';
  return 'front';
}

// ─── 安全纹理加载（不抛异常）────────────────────────────────

function useSafeTexture(url) {
  const [texture, setTexture] = useState(null);
  const texRef = useRef(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (!cancelled) { texRef.current = tex; setTexture(tex); }
        else { tex.dispose(); }
      },
      undefined,
      () => { if (!cancelled) setTexture(null); }
    );
    return () => {
      cancelled = true;
      if (texRef.current) { texRef.current.dispose(); texRef.current = null; }
      setTexture(null);
    };
  }, [url]);
  return texture;
}

function ArtworkTextureMesh({ image }) {
  const texture = useSafeTexture(image);
  if (!texture) return null;
  return (
    <mesh position={[0, 0, 0.06]}>
      <planeGeometry args={[2.0, 1.4]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function Artwork({ artwork }) {
  const [hovered, setHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const frameRef = useRef();
  const hasImage = !!(artwork.image && artwork.image.trim());

  useFrame(() => {
    if (frameRef.current) {
      const target = hovered ? 1.03 : 1.0;
      frameRef.current.scale.setScalar(
        THREE.MathUtils.lerp(frameRef.current.scale.x, target, 0.1)
      );
    }
  });

  const wall = inferWall(artwork);
  const { position, rotation } = getWallTransform(wall, artwork.x, artwork.y || 2.2);

  return (
    <group position={position} rotation={rotation}>
      <group ref={frameRef}>
        {/* 外框 */}
        <mesh>
          <boxGeometry args={[2.3, 1.7, 0.08]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* 画布底色 */}
        <mesh
          position={[0, 0, 0.05]}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setShowInfo(!showInfo)}
        >
          <planeGeometry args={[2.0, 1.4]} />
          <meshStandardMaterial color="#1e1b4b" />
        </mesh>
        {/* 纹理层 */}
        {hasImage && (
          <group
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={() => setShowInfo(!showInfo)}
          >
            <ArtworkTextureMesh image={artwork.image} />
          </group>
        )}
        {/* 仅悬停时补光 */}
        {hovered && (
          <pointLight position={[0, 1.5, 0.5]} intensity={1.5} color="#fff8e7" distance={3} />
        )}
      </group>

      {/* 信息浮层 */}
      {showInfo && (
        <Html position={[0, -1.2, 0.1]} center>
          <div
            style={{
              background: 'rgba(10,10,20,0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '12px',
              padding: '12px 16px',
              width: '200px',
              color: '#fff',
              fontSize: '13px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              cursor: 'pointer',
            }}
            onClick={() => setShowInfo(false)}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#a5b4fc' }}>{artwork.title}</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>艺术家：{artwork.artist}</div>
            {artwork.description && (
              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>{artwork.description}</div>
            )}
            <div style={{ color: '#6b7280', fontSize: 11, marginTop: 6 }}>点击关闭</div>
          </div>
        </Html>
      )}

      {/* 悬停提示 */}
      {hovered && !showInfo && (
        <Html position={[0, -1.2, 0.1]} center>
          <div style={{
            background: 'rgba(99,102,241,0.9)',
            color: '#fff',
            borderRadius: '8px',
            padding: '4px 12px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            点击查看详情
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── 装饰柱子 ───────────────────────────────────────────────

function Pillar({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 5, 8]} />
        <meshStandardMaterial color="#c8b49a" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 5.1, 0]}>
        <cylinderGeometry args={[0.3, 0.2, 0.2, 8]} />
        <meshStandardMaterial color="#e0cbb0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.2, 8]} />
        <meshStandardMaterial color="#e0cbb0" roughness={0.4} />
      </mesh>
    </group>
  );
}

// ─── WASD 漫游控制 ──────────────────────────────────────────

function WalkControls() {
  const controlsRef = useRef();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = true; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = true; break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = false; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = false; break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked) return;
    const speed = 5;
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;

    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.current.normalize();

    if (moveState.current.forward || moveState.current.backward)
      velocity.current.z -= direction.current.z * speed * delta * 50;
    if (moveState.current.left || moveState.current.right)
      velocity.current.x -= direction.current.x * speed * delta * 50;

    controlsRef.current.moveForward(-velocity.current.z * delta);
    controlsRef.current.moveRight(-velocity.current.x * delta);

    // 限制边界
    const cam = state.camera;
    cam.position.x = Math.max(-6, Math.min(6, cam.position.x));
    cam.position.z = Math.max(-10, Math.min(4, cam.position.z));
    cam.position.y = 1.7;
  });

  return <PointerLockControls ref={controlsRef} />;
}

// ─── 主展厅场景 ──────────────────────────────────────────────

export default function GalleryScene({ template }) {
  const [locked, setLocked] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef();

  // 追踪 pointer lock 状态变化
  useEffect(() => {
    const handleChange = () => {
      setLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', handleChange);
    return () => document.removeEventListener('pointerlockchange', handleChange);
  }, []);

  // WebGL 上下文丢失恢复
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleLost = (e) => { e.preventDefault(); setContextLost(true); };
    const handleRestored = () => { setContextLost(false); };
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {contextLost && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-3xl mb-2 animate-pulse">🔄</div>
            <div className="text-gray-400 text-sm">渲染引擎恢复中...</div>
          </div>
        </div>
      )}
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 1.7, 3], fov: 75, near: 0.1, far: 100 }}
        style={{ background: template.roomColor }}
        id="gallery-canvas"
        gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', antialias: true }}
      >
        <Suspense fallback={null}>
          {/* 雾效 — 较远才生效，近处清晰 */}
          <fog attach="fog" args={[template.roomColor, 18, 45]} />

          {/* 灯光 */}
          <Lighting spotlightColor={template.spotlightColor} wallColor={template.wallColor} />

          {/* 展厅结构 */}
          <Floor color={template.floorColor} />
          <Ceiling color={template.wallColor} />
          <Walls wallColor={template.wallColor} />

          {/* 装饰柱 */}
          <Pillar x={-5.5} z={1} />
          <Pillar x={5.5} z={1} />
          <Pillar x={-5.5} z={-7} />
          <Pillar x={5.5} z={-7} />

          {/* 所有展品 — 统一 Artwork 组件，自动根据 wall/z 字段确定位置 */}
          {template.artworks.map(artwork => (
            <Artwork key={artwork.id} artwork={artwork} />
          ))}

          {/* 第一人称漫游控制 */}
          <WalkControls />
        </Suspense>
      </Canvas>

      {/* 进入提示 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none transition-opacity duration-300" style={{ opacity: locked ? 0 : 1 }}>
        {!locked && (
          <div
            className="text-center cursor-pointer pointer-events-auto"
            onClick={() => {
              const canvas = document.querySelector('#gallery-canvas');
              if (canvas) canvas.requestPointerLock();
            }}
          >
            <div className="text-white/60 text-sm bg-black/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
              🖱 点击进入漫游模式<br />
              <span className="text-xs opacity-70">W A S D 移动 · 鼠标转向 · ESC 退出</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
