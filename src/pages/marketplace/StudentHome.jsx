import { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { User, MapPin, Phone, AlignLeft, Save, Shield, Store, Clock, MessageSquare, Package } from 'lucide-react';
import { myRoleRequests, requestSellerRole } from '../../services/roleRequests';
import { Link } from 'react-router-dom';

export default function StudentHome() {
  const profile = useAuth((s) => s.profile);
  const loadProfile = useAuth((s) => s.loadProfile);

  // Profile State
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    student_number: profile?.student_number ?? '',
    phone_number: profile?.phone_number ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);

  // Role Request State
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (profile?.role === 'buyer') {
      myRoleRequests().then(setRequests).catch(() => {});
    }
  }, [profile?.role]);

  const pending = requests.find((r) => r.status === 'pending');
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          student_number: form.student_number,
          phone_number: form.phone_number,
          location: form.location,
          bio: form.bio,
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      if (loadProfile) await loadProfile(profile.id);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSeller = async () => {
    setRequesting(true);
    try {
      const req = await requestSellerRole(message);
      setRequests([req, ...requests]);
      setMessage('');
      toast.success('Request sent! An admin will review it soon.');
    } catch (err) {
      toast.error(err.message || 'Could not send request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      
      {/* Profile Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
          {profile?.name?.charAt(0) ?? 'S'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-violet capitalize">{profile?.role}</span>
            {profile?.verified && (
              <span className="badge-emerald flex items-center gap-1">
                <Shield size={12}/> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links (Mobile Shortcuts) */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/transactions" className="card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 grid place-items-center">
            <MessageSquare size={20} />
          </div>
          <span className="text-sm font-medium text-slate-700">My Orders</span>
        </Link>
        
        {isSeller ? (
          <Link to="/seller-orders" className="card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
              <Package size={20} />
            </div>
            <span className="text-sm font-medium text-slate-700">My Sales</span>
          </Link>
        ) : (
          <Link to="/favourites" className="card p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 grid place-items-center">
              <Store size={20} />
            </div>
            <span className="text-sm font-medium text-slate-700">Favourites</span>
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <User size={18} className="text-slate-400"/> Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input 
              className="input" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Student Number</label>
            <input 
              className="input" 
              placeholder="e.g. STU12345"
              value={form.student_number}
              onChange={(e) => setForm({ ...form, student_number: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1"><Phone size={14}/> WhatsApp / Phone</label>
            <input 
              className="input" 
              placeholder="+266 5000 0000"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1"><MapPin size={14}/> Campus Location</label>
            <input 
              className="input" 
              placeholder="e.g. Res 4, Library"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label flex items-center gap-1"><AlignLeft size={14}/> Bio</label>
          <textarea 
            className="input" 
            rows={3}
            placeholder="Tell buyers a bit about yourself..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16}/> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* SELLER REQUEST SECTION */}
      {profile?.role === 'buyer' && (
        <div className="card p-6 border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          {pending ? (
            <div className="flex items-start gap-3">
              <Clock className="text-amber-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900">Seller request pending</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Sent {new Date(pending.created_at).toLocaleDateString()}. An admin will review your request shortly.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 grid place-items-center shrink-0">
                <Store size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Want to sell on campus?</h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Request seller access to start listing your textbooks, electronics, and more.
                </p>
                <textarea
                  rows={2}
                  className="input text-sm mb-3 bg-white"
                  placeholder="Optional: tell the admin what you plan to sell"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={handleRequestSeller} disabled={requesting} className="btn-primary">
                  {requesting ? 'Sending...' : 'Request Seller Access'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}