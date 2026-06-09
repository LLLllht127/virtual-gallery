import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AIAssistant from './components/AIAssistant';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import GalleryPage from './pages/GalleryPage';
import WorkspacePage from './pages/WorkspacePage';
import CreateGalleryPage from './pages/CreateGalleryPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a14]">
        {/* Gallery 页面不显示导航栏（全屏3D展厅） */}
        <Routes>
          <Route path="/gallery/:id" element={<GalleryPage />} />
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/workspace" element={<WorkspacePage />} />
                  <Route path="/create" element={<CreateGalleryPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">404</div>
                        <h2 className="text-2xl font-bold text-white mb-2">页面不存在</h2>
                        <a href="/" className="btn-primary mt-4 inline-block">返回首页</a>
                      </div>
                    </div>
                  } />
                </Routes>
              </>
            }
          />
        </Routes>
        
        {/* 全局 Toast 通知 */}
        <Toast />

        {/* 全局 AI 小助手 */}
        <AIAssistant />
      </div>
    </BrowserRouter>
  );
}
