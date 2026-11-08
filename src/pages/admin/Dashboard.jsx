import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Users, Flag, ShoppingBag, TrendingUp, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAIMetrics, fetchPredictions } from '../../services/ai';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// ─── DATA FETCHING ───
async function fetchStats() {
  const [users, listings, reportsOpen, tx] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('transactions').select('amount, created_at').eq('status', 'completed'),
  ]);

  const revenue = (tx.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return {
    users: users.count ?? 0,
    listings: listings.count ?? 0,
    reportsOpen: reportsOpen.count ?? 0,
    revenue,
    transactions: tx.data ?? []
  };
}

async function fetchCategoryStats() {
  const { data, error } = await supabase.from('listings').select('category').eq('status', 'active');
  if (error) throw error;
  
  const counts = data.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats });
  const { data: categoryData = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: fetchCategoryStats });
  const { data: aiMetrics } = useQuery({ queryKey: ['ai-metrics'], queryFn: fetchAIMetrics, refetchInterval: 60_000 });
  const { data: preds = [] } = useQuery({ queryKey: ['ai-predictions'], queryFn: fetchPredictions, refetchInterval: 60_000 });

  // Chart Data Prep
  const chartData = preds.map((p, i) => ({ ...p, index: i + 1 }));
  
  // Group revenue by day
  const revenueByDay = (data?.transactions ?? []).reduce((acc, tx) => {
    const day = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[day]) acc[day] = 0;
    acc[day] += Number(tx.amount);
    return acc;
  }, {});
  const lineChartData = Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })).reverse();

  // Color palette for pie chart
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of marketplace health and AI performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total users" value={data?.users} icon={Users} loading={isLoading} />
        <KpiCard label="Active listings" value={data?.listings} icon={ShoppingBag} loading={isLoading} />
        <KpiCard label="Open reports" value={data?.reportsOpen} icon={Flag} loading={isLoading} accent="danger" />
        <KpiCard label="Completed volume" value={data ? `M ${data.revenue.toFixed(2)}` : null} icon={TrendingUp} loading={isLoading} />
      </div>

      {/* AI Performance Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-6 md:col-span-1">
          <h2 className="font-semibold text-slate-900 mb-3">Quick actions</h2>
          <div className="flex flex-col gap-2">
            <Link to="/admin/accounts" className="btn-outline text-center w-full">Manage accounts</Link>
            <Link to="/admin/reports" className="btn-outline text-center w-full">Review reports</Link>
          </div>
        </div>

        <div className="card p-6 md:col-span-2 bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="text-violet-600" size={20} /> AI Price Model
            </h2>
          </div>
          {aiMetrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-xs text-slate-500 uppercase">R² Score</p><p className="text-xl font-bold text-slate-900">{aiMetrics.r2?.toFixed(3)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">MAE Error</p><p className="text-xl font-bold text-slate-900">M {aiMetrics.mae?.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Data Points</p><p className="text-xl font-bold text-slate-900">{aiMetrics.n_train?.toLocaleString()}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Status</p>{aiMetrics.saturated ? <p className="text-sm font-bold text-emerald-600 mt-1">✓ Saturated</p> : <p className="text-sm font-bold text-amber-500 mt-1">Improving</p>}</div>
            </div>
          ) : <p className="text-sm text-slate-500">AI service offline.</p>}
        </div>
      </div>

      {/* 3-Column Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Marketplace Revenue Trend</h3>
          <div className="h-[250px]">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [`M ${value}`, 'Revenue']} />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">No revenue data yet</div>}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Listings by Category</h3>
          <div className="h-[250px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">No listings</div>}
          </div>
        </div>
      </div>

      {/* Prediction Errors Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-1">AI Prediction Errors (Sample)</h3>
        <p className="text-xs text-slate-500 mb-4">Each bar represents a test item. Shorter bars mean better predictions.</p>
        <div className="h-[250px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="index" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                  formatter={(value) => [`M ${Number(value).toFixed(2)}`, 'Error']}
                  labelFormatter={(label) => `Test Item #${label}`}
                />
                <Bar dataKey="error" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-slate-400">Waiting for AI data...</div>}
        </div>
      </div>

    </div>
  );
}

function KpiCard({ label, value, icon: Icon, loading, accent }) {
  const isDanger = accent === 'danger' && value > 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`w-8 h-8 rounded-lg grid place-items-center ${isDanger ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600'}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className={`text-2xl font-bold mt-3 ${isDanger ? 'text-red-600' : 'text-slate-900'}`}>
        {loading ? '…' : (value ?? '0')}
      </p>
    </div>
  );
}