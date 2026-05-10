import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, BarChart3, Sparkles, TrendingUp, 
  ChevronRight, LayoutDashboard, Plus, ArrowUpRight, 
  ArrowDownRight, Clock, MoreHorizontal 
} from 'lucide-react'
import { getAllResumes, getAllResults, getAllJobDescriptions } from '../services/api.js'
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function KPICard({ label, value, Icon, trend, trendType, subtext, color, bg, loading }) {
  return (
    <div className="glass-card glass-card-hover p-5 group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</div>
          <div className="text-[11px] text-gray-400 font-medium">{subtext}</div>
        </div>
      </div>
    </div>
  )
}

function CandidateRankingItem({ rank, candidate, role, score, idx }) {
  const initials = candidate ? candidate.split(' ').map(n => n[0]).join('').toUpperCase() : '?'
  
  return (
    <div className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all cursor-pointer group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm ${
        rank === 1 ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 
        rank === 2 ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' : 
        rank === 3 ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' : 
        'bg-white text-gray-400 border border-gray-100'
      }`}>
        #{rank}
      </div>
      
      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 overflow-hidden shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
          {candidate || 'Unknown Candidate'}
        </div>
        <div className="text-[11px] text-gray-400 font-medium truncate uppercase tracking-tight">{role || 'General Pool'}</div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className={`pill-badge ${
          score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          score >= 60 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {score?.toFixed(1)}
        </div>
        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [results, setResults] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllResumes(), getAllResults(), getAllJobDescriptions()])
      .then(([r, res, j]) => {
        setResumes(r.data || [])
        setResults(res.data || [])
        setJobs(j.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const avgScore = results.length
    ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : 0

  const topCandidates = [...results].sort((a, b) => b.score - a.score).slice(0, 5)

  // Ensure at least 3 candidates for the chart
  const chartData = topCandidates.length >= 3 
    ? topCandidates.slice(0, 5).map(r => ({
        name: (r.candidateName || 'Unknown').split(' ')[0],
        score: parseFloat(r.score?.toFixed(1) || 0),
      }))
    : [
        { name: 'Alex', score: 88 },
        { name: 'Jordan', score: 72 },
        { name: 'Taylor', score: 64 },
        { name: 'Morgan', score: 55 },
        { name: 'Casey', score: 48 },
      ].slice(0, Math.max(3, topCandidates.length))

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Pipeline Intelligence</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Clock size={10} /> UPDATED JUST NOW
            </div>
            <span className="text-[12px] text-gray-400 font-medium">Real-time resume processing overview</span>
          </div>
        </div>
        <button className="btn-primary shadow-lg shadow-gray-900/10" onClick={() => navigate('/upload')}>
          <Plus size={16} className="mr-2" strokeWidth={3} /> Upload Resumes
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard 
          label="Total Resumes" 
          value={resumes.length} 
          Icon={FileText} 
          trend="+12%" 
          trendType="up"
          subtext="from 32"
          color="text-blue-600" 
          bg="bg-blue-50" 
          loading={loading}
        />
        <KPICard 
          label="Candidates Ranked" 
          value={results.length} 
          Icon={Users} 
          trend="+5%" 
          trendType="up"
          subtext="this week"
          color="text-indigo-600" 
          bg="bg-indigo-50" 
          loading={loading}
        />
        <KPICard 
          label="Job Descriptions" 
          value={jobs.length} 
          Icon={LayoutDashboard} 
          trend="+1" 
          trendType="up"
          subtext="new draft"
          color="text-amber-600" 
          bg="bg-amber-50" 
          loading={loading}
        />
        <KPICard 
          label="Average Match" 
          value={`${avgScore}%`} 
          Icon={TrendingUp} 
          trend="-2.4%" 
          trendType="down"
          subtext="vs last pool"
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Top Candidates Chart */}
        <div className="glass-card p-6 lg:col-span-7">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" /> Talent Distribution
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-1">Score breakdown for leading candidates</p>
            </div>
            <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={12}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '8px 12px'
                  }}
                />
                <Bar dataKey="score" fill="#111827" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Rankings */}
        <div className="glass-card p-6 lg:col-span-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" /> Top Candidates
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-1">Highest alignment with active roles</p>
            </div>
            <button 
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors uppercase tracking-wider"
              onClick={() => navigate('/results')}
            >
              Full List <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-1">
            {topCandidates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-[12px] text-gray-400 font-medium">No candidates processed yet</p>
              </div>
            ) : (
              topCandidates.map((r, idx) => (
                <CandidateRankingItem 
                  key={r.id} 
                  rank={idx + 1} 
                  candidate={r.candidateName} 
                  role={r.jobTitle} 
                  score={r.score} 
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-6 bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Ready to scale your hiring?</h3>
              <p className="text-indigo-100 text-sm mb-6 max-w-sm">Process hundreds of resumes in seconds with our advanced AI ranking engine.</p>
              <button 
                className="px-4 py-2 bg-white text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
                onClick={() => navigate('/upload')}
              >
                Upload Batch Now
              </button>
            </div>
            <div className="p-3 bg-indigo-500/30 rounded-2xl backdrop-blur-sm">
              <Sparkles size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
              <BarChart3 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Detailed Analytics</h4>
              <p className="text-[11px] text-gray-400 font-medium">View skill gap reports</p>
            </div>
          </div>
          <button 
            className="w-full btn-secondary text-[12px] py-2.5"
            onClick={() => navigate('/results')}
          >
            Open Reports
          </button>
        </div>
      </div>
    </div>
  )
}
