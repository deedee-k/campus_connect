import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // auth.users
  const [profile, setProfile] = useState(null); // public.profiles
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on reload
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // React to sign in / sign out
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    setProfile(data);
    setLoading(false);
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async ({ email, password, name, studentNumber }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, student_number: studentNumber, role: 'buyer' },
      },
    });
    if (error) throw error;
  };

  const logout = () => supabase.auth.signOut();

  const hasRole = (...roles) => profile && roles.includes(profile.role);

  return (
    <Ctx.Provider value={{ user, profile, loading, login, register, logout, hasRole }}>
      {children}
    </Ctx.Provider>
  );
}