import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── 展厅结构（复用 GalleryScene 的结构参数）───────────────────

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
      <mesh position={[0, 2.5, -11]}><planeGeometry args={[14, 5]} /><meshStandardMaterial color={wallColor} roughness={0.8} /></mesh>
      <mesh position={[0, 2.5, 5]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 5]} /><meshStandardMaterial color={wallColor} roughness={0.8} /></mesh>
      <mesh position={[-7, 2.5, -3]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[16, 5]} /><meshStandardMaterial color={wallColor} roughness={0.8} /></mesh>
      <mesh position={[7, 2.5, -3]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[16, 5]} /><meshStandardMaterial color={wallColor} roughness={0.8} /></mesh>
    </>
  );
}

function Pillar({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 5, 8]} />
        <meshStandardMaterial color="#c8b49a" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 5.1, 0]}><cylinderGeometry args={[0.3, 0.2, 0.2, 8]} /><meshStandardMaterial color="#e0cbb0" roughness={0.4} /></mesh>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.3, 0.35, 0.2, 8]} /><meshStandardMaterial color="#e0cbb0" roughness={0.4} /></mesh>
    </group>
  );
}

// ─── 灯光 ───────────────────────────────────────────────────

function Lighting({ spotlightColor, wallColor }) {
  const ambientIntensity = useMemo(() => {
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

// ─── 墙面坐标转换 ────────────────────────────────────────────

function getWallTransform(wall, x, y = 2.2) {
  switch (wall) {
    case 'back':  return { position: [x, y, 4.6], rotation: [0, Math.PI, 0] };
    case 'left':  return { position: [-6.6, y, x], rotation: [0, Math.PI / 2, 0] };
    case 'right': return { position: [6.6, y, x], rotation: [0, -Math.PI / 2, 0] };
    default:      return { position: [x, y, -10.6], rotation: [0, 0, 0] };
  }
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
        if (!cancelled) {
          texRef.current = tex;
          setTexture(tex);
        } else {
          tex.dispose();
        }
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

// ─── 画作（带悬停和信息浮层）───────────────────────────────────

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

  const wall = artwork.wall || 'front';
  const { position, rotation } = getWallTransform(wall, artwork.x, artwork.y || 2.2);

  return (
    <group position={position} rotation={rotation}>
      <group ref={frameRef}>
        {/* 画框 */}
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
              <div style={{ color: '#d1d5db', fontSize: 11, marginTop: 6, lineHeight: 1.4, maxHeight: 60, overflow: 'auto' }}>{artwork.description}</div>
            )}
            <div style={{ color: '#6b7280', fontSize: 11, marginTop: 6 }}>点击关闭</div>
          </div>
        </Html>
      )}

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

    const cam = state.camera;
    cam.position.x = Math.max(-6, Math.min(6, cam.position.x));
    cam.position.z = Math.max(-10, Math.min(4, cam.position.z));
    cam.position.y = 1.7;
  });

  return <PointerLockControls ref={controlsRef} />;
}

// ─── 主组件 ──────────────────────────────────────────────────

const CANVAS_ID = 'fp-preview-canvas';

export default function FirstPersonPreview({ template, artworks, onBack, onPublish, publishing }) {
  const [locked, setLocked] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef();

  const handleLock = () => {
    const canvas = document.querySelector(`#${CANVAS_ID}`);
    if (canvas) canvas.requestPointerLock();
    setLocked(true);
  };

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
    <div className="flex flex-col gap-4">
      {/* 3D 第一人称漫游画布 */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black" style={{ height: '550px' }}>
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
          id={CANVAS_ID}
          camera={{ position: [0, 1.7, 3], fov: 75, near: 0.1, far: 100 }}
          style={{ background: template.roomColor }}
          gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(template.roomColor);
          }}
        >
          <Suspense fallback={null}>
            <fog attach="fog" args={[template.roomColor, 18, 45]} />
            <Lighting spotlightColor={template.spotlightColor} wallColor={template.wallColor} />
            <Floor color={template.floorColor} />
            <Ceiling color={template.wallColor} />
            <Walls wallColor={template.wallColor} />
            <Pillar x={-5.5} z={1} />
            <Pillar x={5.5} z={1} />
            <Pillar x={-5.5} z={-7} />
            <Pillar x={5.5} z={-7} />
            {artworks.map(aw => (
              <Artwork key={aw.id} artwork={aw} />
            ))}
            <WalkControls />
          </Suspense>
        </Canvas>

        {/* 进入漫游提示 */}
        {!locked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-center cursor-pointer pointer-events-auto"
              onClick={handleLock}
            >
              <div className="text-white/80 text-base bg-black/60 backdrop-blur-md px-8 py-5 rounded-2xl border border-white/15 shadow-2xl hover:bg-black/70 transition-colors">
                <div className="text-3xl mb-2">🖱</div>
                <div className="font-medium mb-1">点击进入漫游模式</div>
                <div className="text-xs opacity-60">W A S D 移动 · 鼠标转向 · ESC 退出</div>
              </div>
            </div>
          </div>
        )}

        {/* 操控提示（锁定后） */}
        {locked && (
          <div className="absolute bottom-4 left-4 text-xs text-white/60 bg-black/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 space-y-1 pointer-events-none">
            <div>WASD / 方向键 — 移动</div>
            <div>鼠标 — 视角转向</div>
            <div>点击画作 — 查看详情</div>
            <div>ESC — 退出漫游</div>
          </div>
        )}

        {/* 展厅名称浮标 */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
          <div className="text-xs text-gray-400">当前展厅</div>
          <div className="text-white text-sm font-medium">{template.name || '预览展厅'}</div>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2 text-sm"
          disabled={publishing}
        >
          <ArrowLeftIcon />
          返回调整位置
        </button>
        <div className="flex items-center gap-3">
          <div className="text-gray-500 text-xs">漫游体验满意后，点击发布</div>
          <button
            onClick={() => {
              console.log('[FirstPersonPreview] 确认发布 clicked, publishing=', publishing);
              if (publishing) return;
              onPublish();
            }}
            disabled={publishing}
            className={`btn-primary flex items-center gap-2 text-sm ${publishing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {publishing ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                发布中...
              </>
            ) : (
              <>
                <SparklesIcon />
                确认发布
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// 内联小图标避免额外 import
function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
