import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles, Star, ChevronRight } from 'lucide-react';
import { GALLERY_TEMPLATES } from '../data/galleries';

// 粒子背景
function ParticlesBg() {
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 4 + 2;
      el.className = 'particle';
      el.style.cssText = `
        width:${size}px;height:${size}px;
        left:${Math.random() * 100}%;
        bottom:${Math.random() * -20}%;
        background:rgba(${Math.random() > 0.5 ? '99,102,241' : '236,72,153'},${Math.random() * 0.4 + 0.1});
        animation-duration:${Math.random() * 10 + 8}s;
        animation-delay:${Math.random() * 5}s;
      `;
      container.appendChild(el);
      particles.push(el);
    }
    return () => particles.forEach(p => p.remove());
  }, []);
  return <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />;
}

// 统计数字卡片
function StatCard({ value, label, icon }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

// 特性卡片
function FeatureCard({ icon, title, desc, delay = 0 }) {
  return (
    <div
      className="card-glass p-6 rounded-2xl hover:border-primary-500/40 transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// 用户评价
const REVIEWS = [
  { name: '王老师', role: '高中美术教师', avatar: '👩‍🏫', content: '用了虚拟展厅平台之后，我们学校的美术展览终于走进了"云端"！家长们都说太棒了，参与度提升了好几倍。', rating: 5 },
  { name: '陈建国', role: '独立艺术家', avatar: '🎨', content: '不需要任何编程技术，三步就做好了一个专业级的3D展厅，感觉就像有了自己的线上画廊。', rating: 5 },
  { name: '李雨桐', role: '某科技公司市场总监', avatar: '💼', content: '用来做产品展示，客户反馈非常好，转化率比以前的图文介绍高了约 40%！', rating: 5 },
  { name: '张明轩', role: '博物馆策展人', avatar: '🏛', content: '文物数字化展示的最优解。我们把馆藏搬上了云端，让更多人能看到这些珍贵文物。', rating: 5 },
];

// 三步骤流程
const STEPS = [
  { num: '01', icon: '🖼', title: '选择模板', desc: '从精心设计的样本库中选择风格，涵盖艺术、商业、教育、文化等多种场景' },
  { num: '02', icon: '📤', title: '上传作品', desc: '拖拽上传您的图片、视频等媒体内容，AI 自动排版优化展示效果' },
  { num: '03', icon: '🔗', title: '发布分享', desc: '一键生成专属链接，支持复制到任意浏览器访问，也可嵌入您的网站' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticlesBg />
        
        {/* 渐变背景光晕 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
          {/* 标签 */}
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-8">
            <Sparkles className="w-4 h-4" />
            全新 3D 沉浸式展厅体验
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            让每件作品<br />
            <span className="gradient-text">活在三维空间</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            无需编程，3 步即可创建沉浸式 3D 虚拟展厅。支持自由漫游、作品详情查看，
            生成专属链接一键分享给全世界。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/templates" className="btn-primary flex items-center gap-2 text-base px-8 py-4 animate-glow">
              免费创建展厅
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/gallery/gallery-art-01" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
              <Play className="w-5 h-5" />
              在线体验 Demo
            </Link>
          </div>
          
          {/* 统计 */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <StatCard value="12K+" label="已创建展厅" icon="🏛" />
            <StatCard value="50万+" label="访问人次" icon="👁" />
            <StatCard value="4.9★" label="用户评分" icon="⭐" />
          </div>
        </div>
        
        {/* 展厅预览卡片 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 pointer-events-none">
          <div className="relative h-32 overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
            <div className="flex gap-4 animate-marquee">
              {GALLERY_TEMPLATES.concat(GALLERY_TEMPLATES).map((t, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-28 rounded-xl overflow-hidden opacity-40">
                  <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 三步流程 */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">3 步创建专业展厅</h2>
            <p className="section-subtitle">无需任何技术背景，人人都是策展人</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="card-glass p-8 rounded-3xl hover:border-primary-500/40 transition-all duration-300 h-full">
                  <div className="text-6xl font-black text-primary-600/20 mb-4">{step.num}</div>
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-gray-600">
                    <ChevronRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/templates" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
              立即开始
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 特性 */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">为什么选择虚拟展厅平台</h2>
            <p className="section-subtitle">专业功能，零门槛使用</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="🎮" title="自由漫游体验" desc="第一人称视角，WASD 键盘移动 + 鼠标转向，沉浸感媲美专业 3D 游戏" />
            <FeatureCard icon="🔗" title="一键分享链接" desc="自动生成专属展厅 URL，无需登录即可在任意浏览器访问，可直接分享到微信、微博" delay={100} />
            <FeatureCard icon="🎨" title="丰富样本库" desc="覆盖艺术、商业、教育、文化等场景的精美模板，一键套用直接使用" delay={200} />
            <FeatureCard icon="📱" title="全端适配" desc="响应式设计，自动适配手机、平板、电脑，确保最佳浏览体验" delay={300} />
            <FeatureCard icon="🖼" title="作品信息展示" desc="悬停展示作品标题、艺术家信息，点击查看详情，还可关联外部购买链接" delay={400} />
            <FeatureCard icon="🆓" title="基础功能永久免费" desc="免费版即可完整发布和分享展厅，付费版解锁品牌定制、去水印等高级功能" delay={500} />
          </div>
        </div>
      </section>

      {/* 案例展示 */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">精选展厅案例</h2>
            <p className="section-subtitle">来自各行各业的创作者</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_TEMPLATES.map(template => (
              <Link
                key={template.id}
                to={`/gallery/${template.id}`}
                className="template-card card-glass rounded-2xl overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-primary-600/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {template.categoryLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm">{template.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/templates" className="btn-secondary inline-flex items-center gap-2">
              查看全部样本库
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">用户说</h2>
            <p className="section-subtitle">来自真实用户的反馈</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="card-glass p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{r.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{r.name}</span>
                      <span className="text-gray-500 text-sm">· {r.role}</span>
                    </div>
                    <div className="flex mb-3">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">"{r.content}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">常见问题</h2>
          </div>
          {[
            { q: '是否免费使用？', a: '是的，基础功能完全免费。您可以免费创建并发布展厅，付费版本解锁品牌定制、去水印、自定义域名等高级功能。' },
            { q: '分享的链接在哪里能打开？', a: '生成的展厅链接可以在任意现代浏览器中打开，无需登录账号。支持 Chrome、Firefox、Safari、Edge 等主流浏览器，手机浏览器同样可以访问。' },
            { q: '与普通 VR 全景有什么区别？', a: '普通 VR 全景只能站在固定点环顾四周，而虚拟展厅平台是真正的 3D 空间，您可以在展厅内自由行走、靠近观察每件展品，体验感完全不同。' },
            { q: '我的展厅会永久保存吗？', a: '免费版展厅会永久保存，不会因为不续费而被删除。我们承诺您的创作成果不会无故丢失。' },
          ].map((faq, i) => (
            <details key={i} className="mb-4 card-glass rounded-2xl overflow-hidden group">
              <summary className="p-6 cursor-pointer text-white font-medium flex items-center justify-between list-none hover:bg-white/5 transition-colors">
                {faq.q}
                <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative card-glass rounded-3xl p-12 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              准备好创建您的<span className="gradient-text">专属展厅</span>了吗？
            </h2>
            <p className="text-gray-400 mb-8">加入 12000+ 创作者，把您的作品带入三维世界</p>
            <Link to="/templates" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              免费开始
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-sm">🏛</span>
              </div>
              <span className="font-bold text-white">虚拟展厅平台</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">首页</Link>
              <Link to="/templates" className="hover:text-white transition-colors">样本库</Link>
              <Link to="/workspace" className="hover:text-white transition-colors">工作台</Link>
              <Link to="/about" className="hover:text-white transition-colors">关于我们</Link>
            </div>
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} 虚拟展厅平台. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
