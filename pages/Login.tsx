import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Fingerprint, Mail, Lock, User, Shield, Sparkles, Network, Users, Zap, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) throw new Error(error);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Network, title: 'Knowledge Graph', description: 'AI-powered evidence mapping' },
    { icon: Fingerprint, title: 'Forensic Analysis', description: 'Deep investigation tools' },
    { icon: Users, title: 'Team Collaboration', description: 'Work together seamlessly' },
    { icon: Zap, title: 'Gemini 3 Pro AI', description: 'Advanced intelligence' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex animate-gradient bg-gradient-to-br from-slate-950 via-cyan-900 to-blue-950">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-orb"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-orb" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-orb" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-orb" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 p-12 relative z-10">
        <div className="flex flex-col justify-between w-full text-white animate-fade-in">
          {/* Logo and Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-8 animate-float">
              <div className="w-14 h-14 glass-strong rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl animate-glow p-2">
                <Logo className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-2xl font-bold drop-shadow-lg">SOLARIS FORENSIC</h1>
                <p className="text-white/90 text-sm drop-shadow">Intelligence Analysis Platform</p>
              </div>
            </div>

            <div className="space-y-4 mt-16">
              <h2 className="text-5xl font-bold leading-tight drop-shadow-lg">
                Uncover Truth<br />Through Intelligence
              </h2>
              <p className="text-white/90 text-lg max-w-md drop-shadow">
                Advanced forensic analysis powered by Gemini 3 Pro AI. Map evidence, discover connections, and solve complex cases.
              </p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-6 mt-16">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group glass-strong rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <feature.icon className="w-8 h-8 mb-3 text-white group-hover:scale-110 transition-transform drop-shadow-lg animate-glow" />
                <h3 className="font-semibold text-white mb-1 drop-shadow">{feature.title}</h3>
                <p className="text-sm text-white/80 drop-shadow">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in animate-float-slow">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 glass-strong rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl animate-glow p-2">
              <Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">SOLARIS FORENSIC</h1>
          </div>

          {/* Glassmorphic Card */}
          <div className="glass-strong rounded-3xl p-8 border border-white/30 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4 border border-white/40 shadow-xl animate-glow">
                <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {isSignUp ? 'Create Account' : 'Secure Access'}
              </h2>
              <p className="text-white/90 drop-shadow">
                {isSignUp ? 'Join the forensic intelligence network' : 'Continue your investigation'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 glass rounded-xl animate-shake border border-red-300/50 shadow-lg shadow-red-500/20">
                <p className="text-white font-medium drop-shadow">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white drop-shadow">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3.5 glass border border-white/30 rounded-xl text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none transition-all duration-300 shadow-lg backdrop-blur-xl"
                    placeholder="johndoe"
                    required={isSignUp}
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white drop-shadow">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 drop-shadow" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 glass border border-white/30 rounded-xl text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none transition-all duration-300 shadow-lg backdrop-blur-xl"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white drop-shadow">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 drop-shadow" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 glass border border-white/30 rounded-xl text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none transition-all duration-300 shadow-lg backdrop-blur-xl"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-white/70 mt-1 drop-shadow">Minimum 6 characters</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/40 flex items-center justify-center gap-2 backdrop-blur-xl hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin drop-shadow" />
                    <span className="drop-shadow">Please wait...</span>
                  </>
                ) : (
                  <span className="drop-shadow">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            </form>

            {/* Toggle Sign Up/In */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-white hover:text-white/80 font-semibold text-sm transition-colors drop-shadow hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-white/80 text-sm drop-shadow">
            Powered by Gemini 3 Pro AI • Secure Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
