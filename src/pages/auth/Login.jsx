import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react'; // <-- Import useEffect
import { toast } from 'sonner';
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { loginSchema } from '../../lib/validators';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../lib/supabase'; 

export default function Login() {
  const login = useAuth((s) => s.login);
  const profile = useAuth((s) => s.profile); // <-- Get the profile from the store
  const nav = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // --- THIS IS THE FIX ---
  // If the user is already logged in (e.g., redirected from Google), send them to the right place.
  useEffect(() => {
    if (profile) {
      const dest =
        profile.role === 'admin'
          ? '/admin'
          : profile.role === 'security_admin'
            ? '/security'
            : '/';
      nav(dest, { replace: true });
    }
  }, [profile, nav]);
  // -----------------------

  async function onSubmit(values) {
    try {
      await login(values.email, values.password);

      // Read the freshly signed-in user's role directly from Supabase.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const dest =
        userProfile?.role === 'admin'
          ? '/admin'
          : userProfile?.role === 'security_admin'
            ? '/security'
            : '/';

      toast.success('Welcome back!');
      nav(dest, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Sign-in failed');
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, 
        scopes: 'https://www.googleapis.com/auth/userinfo.email', // <-- Added scope
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — brand panel */}
      <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 text-white p-12 flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-9 h-9 rounded-xl bg-white text-violet-700 grid place-items-center font-bold">C</span>
            <span className="font-bold text-lg">CampusConnect Market</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight max-w-sm">
            Trade smarter on campus.
          </h1>
          <p className="mt-4 text-violet-100 max-w-sm">
            Buy and sell second-hand textbooks, electronics with
            verified students — all in one place.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-violet-50">
            <Feature icon={ShieldCheck} text="Student-verified accounts" />
            <Feature icon={Sparkles} text="AI-powered price suggestions" />
            <Feature icon={Users} text="Trusted campus community" />
          </ul>
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white grid place-items-center font-bold">C</span>
            <span className="font-bold text-lg text-slate-900">
              CampusConnect <span className="text-violet-600">Market</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Welcome back. Let's get you trading.</p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="btn-outline w-full flex items-center justify-center gap-2 py-2.5 mt-6"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="student@campus.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? (
                'Signing in…'
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-violet-700 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center">
        <Icon size={16} />
      </span>
      {text}
    </li>
  );
}