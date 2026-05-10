import { useEffect, useState, useMemo } from 'react'
import { BarChart3, Download, Search, ChevronUp, ChevronDown, Info, FileText, CheckCircle, XCircle, X } from 'lucide-react'
import { getAllResults, getAllJobDescriptions, getResultsByJob } from '../services/api.js'
import toast from 'react-hot-toast'

function ScoreBadge({ score }) {
  const colorClass = 
    score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    score >= 65 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
    score >= 45 ? 'bg-amber-50 text-amber-700 border-amber-100' : 
    'bg-rose-50 text-rose-700 border-rose-100'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}>
      {score?.toFixed(1)}
    </span>
  )
}

function SkillChips({ skills, type }) {
  if (!skills || skills.length === 0) return <span className="text-gray-400 text-xs italic">No skills detected</span>
  
  const isMatched = type === 'matched'
  const baseClass = isMatched 
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
    : 'bg-gray-50 text-gray-600 border-gray-100'

  const display = skills.slice(0, 3)
  const rest = skills.length - 3

  return (
    <div className="flex flex-wrap gap-1.5">
      {display.map(s => (
        <span key={s} className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${baseClass}`}>
          {s}
        </span>
      ))}
      {rest > 0 && <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">+{rest}</span>}
    </div>
  )
}

function DetailModal({ result, onClose }) {
  if (!result) return null
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{result.candidateName}</h2>
                <p className="text-sm text-gray-500 font-medium">{result.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBadge score={result.score} />
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Progress Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Match Score Analysis</span>
              <span className="text-sm font-bold text-indigo-600">{result.score?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${result.score}%` }} 
              />
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/50">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Info size={16} className="text-indigo-600" /> Executive Summary
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              "{result.summary || 'No AI generated summary available for this candidate.'}"
            </p>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} /> Matched Skills ({result.matchedSkills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.matchedSkills || []).map(s => (
                  <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                    {s}
                  </span>
                ))}
                {!result.matchedSkills?.length && <p className="text-xs text-gray-400 italic">No exact matches found</p>}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <XCircle size={14} /> Critical Gaps ({result.missingSkills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.missingSkills || []).map(s => (
                  <span key={s} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-100">
                    {s}
                  </span>
                ))}
                {!result.missingSkills?.length && <p className="text-xs text-emerald-600 font-medium">Candidate meets all listed requirements!</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button className="btn-secondary text-sm" onClick={onClose}>Close Overview</button>
          <button className="btn-primary text-sm bg-indigo-600 hover:bg-indigo-700">Download Full Analysis</button>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [jobs, setJobs] = useState([])
  const [filterJob, setFilterJob] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('rankPosition')
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllResults(), getAllJobDescriptions()])
      .then(([r, j]) => {
        setResults(r.data || [])
        setJobs(j.data || [])
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (filterJob) {
      getResultsByJob(filterJob)
        .then(r => setResults(r.data || []))
        .catch(() => {})
    } else {
      getAllResults().then(r => setResults(r.data || [])).catch(() => {})
    }
  }, [filterJob])

  const filtered = useMemo(() => {
    let data = [...results]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.candidateName?.toLowerCase().includes(q) ||
        r.fileName?.toLowerCase().includes(q)
      )
    }
    data.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return data
  }, [results, search, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const exportCSV = () => {
    const header = ['Rank', 'Candidate', 'File', 'Job', 'Score', 'Matched Skills', 'Missing Skills']
    const rows = filtered.map(r => [
      r.rankPosition, r.candidateName, r.fileName, r.jobTitle,
      r.score?.toFixed(1),
      (r.matchedSkills || []).join('; '),
      (r.missingSkills || []).join('; '),
    ])
    const csv = [header, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully!')
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={14} className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100" />
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-indigo-600 ml-1" /> : <ChevronDown size={14} className="text-indigo-600 ml-1" />
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Rankings & Reports</h1>
          <p className="text-[12px] text-gray-400 font-medium mt-1">Intelligent scoring based on job description alignment</p>
        </div>
        <button 
          className="btn-secondary shadow-sm" 
          onClick={exportCSV} 
          disabled={filtered.length === 0}
        >
          <Download size={16} className="mr-2" /> Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Filter by name, file or keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-64 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
            value={filterJob} 
            onChange={e => setFilterJob(e.target.value)}
          >
            <option value="">All Job Descriptions</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <div className="text-xs font-bold text-gray-400 whitespace-nowrap px-2">
            {filtered.length} RESULTS
          </div>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">Generating intelligence report...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed border-2">
          <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No reports available</h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">Please upload resumes and run an AI analysis to see candidate rankings here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto glass-card border-0 shadow-xl shadow-gray-200/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th 
                  className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer group hover:text-indigo-600 transition-colors"
                  onClick={() => toggleSort('rankPosition')}
                >
                  <div className="flex items-center">RANK <SortIcon field="rankPosition" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer group hover:text-indigo-600 transition-colors"
                  onClick={() => toggleSort('candidateName')}
                >
                  <div className="flex items-center">CANDIDATE <SortIcon field="candidateName" /></div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">TARGET ROLE</th>
                <th 
                  className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer group hover:text-indigo-600 transition-colors text-right"
                  onClick={() => toggleSort('score')}
                >
                  <div className="flex items-center justify-end">SCORE <SortIcon field="score" /></div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">MATCH ANALYSIS</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, idx) => (
                <tr 
                  key={r.id} 
                  className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      r.rankPosition === 1 ? 'bg-amber-100 text-amber-700' : 
                      r.rankPosition === 2 ? 'bg-slate-100 text-slate-700' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      #{r.rankPosition}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{r.candidateName}</div>
                    <div className="text-[10px] font-medium text-gray-400 truncate uppercase tracking-tighter max-w-[150px]">{r.fileName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-600">{r.jobTitle || 'General Pool'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ScoreBadge score={r.score} />
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-2 ml-auto overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${r.score}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SkillChips skills={r.matchedSkills} type="matched" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Info size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetailModal result={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
