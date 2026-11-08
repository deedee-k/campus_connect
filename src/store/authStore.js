import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuth = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    // 1. Listen for auth changes FIRST
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        await get().loadProfile(session.user.id);
      } else {
        set({ profile: null, loading: false });
      }
    });

    // 2. Check initial session (with a tiny delay to let OAuth hashes parse)
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we already got a session from the listener above, skip this
      if (get().user) return; 

      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await get().loadProfile(session.user.id);
      } else {
        set({ loading: false });
      }
    }, 500); // 500ms delay is usually enough for OAuth redirects
  },

  loadProfile: async (uid) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    set({ profile: error ? null : data, loading: false });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  register: async ({ name, email, studentNumber, password, role }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          student_number: studentNumber,
          role: role ?? 'buyer',
        },
      },
    });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  hasRole: (...roles) => {
    const p = get().profile;
    return !!p && roles.includes(p.role);
  },
}));