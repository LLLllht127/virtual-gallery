import { useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Image as ImageIcon,
  Palette, FileText, Eye, Sparkles, Plus, Trash2, MoveUp, MoveDown, RotateCcw
} from 'lucide-react';
import { GALLERY_TEMPLATES, ARTWORK_SLOTS, saveUserGallery, generateGalleryId, generateGalleryUrl } from '../data/galleries';
import { useGalleryStore } from '../store/galleryStore';
import PositionEditor from '../components/PositionEditor';
import FirstPersonPreview from '../components/FirstPersonPreview';

// 用 Canvas 压缩大图片（异步）
function compressImage(dataUrl, maxWidth = 600) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        // 缩放至 maxWidth
        if (w > maxWidth) {
          const ratio = maxWidth / w;
          w = maxWidth;
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        console.log(`[compressImage] ${img.width}x${img.height} (${dataUrl.length}B) → ${w}x${h} (${compressed.length}B)`);
        resolve(compressed);
      } catch (e) {
        console.warn('[compressImage] failed:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => { console.warn('[compressImage] img load failed'); resolve(dataUrl); };
    img.src = dataUrl;
  });
}

const STEPS = [
  { num: 1, label: '选择模板', icon: Palette },
  { num: 2, label: '展厅信息', icon: FileText },
  { num: 3, label: '上传作品', icon: ImageIcon },
  { num: 4, label: '预览发布', icon: Eye },
];

const WALL_LABELS = {
  front: '前墙',
  back: '后墙',
  left: '左墙',
  right: '右墙',
};

// 下一个默认槽位（循环复用 ARTWORK_SLOTS 的坐标）
let nextSlotIndex = 0;
function getNextSlot() {
  const slot = ARTWORK_SLOTS[nextSlotIndex % ARTWORK_SLOTS.length];
  nextSlotIndex++;
  return { wall: slot.wall, x: slot.x, z: slot.z };
}

// 空作品模板
function emptyArtwork() {
  const slot = getNextSlot();
  return {
    id: 'new-' + Math.random().toString(36).slice(2, 8),
    title: '',
    artist: '',
    description: '',
    image: '',
    wall: slot.wall,
    x: slot.x,
    y: 2.2,
    z: slot.z,
  };
}

