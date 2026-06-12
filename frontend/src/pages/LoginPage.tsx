import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  Users,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Pipeline Tracking', desc: 'Visualize your sales funnel' },
  { icon: Users, title: 'Team Collaboration', desc: 'Role-based access control' },
  { icon: MessageSquare, title: 'WhatsApp Integration', desc: 'Send & track messages' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-600)) 0%, rgb(var(--color-primary-800)) 50%, rgb(var(--color-primary-900)) 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 h-72 w-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 h-96 w-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-white/8 rounded-full blur-2xl animate-pulse-soft" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12 max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white font-display">VisionPlus</span>
              <span className="text-sm text-white/60 block -mt-0.5">CRM System</span>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight font-display">
            Manage customer relationships <span className="text-white/70">effectively</span>
          </h1>
          <p className="text-lg text-white/70 mb-10">
            Streamline your sales pipeline, track leads, and close deals faster.
          </p>
          <div className="space-y-3 stagger-fade">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors duration-200"
              >
                <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-2 text-white/50 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>Trusted by sales teams worldwide</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-500)), rgb(var(--color-primary-700)))' }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 font-display">VisionPlus</span>
              <span className="text-xs text-slate-500 block -mt-0.5">CRM System</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-5">
              <span className="h-1.5 w-1.5 bg-primary-500 rounded-full animate-pulse" />
              Sign In
            </div>
            <h2 className="text-3xl font-bold text-slate-900 font-display">Welcome back</h2>
            <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11 py-3"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                <a href="#" className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 pr-11 py-3"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Visionplus Technologies Pvt.
          </p>
        </div>
      </div>
    </div>
  );
}
