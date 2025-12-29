import { Package, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * OAuth Login/Signup Page
 * Provides login and signup options using Auth0
 */
const Login = () => {
  const { login, signup, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-200">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">ZeroERP</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <Package className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ZeroERP</h1>
              <p className="text-slate-600">
                Streamline your business operations with our lightweight ERP solution
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600">{error.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => login()}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>

              <button
                onClick={() => signup()}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-indigo-600 font-semibold rounded-xl border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5" />
                Sign Up
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">Secure OAuth Authentication</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600">100%</p>
                <p className="text-xs text-slate-500 mt-1">Secure Login</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600">SSO</p>
                <p className="text-xs text-slate-500 mt-1">Single Sign-On</p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm text-slate-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-slate-500">
        <p>&copy; 2024 ZeroERP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
