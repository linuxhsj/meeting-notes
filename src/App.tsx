import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import RecordPage from './pages/RecordPage'
import NotesPage from './pages/NotesPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-white">
        {/* 左侧导航 */}
        <nav className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎙</span>
              <span className="font-semibold text-sm text-text-primary">AI 会议纪要</span>
            </div>
          </div>
          {/* Nav Items */}
          <div className="flex-1 py-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-gray-100'
                }`
              }
            >
              <span>🎤</span> 录制
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-gray-100'
                }`
              }
            >
              <span>📂</span> 历史记录
            </NavLink>
          </div>
          {/* 底部设置 */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
              <span>v1.0.0</span>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<RecordPage />} />
            <Route path="/notes/:id" element={<NotesPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
