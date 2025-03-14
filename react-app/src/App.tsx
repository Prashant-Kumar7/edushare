import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import { ChatRoom } from './components/chatRoom';
import ClassRoom from './pages/ClassRoom';
import { UploadSlides } from './components/UploadButton';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadSlides/>} />
        <Route path="/chat" element={<ChatRoom/>} />
        <Route path="/room/:roomId" element={<ClassRoom/>} />
        <Route path="/error/:errorMessage" element={<ClassRoom/>} />
      </Routes>
    </Router>
  );
}

export default App;