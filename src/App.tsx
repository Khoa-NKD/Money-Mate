import { useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

export default function App() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const isEnvConfigured =
    supabaseUrl !== '' && !supabaseUrl.includes('your-project-id')

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Test basic query to supabase auth session
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setTestResult(`Lỗi kiểm tra: ${error.message}`)
      } else {
        setTestResult(
          `Kết nối Supabase Client thành công! (Session: ${data.session ? 'Active' : 'Chưa đăng nhập'})`
        )
      }
    } catch (err) {
      setTestResult(
        `Lỗi ngoại lệ: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mm-container">
      {/* Header */}
      <header className="mm-header">
        <div className="mm-logo-badge">
          <span className="mm-logo-icon">💰</span>
          <span className="mm-logo-text">MoneyMate</span>
        </div>
        <p className="mm-subtitle">
          Nền tảng Quản lý Tài chính Cá nhân Hiện đại &amp; Thông minh
        </p>
      </header>

      {/* Main Status Grid */}
      <main className="mm-main">
        {/* Supabase Status Card */}
        <div className="mm-card mm-status-card">
          <div className="mm-card-header">
            <h3>Trạng Thái Supabase Client</h3>
            <span
              className={`mm-badge ${isEnvConfigured ? 'badge-success' : 'badge-warning'}`}
            >
              {isEnvConfigured ? 'Đã Cấu Hình' : 'Placeholder Config'}
            </span>
          </div>
          <div className="mm-card-body">
            <div className="mm-info-row">
              <span className="mm-info-label">Client Instance:</span>
              <span className="mm-info-value mm-code">
                {supabase ? 'Đã khởi tạo (src/lib/supabase.ts)' : 'Chưa khởi tạo'}
              </span>
            </div>
            <div className="mm-info-row">
              <span className="mm-info-label">VITE_SUPABASE_URL:</span>
              <span className="mm-info-value mm-code">
                {supabaseUrl || '(Chưa cấu hình)'}
              </span>
            </div>
            <div className="mm-info-row">
              <span className="mm-info-label">VITE_SUPABASE_ANON_KEY:</span>
              <span className="mm-info-value mm-code">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : '(Chưa cấu hình)'}
              </span>
            </div>

            <div className="mm-test-action">
              <button
                className="mm-btn mm-btn-primary"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? 'Đang kiểm tra...' : 'Kiểm tra Supabase Client'}
              </button>
              {testResult && (
                <div
                  className={`mm-test-result ${
                    testResult.includes('Lỗi') ? 'result-error' : 'result-success'
                  }`}
                >
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Architecture Checklist */}
        <div className="mm-card">
          <div className="mm-card-header">
            <h3>Cấu Trúc Thư Mục Chuẩn MoneyMate</h3>
            <span className="mm-badge badge-info">100% Hoàn Tất</span>
          </div>
          <div className="mm-checklist">
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>index.html</strong>
                <p>Entry HTML mount React App</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>package.json</strong>
                <p>Khai báo dependencies + @supabase/supabase-js</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>tsconfig.json &amp; vite.config.ts</strong>
                <p>Cấu hình TypeScript và trình đóng gói Vite</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>.env &amp; .env.example</strong>
                <p>Biến môi trường VITE_SUPABASE_URL và ANON_KEY</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>src/lib/supabase.ts</strong>
                <p>Khởi tạo Supabase client dùng chung toàn dự án</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mm-footer">
        <p>
          MoneyMate • Sẵn sàng để phát triển các tính năng quản lý chi tiêu và ngân sách!
        </p>
      </footer>
    </div>
  )
}
