import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import CreateClassroomPage from './pages/CreateClassroomPage.jsx'
import JoinClassroomPage from './pages/JoinClassroomPage.jsx'
import ClassroomPage from './pages/ClassroomPage.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateClassroomPage />} />
          <Route path="/join" element={<JoinClassroomPage />} />
          <Route path="/classroom/:roomCode" element={<ClassroomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  )
}
