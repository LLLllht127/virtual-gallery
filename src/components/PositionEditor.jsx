import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── 复用展厅结构 ───────────────────────────────────────────

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

// ─── 安全的纹理加载（不抛异常）──────────────────────────────

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
      () => { if (!cancelled) setTexture(null); } // 加载失败，静默回退
    );
    return () => {
      cancelled = true;
      if (texRef.current) { texRef.current.dispose(); texRef.current = null; }
      setTexture(null);
    };
  }, [url]);
  return texture;
}

function ArtworkTexture({ image }) {
  const texture = useSafeTexture(image);
  if (!texture) return null;
  return (
    <mesh position={[0, 0, 0.06]}>
      <planeGeometry args={[2.0, 1.4]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// ─── 可拖拽的画作 ────────────────────────────────────────────

function EditableArtwork({ artwork, index, isSelected, onSelect, onDragStart }) {
  const [hovered, setHovered] = useState(false);
  const frameRef = useRef();
  const { position, rotation } = getWallTransform(artwork.wall, artwork.x, artwork.y || 2.2);
  const hasImage = !!(artwork.image && artwork.image.trim());

  useFrame(() => {
    if (frameRef.current) {
      const target = hovered || isSelected ? 1.05 : 1.0;
      frameRef.current.scale.setScalar(
        THREE.MathUtils.lerp(frameRef.current.scale.x, target, 0.1)
      );
    }
  });

  const frameColor = isSelected ? '#6366f1' : hovered ? '#818cf8' : '#2a1a0a';

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (isSelected) {
      // 已选中 → 开始拖拽
      onDragStart(index);
    } else {
      // 未选中 → 先选中
      onSelect(index);
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <group ref={frameRef}>
        {/* 画框 */}
        <mesh>
          <boxGeometry args={[2.3, 1.7, 0.08]} />
          <meshStandardMaterial
            color={frameColor}
            roughness={0.6}
            metalness={0.2}
            emissive={isSelected ? '#6366f1' : '#000000'}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
        </mesh>
        {/* 画布 — 有图用纹理，无图用色块 */}
        <mesh
          position={[0, 0, 0.05]}
          onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
          onPointerDown={handlePointerDown}
          onClick={(e) => { e.stopPropagation(); onSelect(index); }}
        >
          <planeGeometry args={[2.0, 1.4]} />
          <meshStandardMaterial color={isSelected ? '#312e81' : '#1e1b4b'} />
        </mesh>
        {/* 纹理层（仅在有效图片时加载，避免 Hook 规则违反） */}
        {hasImage && (
          <group
            onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerLeave={() => setHovered(false)}
            onPointerDown={handlePointerDown}
            onClick={(e) => { e.stopPropagation(); onSelect(index); }}
          >
            <ArtworkTexture image={artwork.image} />
          </group>
        )}
        {/* 仅选中和悬停时补光，减少总灯光数 */}
        {(hovered || isSelected) && (
          <pointLight position={[0, 1.5, 0.5]} intensity={1.5} color="#fff8e7" distance={3} />
        )}
      </group>

      {/* 选中/悬停标签 */}
      {(isSelected || hovered) && (
        <Html position={[0, -1.2, 0.1]} center>
          <div style={{
            background: isSelected ? 'rgba(99,102,241,0.95)' : 'rgba(30,27,75,0.9)',
            color: '#fff',
            borderRadius: '8px',
            padding: '4px 14px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: isSelected ? '1px solid rgba(165,180,252,0.5)' : '1px solid rgba(255,255,255,0.15)',
          }}>
            {isSelected ? `✦ ${artwork.title || '作品 ' + (index + 1)}` : artwork.title || '作品 ' + (index + 1)}
            {isSelected && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>可拖拽</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── 拖拽控制器（在 Canvas 内运行，访问相机和 gl） ─────────

function DragHandler({ isDragging, dragIndex, artworks, onUpdateArtwork, onDragMove }) {
  const { camera, gl } = useThree();
  const prevClientX = useRef(0);
  const prevClientY = useRef(0);
  const initialized = useRef(false);
  const DRAG_THRESHOLD = 4; // px — 区分点击和拖拽

  // 拖拽开始时重置状态
  useEffect(() => {
    if (isDragging) {
      initialized.current = false;
    }
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging || dragIndex === null) return;

    const canvas = gl.domElement;

    const handleMove = (e) => {
      // 首次移动：记录初始位置，不计算 delta
      if (!initialized.current) {
        prevClientX.current = e.clientX;
        prevClientY.current = e.clientY;
        onDragMove._startX = e.clientX;
        onDragMove._startY = e.clientY;
        initialized.current = true;
        return;
      }

      const dx = e.clientX - prevClientX.current;
      const dy = e.clientY - prevClientY.current;
      prevClientX.current = e.clientX;
      prevClientY.current = e.clientY;

      // 阈值保护：首次有效移动需要超过阈值
      if (!onDragMove._started) {
        const totalDx = Math.abs(e.clientX - onDragMove._startX);
        const totalDy = Math.abs(e.clientY - onDragMove._startY);
        if (totalDx < DRAG_THRESHOLD && totalDy < DRAG_THRESHOLD) return;
        onDragMove._started = true;
      }

      const artwork = artworks[dragIndex];
      if (!artwork) return;

      // 根据墙面方向，用相机向量投影计算位移
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      const sensitivity = 0.018;

      // 水平移动（x 坐标）
      let newX = artwork.x;
      if (artwork.wall === 'front' || artwork.wall === 'back') {
        newX = artwork.x + right.x * dx * sensitivity;
      } else {
        newX = artwork.x + forward.z * dx * sensitivity;
      }
      newX = Math.round(Math.max(-5, Math.min(5, newX)) * 10) / 10;
      if (newX !== artwork.x) {
        onUpdateArtwork(dragIndex, 'x', newX);
      }

      // 垂直移动（y 坐标）— 屏幕上移 = clientY 减小 = 世界上移
      const vertSensitivity = 0.012;
      let newY = (artwork.y || 2.2) - dy * vertSensitivity;
      newY = Math.round(Math.max(1.0, Math.min(4.0, newY)) * 10) / 10;
      if (newY !== (artwork.y || 2.2)) {
        onUpdateArtwork(dragIndex, 'y', newY);
      }
    };

    const handleUp = () => {
      onDragMove._end();
    };

    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointerleave', handleUp);

    return () => {
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointerleave', handleUp);
    };
  }, [isDragging, dragIndex, artworks, onUpdateArtwork, onDragMove, camera, gl]);

  return null;
}

// ─── 自动旋转相机 ────────────────────────────────────────────

function AutoRotate({ enabled, disabled }) {
  const controlsRef = useRef();
  useFrame(() => {
    if (controlsRef.current && enabled) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!disabled}
      enablePan={false}
      minDistance={5}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2 - 0.1}
      target={[0, 2, -3]}
    />
  );
}

// ─── 主组件 ──────────────────────────────────────────────────

const WALL_LABELS = { front: '前墙', back: '后墙', left: '左墙', right: '右墙' };
const WALLS = ['front', 'back', 'left', 'right'];

export default function PositionEditor({ template, artworks, onUpdateArtwork }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [contextLost, setContextLost] = useState(false);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const canvasRef = useRef();

  const selected = selectedIndex !== null ? artworks[selectedIndex] : null;

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

  const handleSelect = useCallback((index) => {
    if (isDragging) return; // 拖拽中不允许切换选择
    setSelectedIndex(prev => prev === index ? null : index);
  }, [isDragging]);

  const handleWallChange = (wall) => {
    if (selectedIndex === null) return;
    onUpdateArtwork(selectedIndex, 'wall', wall);
  };

  const handleXChange = (delta) => {
    if (selectedIndex === null || !selected) return;
    const newX = Math.max(-5, Math.min(5, selected.x + delta));
    onUpdateArtwork(selectedIndex, 'x', Math.round(newX * 10) / 10);
  };

  const handleYChange = (delta) => {
    if (selectedIndex === null || !selected) return;
    const newY = Math.max(1.0, Math.min(4.0, (selected.y || 2.2) + delta));
    onUpdateArtwork(selectedIndex, 'y', Math.round(newY * 10) / 10);
  };

  const handleDeselect = () => {
    if (isDragging) return;
    setSelectedIndex(null);
  };

  // 拖拽控制函数（传递给 DragHandler）
  const dragControl = useMemo(() => {
    const ctrl = { _started: false, _startX: 0 };
    ctrl._end = () => {
      setIsDragging(false);
      ctrl._started = false;
      if (canvasRef.current) canvasRef.current.style.cursor = '';
    };
    return ctrl;
  }, []);

  // 开始拖拽（从 EditableArtwork 调用）
  const handleDragStart = useCallback((index) => {
    if (isDragging) return;
    dragStartX.current = 0; // 会在 DragHandler 的 pointermove 中更新
    dragControl._started = false;
    dragControl._startX = 0;
    setIsDragging(true);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, [isDragging, dragControl]);

  // 拖拽结束后的清理
  useEffect(() => {
    if (!isDragging && canvasRef.current) {
      canvasRef.current.style.cursor = '';
    }
  }, [isDragging]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
      {/* 3D 预览画布 */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black">
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
          camera={{ position: [0, 6, 10], fov: 60, near: 0.1, far: 100 }}
          style={{ background: template.roomColor, cursor: isDragging ? 'grabbing' : 'default' }}
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
            {artworks.map((aw, i) => (
              <EditableArtwork
                key={aw.id}
                artwork={aw}
                index={i}
                isSelected={selectedIndex === i}
                onSelect={handleSelect}
                onDragStart={handleDragStart}
              />
            ))}

            {/* 拖拽控制器 */}
            {isDragging && selectedIndex !== null && (
              <DragHandler
                isDragging={isDragging}
                dragIndex={selectedIndex}
                artworks={artworks}
                onUpdateArtwork={onUpdateArtwork}
                onDragMove={dragControl}
              />
            )}

            {/* 无选中时自动旋转+可旋转视角；选中或拖拽时锁定视角 */}
            <AutoRotate
              enabled={selectedIndex === null}
              disabled={selectedIndex !== null}
            />
          </Suspense>
        </Canvas>

        {/* 拖拽中的位置提示 */}
        {isDragging && selected && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary-600/90 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm animate-fade-in flex items-center gap-2">
            <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
            </svg>
            拖拽中 · {WALL_LABELS[selected.wall]} · 水平 {selected.x.toFixed(1)} · 高度 {(selected.y || 2.2).toFixed(1)}
          </div>
        )}

        {/* 画布上的提示 */}
        <div className="absolute bottom-3 left-3 text-xs text-white/50 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg pointer-events-none">
          {isDragging
            ? '🖱 按住鼠标拖拽移动画作 · 松开完成'
            : selectedIndex !== null
              ? '🎯 拖拽画作移动 · 或使用右侧面板调整'
              : '🖱 点击画作选中 · 拖拽旋转视角'
          }
        </div>
      </div>

      {/* 右侧控制面板 */}
      <div className="w-full lg:w-72 flex flex-col gap-3 overflow-y-auto">
        {/* 作品列表 */}
        <div className="card-glass rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-2">展品列表（点击选中）</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {artworks.map((aw, i) => (
              <button
                key={aw.id}
                onClick={() => handleSelect(i)}
                disabled={isDragging}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all ${
                  selectedIndex === i
                    ? 'bg-primary-600/30 border border-primary-500/40 text-white'
                    : 'bg-white/5 border border-transparent hover:bg-white/10 text-gray-300'
                } ${isDragging ? 'opacity-50' : ''}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  selectedIndex === i ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-400'
                }`}>{i + 1}</span>
                <span className="truncate">{aw.title || '未命名'}</span>
                <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{WALL_LABELS[aw.wall]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 位置调整 */}
        {selected && (
          <div className="card-glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-white font-medium text-sm">调整位置</div>
              <button onClick={handleDeselect} disabled={isDragging} className="text-gray-500 hover:text-white text-xs disabled:opacity-40">取消选中</button>
            </div>

            <div className="text-xs text-primary-300 bg-primary-600/15 rounded-lg px-3 py-1.5">
              ✦ {selected.title || '作品 ' + (selectedIndex + 1)}
            </div>

            {/* 拖拽提示 */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <span className="text-amber-400 text-xs">🖱</span>
              <span className="text-amber-400/80 text-[11px]">在 3D 场景中按住并拖拽可自由移动</span>
            </div>

            {/* 墙面选择 */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">挂载墙面</div>
              <div className="grid grid-cols-2 gap-1.5">
                {WALLS.map(w => (
                  <button
                    key={w}
                    onClick={() => handleWallChange(w)}
                    disabled={isDragging}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected.wall === w
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                    } ${isDragging ? 'opacity-40' : ''}`}
                  >
                    {WALL_LABELS[w]}
                  </button>
                ))}
              </div>
            </div>

            {/* 水平位置 */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">水平位置：{selected.x.toFixed(1)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleXChange(-0.5)}
                  disabled={selected.x <= -5 || isDragging}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 transition-colors border border-white/10"
                >
                  ← 左移
                </button>
                <button
                  onClick={() => handleXChange(0.5)}
                  disabled={selected.x >= 5 || isDragging}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 transition-colors border border-white/10"
                >
                  右移 →
                </button>
              </div>
              {/* 位置滑条 */}
              <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={selected.x}
                onChange={e => onUpdateArtwork(selectedIndex, 'x', parseFloat(e.target.value))}
                disabled={isDragging}
                className="w-full mt-2 accent-indigo-500 disabled:opacity-40"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                <span>-5 (左)</span>
                <span>0 (中)</span>
                <span>5 (右)</span>
              </div>
            </div>

            {/* 垂直位置 */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">垂直高度：{(selected.y || 2.2).toFixed(1)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleYChange(-0.2)}
                  disabled={(selected.y || 2.2) <= 1.0 || isDragging}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 transition-colors border border-white/10"
                >
                  ↓ 下移
                </button>
                <button
                  onClick={() => handleYChange(0.2)}
                  disabled={(selected.y || 2.2) >= 4.0 || isDragging}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30 transition-colors border border-white/10"
                >
                  上移 ↑
                </button>
              </div>
              {/* 垂直滑条 */}
              <input
                type="range"
                min={1.0}
                max={4.0}
                step={0.1}
                value={selected.y || 2.2}
                onChange={e => onUpdateArtwork(selectedIndex, 'y', parseFloat(e.target.value))}
                disabled={isDragging}
                className="w-full mt-2 accent-indigo-500 disabled:opacity-40"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                <span>1.0 (低)</span>
                <span>2.2 (中)</span>
                <span>4.0 (高)</span>
              </div>
            </div>
          </div>
        )}

        {!selected && (
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🖱</div>
            <div className="text-gray-400 text-sm">点击左侧 3D 场景中的画作<br />或上方列表中的作品名称<br />即可调整其位置</div>
            <div className="mt-3 text-xs text-gray-600 bg-white/5 rounded-lg p-2.5">
              💡 <strong className="text-gray-500">拖拽功能</strong><br />
              选中画作后，在 3D 场景中<br />按住鼠标拖拽即可自由移动
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
