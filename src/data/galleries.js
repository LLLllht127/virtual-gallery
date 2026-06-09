// 展厅样本数据库
export const GALLERY_TEMPLATES = [
  {
    id: 'gallery-art-01',
    name: '现代艺术画廊',
    category: 'art',
    categoryLabel: '艺术',
    description: '简约白色空间，适合展示当代艺术品与摄影作品',
    thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80',
    tags: ['艺术', '摄影', '当代'],
    roomColor: '#f8f9fa',
    wallColor: '#ffffff',
    floorColor: '#e9ecef',
    spotlightColor: '#fff5e0',
    spotCount: 5,
    artworks: [
      { id: 'aw1', title: '星空之境', artist: '王晓明', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'aw2', title: '城市印象', artist: '李梦溪', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'aw3', title: '自然之声', artist: '张宇飞', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'aw4', title: '海洋深处', artist: '陈静怡', image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80', x: -3, z: -6, wall: 'back' },
      { id: 'aw5', title: '生命之树', artist: '林雨晴', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80', x: 3, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-biz-01',
    name: '企业品牌展馆',
    category: 'business',
    categoryLabel: '商业',
    description: '专业深色调空间，适合企业产品与品牌形象展示',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    tags: ['商业', '产品', '品牌'],
    roomColor: '#e5e5f0',
    wallColor: '#ecf0f8',
    floorColor: '#c6dcf6',
    spotlightColor: '#4361ee',
    spotCount: 4,
    artworks: [
      { id: 'bw1', title: '智能终端 X1', artist: '产品团队', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'bw2', title: '未来出行概念', artist: '设计中心', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'bw3', title: '绿色能源方案', artist: '研发部', image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'bw4', title: '2025 年度报告', artist: '战略部', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', x: 0, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-culture-01',
    name: '传统文化博物馆',
    category: 'culture',
    categoryLabel: '文化',
    description: '古典庄重的展示空间，适合文物、非遗和传统艺术',
    thumbnail: 'https://images.unsplash.com/photo-1583225214464-9296029427aa?w=600&q=80',
    tags: ['文化', '博物馆', '非遗'],
    roomColor: '#ffefd6',
    wallColor: '#fff4e5',
    floorColor: '#ffe3bd',
    spotlightColor: '#c9a96e',
    spotCount: 4,
    artworks: [
      { id: 'cw1', title: '青花瓷系列', artist: '景德镇陶艺', image: 'https://images.unsplash.com/photo-1569180880150-df4eed93c90b?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'cw2', title: '汉字演变', artist: '书法研究院', image: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'cw3', title: '丝绸之路', artist: '历史博物馆', image: 'https://images.unsplash.com/photo-1585399000684-d2f72660f092?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'cw4', title: '民族服饰展', artist: '民族文化馆', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400&q=80', x: 0, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-fashion-01',
    name: '时尚设计展',
    category: 'business',
    categoryLabel: '时尚',
    description: '粉紫渐变空间，尽显时尚与创意的完美结合',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    tags: ['时尚', '设计', '服装'],
    roomColor: '#eae4f1',
    wallColor: '#f2eef6',
    floorColor: '#dad0ec',
    spotlightColor: '#e040fb',
    spotCount: 4,
    artworks: [
      { id: 'fw1', title: '2025 春夏系列', artist: '陈雅菲', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'fw2', title: '未来主义结构', artist: '刘雨萌', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'fw3', title: '东方美学', artist: '孙晓彤', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'fw4', title: '极简主义', artist: '唐奕颖', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80', x: 0, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-realestate-01',
    name: '房地产展厅',
    category: 'business',
    categoryLabel: '地产',
    description: '金色典雅空间，适合楼盘展示、样板间设计、建筑方案',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    tags: ['房地产', '建筑', '设计'],
    roomColor: '#efeae6',
    wallColor: '#f6f2ef',
    floorColor: '#eededd',
    spotlightColor: '#f59e0b',
    spotCount: 4,
    artworks: [
      { id: 'rw1', title: '城央花园项目', artist: '设计一部', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'rw2', title: '海滨别墅概念', artist: '建筑工作室', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'rw3', title: '生态社区规划', artist: '城市规划部', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'rw4', title: '精装样板间', artist: '室内设计部', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80', x: 0, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-nature-01',
    name: '自然生态展',
    category: 'education',
    categoryLabel: '自然',
    description: '森林绿调空间，沉浸式自然氛围，适合动植物、环保主题',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    tags: ['自然', '生态', '环保'],
    roomColor: '#e5f0e5',
    wallColor: '#eef6ee',
    floorColor: '#d5e7d5',
    spotlightColor: '#4ade80',
    spotCount: 5,
    artworks: [
      { id: 'nw1', title: '热带雨林', artist: '自然摄影师', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'nw2', title: '候鸟迁飞', artist: '鸟类学会', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'nw3', title: '海洋生物图鉴', artist: '海洋研究中心', image: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'nw4', title: '极地生态链', artist: '极地科考队', image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=400&q=80', x: -3, z: -6, wall: 'back' },
      { id: 'nw5', title: '野生植物图谱', artist: '植物研究所', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', x: 3, z: -6, wall: 'back' },
    ]
  },
  {
    id: 'gallery-auto-01',
    name: '汽车概念展厅',
    category: 'business',
    categoryLabel: '汽车',
    description: '工业风格，金属质感，适合汽车、机车、零部件展示',
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80',
    tags: ['汽车', '机械', '工业'],
    roomColor: '#ebebeb',
    wallColor: '#f2f2f2',
    floorColor: '#dedede',
    spotlightColor: '#eab308',
    spotCount: 4,
    artworks: [
      { id: 'aw1', title: '概念超跑 X-9', artist: '设计中心', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80', x: -3, z: 0, wall: 'front' },
      { id: 'aw2', title: '智能座舱方案', artist: '人机交互部', image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=80', x: 0, z: 0, wall: 'front' },
      { id: 'aw3', title: '新能源动力系统', artist: '动力研究院', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80', x: 3, z: 0, wall: 'front' },
      { id: 'aw4', title: '轻量化材料', artist: '材料工程部', image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&q=80', x: 0, z: -6, wall: 'back' },
    ]
  },
];

export const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'art', label: '艺术摄影' },
  { id: 'business', label: '商业品牌' },
  { id: 'education', label: '教育展示' },
  { id: 'culture', label: '文化博物' },
];

export const ARTWORK_SLOTS = [
  { wall: 'front', x: -4, z: 0 },
  { wall: 'front', x: -1.5, z: 0 },
  { wall: 'front', x: 1.5, z: 0 },
  { wall: 'front', x: 4, z: 0 },
  { wall: 'back', x: -4, z: -6 },
  { wall: 'back', x: 0, z: -6 },
  { wall: 'back', x: 4, z: -6 },
  { wall: 'left', x: -3, z: -6 },
  { wall: 'left', x: 1, z: -6 },
  { wall: 'right', x: -3, z: -6 },
  { wall: 'right', x: 1, z: -6 },
];

// ============================================================
// 分享链接：使用 lz-string 压缩，数据放在 hash 查询参数中
// ============================================================
import LZString from 'lz-string';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80';

function serializeGallery(gallery) {
  return {
    id: gallery.id,
    name: gallery.name,
    description: gallery.description || '',
    category: gallery.category,
    categoryLabel: gallery.categoryLabel,
    roomColor: gallery.roomColor,
    wallColor: gallery.wallColor,
    floorColor: gallery.floorColor,
    spotlightColor: gallery.spotlightColor,
    spotCount: gallery.spotCount || 4,
    tags: gallery.tags || [],
    createdAt: gallery.createdAt,
    thumbnail: gallery.thumbnail,
    artworks: (gallery.artworks || []).map(a => ({
      id: a.id,
      title: a.title,
      artist: a.artist,
      description: a.description || '',
      image: a.image,
      x: a.x,
      z: a.z,
      wall: a.wall,
    })),
  };
}

export function generateGalleryUrl(gallery) {
  const base = window.location.origin + window.location.pathname;
  try {
    const slim = serializeGallery(gallery);
    // 计算总图片大小，给用户提示
    let totalImageSize = 0;
    let imageCount = 0;
    for (const aw of slim.artworks) {
      if (aw.image && aw.image.startsWith('data:')) {
        totalImageSize += aw.image.length;
        imageCount++;
      }
    }
    if (totalImageSize > 200000) {
      console.warn('[generateGalleryUrl] 本地图片总大小较大（共 ' + totalImageSize + ' 字符 / ' + imageCount + ' 张），建议使用网络图片链接以获得更稳定的分享链接。');
    }
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(slim));
    const fullUrl = `${base}#/gallery/${gallery.id}?d=${compressed}`;
    console.log('[generateGalleryUrl] 生成链接长度: ' + fullUrl.length + ' 字符, 作品数: ' + slim.artworks.length);
    return fullUrl;
  } catch (e) {
    console.warn('[generateGalleryUrl] 编码失败，回退到基础链接:', e);
    return `${base}#/gallery/${gallery.id}`;
  }
}

export function decodeGalleryFromUrl() {
  try {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx < 0) return null;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const encoded = params.get('d');
    if (!encoded) return null;
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) {
      console.warn('[decodeGalleryFromUrl] lz-string 解压返回空字符串，URL 数据可能已损坏');
      return null;
    }
    const parsed = JSON.parse(json);
    // 验证必要字段
    if (!parsed.id || !Array.isArray(parsed.artworks)) {
      console.warn('[decodeGalleryFromUrl] 数据结构不完整:', { id: parsed.id, hasArtworks: Array.isArray(parsed.artworks) });
      return null;
    }
    console.log('[decodeGalleryFromUrl] 成功解码展厅:', parsed.id, '- 作品数:', parsed.artworks.length);
    return parsed;
  } catch (e) {
    console.warn('[decodeGalleryFromUrl] 解码失败:', e);
    return null;
  }
}

export function getTemplateById(id) {
  return GALLERY_TEMPLATES.find(t => t.id === id) || null;
}

const USER_GALLERIES_KEY = 'virtual_gallery_user_galleries';

export function getUserGalleries() {
  try {
    const data = localStorage.getItem(USER_GALLERIES_KEY);
    const list = data ? JSON.parse(data) : [];
    const fallback = window.__virtualGalleryFallback || [];
    const merged = [...list];
    for (const g of fallback) {
      if (!merged.find(m => m.id === g.id)) merged.push(g);
    }
    return merged;
  } catch { return window.__virtualGalleryFallback || []; }
}

export function saveUserGallery(gallery) {
  const list = getUserGalleries();
  const idx = list.findIndex(g => g.id === gallery.id);
  if (idx >= 0) {
    list[idx] = gallery;
  } else {
    list.push(gallery);
  }
  const json = JSON.stringify(list);
  try {
    localStorage.setItem(USER_GALLERIES_KEY, json);
    return gallery;
  } catch (e) {
    console.warn('[saveUserGallery] 直接保存失败，尝试降级:', e.message);
  }
  try {
    const singleJson = JSON.stringify([gallery]);
    localStorage.setItem(USER_GALLERIES_KEY, singleJson);
    console.log('[saveUserGallery] 降级保存成功（仅保留当前展厅）');
    return gallery;
  } catch (e2) {
    console.warn('[saveUserGallery] 降级也失败:', e2.message);
  }
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key !== USER_GALLERIES_KEY) {
        try { localStorage.removeItem(key); } catch {}
      }
    }
    localStorage.setItem(USER_GALLERIES_KEY, JSON.stringify([gallery]));
    console.log('[saveUserGallery] 清空其他数据后保存成功');
    return gallery;
  } catch (e3) {
    console.error('[saveUserGallery] localStorage 完全不可用:', e3);
    window.__virtualGalleryFallback = window.__virtualGalleryFallback || [];
    const fb = window.__virtualGalleryFallback;
    const fbIdx = fb.findIndex(g => g.id === gallery.id);
    if (fbIdx >= 0) fb[fbIdx] = gallery; else fb.push(gallery);
    return gallery;
  }
}

export function deleteUserGallery(id) {
  const list = getUserGalleries().filter(g => g.id !== id);
  localStorage.setItem(USER_GALLERIES_KEY, JSON.stringify(list));
  return list;
}

export function getGalleryById(id) {
  // 1. 优先使用 URL 中的数据（分享链接的权威来源）
  const embedded = decodeGalleryFromUrl();
  if (embedded && embedded.id === id) {
    console.log('[getGalleryById] 使用 URL 内嵌数据, id:', id);
    return embedded;
  }
  // 2. 然后是用户本地保存的展厅
  const userGallery = getUserGalleries().find(g => g.id === id);
  if (userGallery) {
    console.log('[getGalleryById] 使用本地存储, id:', id);
    return userGallery;
  }
  // 3. 最后是模板
  const tpl = GALLERY_TEMPLATES.find(t => t.id === id);
  if (tpl) {
    console.log('[getGalleryById] 使用模板, id:', id);
  } else {
    console.warn('[getGalleryById] 未找到展厅, id:', id);
  }
  return tpl || null;
}

export function generateGalleryId() {
  return 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
