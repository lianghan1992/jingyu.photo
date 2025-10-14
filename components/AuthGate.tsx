import React, { useState } from 'react';
import { authenticate } from '../services/api';

const STORAGE_KEY = 'jingyu-today-auth-token';

interface AuthGateProps {
  onAuthenticated: () => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await authenticate(inputCode.trim());
      localStorage.setItem(STORAGE_KEY, token);
      onAuthenticated();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误';
        setError(errorMessage);
        setInputCode('');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-100">璟聿.today</h1>
            <p className="text-slate-400 mt-2">亲友访问通道</p>
        </div>
        <form 
          onSubmit={handleSubmit} 
          className="bg-slate-900 p-8 rounded-2xl shadow-lg"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="access-code" className="sr-only">访问口令</label>
              <input
                id="access-code"
                type="password"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="请输入访问口令"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-lg text-center text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                aria-describedby="error-message"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !inputCode}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '验证中...' : '进入相册'}
            </button>
          </div>
          {error && (
            <p id="error-message" className="text-red-400 text-center text-sm mt-4 animate-fade-in" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthGate;