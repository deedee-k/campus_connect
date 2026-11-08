import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, ShoppingBag, Store } from 'lucide-react';
import { registerSchema } from '../../lib/validators';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const signUp = useAuth((s) => s.register);
  const nav = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  });

  const selectedRole = watch('role');

  async function onSubmit(values) {
    try {
      await signUp(values);
      toast.success('Account created. You can sign in now.');
      nav('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/userinfo.email', // <-- Forces Google to share the email
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border p-6 w-full max-w-md space-y-4 shadow-sm"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-indigo-600">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">It's free. Choose how you want to start.</p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-outline w-full flex items-center justify-center gap-2 py-2.5"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">Or register with email</span>
          </div>
        </div>

        {[
          ['name', 'Full name', 'text', 'Rosalie Mokoena'],
          ['email', 'Student email', 'email', 'you@campus.edu'],
          ['studentNumber', 'Student number', 'text', 'STU12345'],
          ['password', 'Password (min 6 chars)', 'password', ''],
        ].map(([k, label, type, ph]) => (
          <div key={k}>
            <label className="text-sm font-medium">{label}</label>
            <input
              type={type}
              {...register(k)}
              placeholder={ph}
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
            {errors[k] && (
              <p className="text-xs text-red-600 mt-1">{errors[k].message}</p>
            )}
          </div>
        ))}

        {/* Role selection */}
        <div>
          <label className="text-sm font-medium block mb-2">
            What do you want to do?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selectedRole === 'buyer'
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-slate-200 hover:border-violet-300'
              }`}
            >
              <input
                type="radio"
                value="buyer"
                {...register('role')}
                className="sr-only"
              />
              <ShoppingBag
                size={20}
                className={selectedRole === 'buyer' ? 'text-violet-600' : 'text-slate-400'}
              />
              <p className="font-medium text-slate-900 mt-2 text-sm">Just browse</p>
              <p className="text-xs text-slate-500 mt-1">
                Buy items from other students.
              </p>
            </label>

            <label
              className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selectedRole === 'seller'
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-slate-200 hover:border-violet-300'
              }`}
            >
              <input
                type="radio"
                value="seller"
                {...register('role')}
                className="sr-only"
              />
              <Store
                size={20}
                className={selectedRole === 'seller' ? 'text-violet-600' : 'text-slate-400'}
              />
              <p className="font-medium text-slate-900 mt-2 text-sm">Buy and sell</p>
              <p className="text-xs text-slate-500 mt-1">
                Post items for sale too.
              </p>
            </label>
          </div>
          {errors.role && (
            <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? 'Creating…' : (<>Create account <ArrowRight size={16} /></>)}
        </button>

        <p className="text-sm text-center text-slate-600 pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}