export default function CreateGalleryPage() {
  const navigate = useNavigate();
  const { showToast } = useGalleryStore();

  // 重置槽位计数器
  nextSlotIndex = 0;

  // 步骤状态
  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState(null);
  const [galleryName, setGalleryName] = useState('');
  const [galleryDesc, setGalleryDesc] = useState('');
  const [galleryTags, setGalleryTags] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [walkMode, setWalkMode] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState(null);

  const canNext = () => {
    if (step === 1) return !!templateId;
    if (step === 2) return galleryName.trim().length > 0;
    if (step === 3) return artworks.length > 0 && artworks.some(a => a.image.trim());
    return true;
  };

  const handleSelectTemplate = (id) => {
    setTemplateId(id);
    const tpl = GALLERY_TEMPLATES.find(t => t.id === id);
    const count = tpl?.spotCount || 5;
    // 重置计数器并创建初始作品位
    nextSlotIndex = 0;
    setArtworks(Array.from({ length: count }, () => emptyArtwork()));
    setGalleryName('');
    setGalleryDesc('');
    setGalleryTags('');
  };

  const handleNext = () => {
    if (canNext() && step < 4) setStep(step + 1);
  };
  const handlePrev = () => { if (step > 1) setStep(step - 1); };

  // === Artwork 操作 ===
  const updateArtwork = (index, field, value) => {
    const updated = [...artworks];
    updated[index][field] = value;
    setArtworks(updated);
  };

  const addArtwork = () => {
    setArtworks([...artworks, emptyArtwork()]);
    showToast('已添加新展位');
  };

  const removeArtwork = (index) => {
    if (artworks.length <= 1) { showToast('至少保留一个作品位'); return; }
    setArtworks(artworks.filter((_, i) => i !== index));
  };

  const moveArtwork = (index, dir) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= artworks.length) return;
    const updated = [...artworks];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    setArtworks(updated);
  };

  const handleUpdateArtwork = (index, field, value) => {
    const updated = [...artworks];
    updated[index] = { ...updated[index], [field]: value };
    setArtworks(updated);
  };

  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (publishing) return;
    console.log('[handlePublish] 开始发布...');
    setPublishing(true);

    try {
      const template = GALLERY_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        console.error('[handlePublish] 模板未找到:', templateId);
        showToast('模板未找到，请重新选择', 'error');
        setPublishing(false);
        return;
      }
      console.log('[handlePublish] 模板:', template.name);

      const validArtworks = artworks.filter(a => a.image && a.image.trim());
      if (validArtworks.length === 0) {
        console.warn('[handlePublish] 无有效作品');
        showToast('至少需要上传一件有效作品', 'error');
        setPublishing(false);
        return;
      }
      console.log('[handlePublish] 有效作品数:', validArtworks.length);

      // 如果有大 base64 图片，先压缩
      const compressedArtworks = await Promise.all(
        validArtworks.map(async (a, i) => ({
          id: a.id,
          title: (a.title || '').trim() || `作品 ${i + 1}`,
          artist: (a.artist || '').trim() || '创作者',
          description: (a.description || '').trim(),
          image: a.image.trim().startsWith('data:')
            ? await compressImage(a.image.trim(), 600)
            : a.image.trim(),
          wall: a.wall || 'front',
          x: a.x,
          y: a.y || 2.2,
          z: a.z,
        }))
      );

      const firstImage = compressedArtworks[0]?.image || template.thumbnail;
      const compressedThumbnail = firstImage.startsWith('data:')
        ? await compressImage(firstImage, 300)
        : firstImage;

      const newGallery = {
        id: generateGalleryId(),
        name: galleryName.trim(),
        description: galleryDesc.trim(),
        tags: galleryTags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        category: template.category || 'art',
        categoryLabel: template.categoryLabel || '自定义',
        thumbnail: compressedThumbnail,
        createdAt: new Date().toISOString(),
        roomColor: template.roomColor,
        wallColor: template.wallColor,
        floorColor: template.floorColor,
        spotlightColor: template.spotlightColor,
        artworks: compressedArtworks,
      };

      console.log('[handlePublish] 准备保存, gallery id:', newGallery.id);
      saveUserGallery(newGallery);
      console.log('[handlePublish] 保存成功!');

      showToast('展厅发布成功！');
      setIsPublished(true);
      setPublishedId(newGallery.id);
      console.log('[handlePublish] 即将跳转到 /gallery/' + newGallery.id);
      setTimeout(() => navigate(`/gallery/${newGallery.id}`), 1500);
    } catch (err) {
      console.error('[发布失败]', err);
      showToast('发布失败: ' + (err.message || '未知错误'), 'error');
      setPublishing(false);
    }
  };

  const selectedTemplate = templateId ? GALLERY_TEMPLATES.find(t => t.id === templateId) : null;

  return (
    <div className="min-h-screen bg-[#0a0a14] pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* 步骤进度条 */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  step > s.num ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  step === s.num ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' :
                  'bg-white/5 text-gray-500 border border-white/10'
                }`}>
                  <s.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">{s.num}</span>
                </div>
                {i < 3 && <div className="w-4 md:w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>
          <div className="w-10" />
        </div>

        {/* ========== 步骤 1: 选择模板 ========== */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">选择展厅风格</h2>
            <p className="text-gray-400 mb-8">从 {GALLERY_TEMPLATES.length} 个精美模板中选择适合的风格，后续可填充自己的作品</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {GALLERY_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`template-card card-glass rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                    templateId === tpl.id ? 'border-primary-500 shadow-lg shadow-primary-500/30 scale-[1.02]' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {templateId === tpl.id && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
                      {tpl.categoryLabel} · {tpl.spotCount} 展位
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">{tpl.name}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{tpl.description}</p>
                    <div className="flex gap-1.5 mt-3">
                      {[tpl.roomColor, tpl.wallColor, tpl.floorColor, tpl.spotlightColor].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} title={c} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 步骤 2: 展厅信息 ========== */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">展厅基本信息</h2>
            <p className="text-gray-400 mb-8">设置展厅的名称、描述和标签，让访客快速了解你的展览</p>

            {selectedTemplate && (
              <div className="flex items-center gap-3 card-glass rounded-xl p-3 mb-6">
                <img src={selectedTemplate.thumbnail} alt="" className="w-14 h-10 object-cover rounded-lg" />
                <div>
                  <div className="text-white text-sm font-medium">{selectedTemplate.name}</div>
                  <div className="text-gray-500 text-xs">{selectedTemplate.categoryLabel} · {selectedTemplate.spotCount} 展位</div>
                </div>
                <button onClick={() => setStep(1)} className="ml-auto text-gray-400 hover:text-white text-sm">修改</button>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">展厅名称 *</label>
                <input
                  type="text"
                  value={galleryName}
                  onChange={e => setGalleryName(e.target.value)}
                  placeholder="例如：2025 年度摄影回顾展"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/60 focus:bg-white/10 transition-all"
                  maxLength={30}
                />
                <div className="text-gray-600 text-xs mt-1">{galleryName.length}/30</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">展厅描述</label>
                <textarea
                  value={galleryDesc}
                  onChange={e => setGalleryDesc(e.target.value)}
                  placeholder="简要描述你的展览主题、展品类型等..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/60 focus:bg-white/10 transition-all resize-none"
                  maxLength={200}
                />
                <div className="text-gray-600 text-xs mt-1">{galleryDesc.length}/200</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">标签</label>
                <input
                  type="text"
                  value={galleryTags}
                  onChange={e => setGalleryTags(e.target.value)}
                  placeholder="用逗号分隔，如：艺术, 摄影, 自然"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/60 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========== 步骤 3: 上传作品 ========== */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">上传作品</h2>
                <p className="text-gray-400">
                  支持从本地导入图片或粘贴图片地址，填写标题和作者信息。当前共 {artworks.length} 个展位，至少填写一个。
                </p>
              </div>
              <button
                onClick={addArtwork}
                className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0 ml-4"
              >
                <Plus className="w-4 h-4" />
                添加展位
              </button>
            </div>

            <div className="space-y-4">
              {artworks.map((aw, index) => (
                <ArtworkEditor
                  key={aw.id}
                  artwork={aw}
                  index={index}
                  total={artworks.length}
                  onUpdate={(field, val) => updateArtwork(index, field, val)}
                  onRemove={() => removeArtwork(index)}
                  onMoveUp={() => moveArtwork(index, -1)}
                  onMoveDown={() => moveArtwork(index, 1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ========== 步骤 4: 预览发布 ========== */}
        {step === 4 && !previewMode && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">预览与调整</h2>
            <p className="text-gray-400 mb-8">先预览 3D 展厅效果，自由调整画作位置，满意后再发布</p>

            <div className="card-glass rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-4">展厅概览</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-500 text-xs mb-1">风格</div>
                  <div className="text-white text-sm font-medium">{selectedTemplate?.name}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-500 text-xs mb-1">名称</div>
                  <div className="text-white text-sm font-medium">{galleryName}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-500 text-xs mb-1">展品数</div>
                  <div className="text-white text-sm font-medium">{artworks.filter(a => a.image.trim()).length} 件</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-500 text-xs mb-1">标签</div>
                  <div className="text-white text-sm font-medium">{galleryTags || '未设置'}</div>
                </div>
              </div>

              <h4 className="text-gray-300 font-medium text-sm mb-3">作品列表</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {artworks.filter(a => a.image.trim()).map((aw, i) => (
                  <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={aw.image}
                        alt={aw.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="%23111" width="200" height="150"/><text fill="%23666" x="100" y="80" text-anchor="middle" font-size="14">图片加载失败</text></svg>'; }}
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="text-white text-xs font-medium truncate">{aw.title || '未命名'}</div>
                      <div className="text-gray-500 text-xs truncate">{aw.artist || '未知作者'}</div>
                      {aw.description && <div className="text-gray-600 text-[10px] mt-0.5 line-clamp-2">{aw.description}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTemplate && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">展厅色调：</span>
                  {[selectedTemplate.roomColor, selectedTemplate.wallColor, selectedTemplate.floorColor, selectedTemplate.spotlightColor].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-white/30" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && previewMode && !walkMode && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">3D 展厅预览 — 调整画作位置</h2>
                <p className="text-gray-400 text-sm">点击画作选中，使用右侧面板切换墙面和调整水平位置。调整后点击「漫游体验」进入第一人称视角。</p>
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                返回概览
              </button>
            </div>

            {selectedTemplate && (
              <Suspense fallback={
                <div className="h-[600px] rounded-2xl bg-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-3 animate-pulse">🏛</div>
                    <div className="text-gray-400">正在加载 3D 预览...</div>
                  </div>
                </div>
              }>
                <PositionEditor
                  template={selectedTemplate}
                  artworks={artworks.filter(a => a.image.trim())}
                  onUpdateArtwork={(idx, field, value) => {
                    // 需要映射到实际 artworks 数组中的索引
                    const validArtworks = artworks.filter(a => a.image.trim());
                    const originalIdx = artworks.indexOf(validArtworks[idx]);
                    if (originalIdx >= 0) {
                      const updated = [...artworks];
                      updated[originalIdx] = { ...updated[originalIdx], [field]: value };
                      // 如果切换墙面，重置 x 坐标为该墙面的合理位置
                      if (field === 'wall') {
                        if (value === 'front' || value === 'back') {
                          updated[originalIdx].x = 0;
                          updated[originalIdx].z = value === 'front' ? -10.6 : 4.6;
                        } else {
                          // left/right 墙：x 是 z 位置
                          updated[originalIdx].x = -3;
                          updated[originalIdx].z = value === 'left' ? -6.6 : 6.6;
                        }
                      }
                      setArtworks(updated);
                    }
                  }}
                />
              </Suspense>
            )}

            {isPublished && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <div className="text-green-400 font-medium text-sm">展厅已发布成功！</div>
                  <div className="text-green-400/70 text-xs">正在跳转到展厅...</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 第一人称漫游预览 ── */}
        {step === 4 && walkMode && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">第一人称漫游体验</h2>
              <p className="text-gray-400 text-sm">以访客视角走进展厅，近距离欣赏每幅画作。满意后点击「确认发布」。</p>
            </div>

            {selectedTemplate && (
              <Suspense fallback={
                <div className="h-[550px] rounded-2xl bg-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-3 animate-pulse">🏛</div>
                    <div className="text-gray-400">正在加载漫游场景...</div>
                  </div>
                </div>
              }>
                <FirstPersonPreview
                  template={{
                    ...selectedTemplate,
                    artworks: artworks.filter(a => a.image.trim()).map((a, i) => ({
                      id: a.id,
                      title: a.title.trim() || `作品 ${i + 1}`,
                      artist: a.artist.trim() || '创作者',
                      description: (a.description || '').trim(),
                      image: a.image.trim(),
                      wall: a.wall || 'front',
                      x: a.x,
                      y: a.y || 2.2,
                      z: a.z,
                    })),
                  }}
                  artworks={artworks.filter(a => a.image.trim())}
                  onBack={() => setWalkMode(false)}
                  onPublish={handlePublish}
                  publishing={publishing}
                />
              </Suspense>
            )}

            {isPublished && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <div className="text-green-400 font-medium text-sm">展厅已发布成功！</div>
                  <div className="text-green-400/70 text-xs">正在跳转到展厅...</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 1 && !previewMode && !walkMode && (
              <button onClick={handlePrev} className="btn-secondary flex items-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                上一步
              </button>
            )}
          </div>
          <div>
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className={`btn-primary flex items-center gap-2 text-sm ${
                  !canNext() ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                下一步
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : walkMode ? null : !previewMode ? (
              <button
                onClick={() => setPreviewMode(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Eye className="w-4 h-4" />
                立即预览
              </button>
            ) : (
              <button
                onClick={() => setWalkMode(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Eye className="w-4 h-4" />
                漫游体验
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 单个作品编辑器组件 ─────────────────────────────────────────

const WALL_COLORS = {
  front: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  back: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  left: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  right: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

function ArtworkEditor({ artwork, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const filled = artwork.image.trim() && artwork.title.trim();
  const wallColor = WALL_COLORS[artwork.wall] || WALL_COLORS.front;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件（JPG、PNG、WebP 等）');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate('image', reader.result);
      setImgError(false);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      alert('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // 允许重复选择同一文件
  };

  return (
    <div className={`card-glass rounded-2xl p-4 md:p-5 transition-all ${
      filled ? 'border-green-500/30 bg-green-500/5' : 'border-white/10'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        {filled ? (
          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <span className="w-5 h-5 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{index + 1}</span>
        )}
        <span className="text-white font-medium text-sm">展位 {index + 1}</span>

        {/* 墙面选择器 */}
        <div className="flex items-center gap-1">
          {Object.entries(WALL_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onUpdate('wall', key)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                artwork.wall === key
                  ? wallColor
                  : 'text-gray-600 bg-transparent border-white/10 hover:border-white/20'
              }`}
              title={`挂载到${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="上移">
            <MoveUp className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="下移">
            <MoveDown className="w-4 h-4" />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1" title="删除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* 图片地址 / 本地上传 */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-500">图片</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 bg-primary-600/15 hover:bg-primary-600/25 border border-primary-500/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
            >
              <Upload className="w-3 h-3" />
              {uploading ? '导入中...' : '本地上传'}
            </button>
          </div>
          <input
            type="text"
            value={artwork.image}
            onChange={e => { onUpdate('image', e.target.value); setImgError(false); }}
            placeholder="或粘贴图片 URL..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/60 transition-all"
          />
          {artwork.image.trim() && !imgError && (
            <div className="mt-2 rounded-lg overflow-hidden bg-black/30" style={{ maxHeight: '120px' }}>
              <img
                src={artwork.image}
                alt="preview"
                className="w-full h-full object-contain"
                style={{ maxHeight: '120px' }}
                onError={() => setImgError(true)}
              />
            </div>
          )}
          {imgError && (
            <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400 text-xs">
              图片加载失败，请检查 URL 或重新上传
            </div>
          )}
        </div>

        {/* 标题 + 作者 */}
        <div className="md:col-span-2 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">作品标题</label>
            <input
              type="text"
              value={artwork.title}
              onChange={e => onUpdate('title', e.target.value)}
              placeholder="输入作品标题"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/60 transition-all"
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">作者/来源</label>
            <input
              type="text"
              value={artwork.artist}
              onChange={e => onUpdate('artist', e.target.value)}
              placeholder="输入作者名称"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/60 transition-all"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">作品介绍</label>
            <textarea
              value={artwork.description || ''}
              onChange={e => onUpdate('description', e.target.value)}
              placeholder="简要介绍作品的创作背景、主题或艺术特色..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/60 transition-all resize-none"
              maxLength={200}
            />
            <div className="text-gray-700 text-[10px] mt-0.5 text-right">{(artwork.description || '').length}/200</div>
          </div>
        </div>
      </div>
    </div>
  );
}
