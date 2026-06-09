import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-2xl animate-float">
            🏛
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            关于<span className="gradient-text">虚拟展厅平台</span>
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto">
            我们相信每一件作品都值得被看见，每一个创作者都能拥有属于自己的三维展览空间。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            { icon: '🎯', title: '我们的使命', content: '让3D虚拟展览技术触手可及，帮助艺术家、教育工作者、企业等各类创作者以最低门槛创建专业级展示空间。' },
            { icon: '🌟', title: '我们的愿景', content: '构建全球最大的在线虚拟展厅生态，让每一件作品都能超越物理空间的限制，到达世界上任何一个角落。' },
            { icon: '🔧', title: '技术驱动', content: '基于 WebGL / Three.js 技术，无需安装任何插件，在普通浏览器中即可实现流畅的3D渲染与第一人称漫游。' },
            { icon: '🤝', title: '开放生态', content: '支持多种内容格式导入，提供 SDK 与 API 接口，让开发者能将3D展厅能力嵌入到自己的产品中。' },
          ].map((item, i) => (
            <div key={i} className="card-glass p-6 rounded-2xl">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>

        {/* 技术栈 */}
        <div className="card-glass rounded-2xl p-8 mb-10">
          <h2 className="text-white font-bold text-xl mb-6 text-center">技术栈</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['React 18', 'Vite', 'Three.js', '@react-three/fiber', '@react-three/drei', 'Zustand', 'TailwindCSS', 'React Router'].map(tech => (
              <span key={tech} className="bg-primary-600/20 border border-primary-500/30 text-primary-300 px-3 py-1.5 rounded-full text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/templates" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            探索展厅样本库
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
