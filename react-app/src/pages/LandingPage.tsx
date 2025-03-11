import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, PenTool } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduShare</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/signin" className="text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link to="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Transform Your</span>
              <span className="block text-blue-600">Teaching Experience</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Create virtual classrooms, share interactive notes, and engage with students in real-time.
              The perfect platform for modern educators.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <Link
                to="/auth/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="mt-24">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Users className="h-12 w-12 text-blue-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Virtual Classrooms</h3>
                <p className="mt-2 text-gray-500">Create and manage multiple classrooms for different subjects or courses.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <BookOpen className="h-12 w-12 text-blue-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Interactive Notes</h3>
                <p className="mt-2 text-gray-500">Upload and share notes with your students in real-time.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <PenTool className="h-12 w-12 text-blue-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Drawing Tools</h3>
                <p className="mt-2 text-gray-500">Annotate and explain concepts with built-in drawing tools.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;