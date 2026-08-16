import { Mail, Lock, ArrowRight, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useApp } from '../lib/context';

export default function Login() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let success = false;
      
      if (isLogin) {
        success = await actions.login(formData.email, formData.password);
      } else {
        success = await actions.signup(formData.email, formData.password, formData.name);
      }

      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
    });
    setErrors({});
    actions.clearError();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-20">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/5 border border-slate-100"
      >
        <div className="text-center mb-8 md:mb-10">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base">
            {isLogin ? 'Sign in to your digital horizon.' : 'Start your journey with TripVerse.'}
          </p>
        </div>

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-4">Name</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="text" 
                  name="name"
                  placeholder="John Doe" 
                  className={`w-full bg-slate-50 border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 transition-all ${
                    errors.name ? 'ring-2 ring-red-500' : ''
                  }`}
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs ml-4">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input 
                type="email" 
                name="email"
                placeholder="alex@example.com" 
                className={`w-full bg-slate-50 border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 transition-all ${
                  errors.email ? 'ring-2 ring-red-500' : ''
                }`}
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs ml-4">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                placeholder="••••••••" 
                className={`w-full bg-slate-50 border-none rounded-full py-4 pl-14 pr-12 focus:ring-2 focus:ring-primary/20 transition-all ${
                  errors.password ? 'ring-2 ring-red-500' : ''
                }`}
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs ml-4">{errors.password}</p>}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-4">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="••••••••" 
                  className={`w-full bg-slate-50 border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 transition-all ${
                    errors.confirmPassword ? 'ring-2 ring-red-500' : ''
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs ml-4">{errors.confirmPassword}</p>}
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot Password?</a>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 btn-primary shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Processing...' : (isLogin ? 'Continue' : 'Create Account')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="relative my-10 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <span className="relative bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            className="flex items-center justify-center gap-3 py-3 rounded-full border border-slate-100 hover:bg-slate-50 transition-all font-semibold text-sm"
            onClick={() => console.log('Google login')}
          >
            <Chrome className="w-4 h-4" />
            Google
          </button>
          <button 
            type="button"
            className="flex items-center justify-center gap-3 py-3 rounded-full border border-slate-100 hover:bg-slate-50 transition-all font-semibold text-sm"
            onClick={() => console.log('GitHub login')}
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>
        </div>

        <p className="mt-10 text-center text-sm text-on-surface-variant">
          {isLogin ? 'New to TripVerse?' : 'Already have an account?'}{' '}
          <button 
            onClick={toggleMode}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </main>
  );
}
