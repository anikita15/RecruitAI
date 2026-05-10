import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, ChevronDown, BarChart3, Briefcase, Users, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAllResumes, getAllJobDescriptions, createJobDescription, analyzeResumes, getTaskStatus } from '../services/api.js'

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedResumes, setSelectedResumes] = useState([]) // empty = all
  const [analyzing, setAnalyzing] = useState(false)
  const [showNewJob, setShowNewJob] = useState(false)
  const [analysisMode, setAnalysisMode] = useState('semantic') // 'semantic' or 'llm'
  const [task, setTask] = useState(null)

  // New JD form state
  const [jdForm, setJdForm] = useState({
    title: '', description: '', requiredSkills: '', experienceRequired: '', educationRequired: ''
  })
  const [savingJD, setSavingJD] = useState(false)

  useEffect(() => {
    getAllResumes().then(r => setResumes(r.data || [])).catch(() => {})
    getAllJobDescriptions().then(r => setJobs(r.data || [])).catch(() => {})
  }, [])

  const toggleResume = (id) => {
    setSelectedResumes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSaveJD = async () => {
    if (!jdForm.title.trim() || !jdForm.description.trim()) {
      toast.error('Title and description are required'); return
    }
    setSavingJD(true)
    try {
      const res = await createJobDescription(jdForm)
      const created = res.data
      setJobs(prev => [...prev, created])
      setSelectedJob(String(created.id))
      setShowNewJob(false)
      setJdForm({ title: '', description: '', requiredSkills: '', experienceRequired: '', educationRequired: '' })
      toast.success('Job description saved!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingJD(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedJob) { toast.error('Select a job description first'); return }
    if (resumes.length === 0) { toast.error('Upload resumes before analyzing'); return }

    setAnalyzing(true)
    try {
      const res = await analyzeResumes(Number(selectedJob), selectedResumes, analysisMode)
      const initialTask = res.data
      setTask(initialTask)
      
      // Start Polling
      pollTaskStatus(initialTask.taskId)
    } catch (err) {
      toast.error(err.message)
      setAnalyzing(false)
    }
  }

  const pollTaskStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const res = await getTaskStatus(taskId)
        const updatedTask = res.data
        setTask(updatedTask)

        if (updatedTask.status === 'COMPLETED') {
          clearInterval(interval)
          toast.success('Analysis complete! Redirecting to results…')
          setTimeout(() => navigate('/results'), 1200)
        } else if (updatedTask.status === 'FAILED') {
          clearInterval(interval)
          setAnalyzing(false)
          toast.error(updatedTask.message || 'Analysis failed')
        }
      } catch (err) {
        clearInterval(interval)
        setAnalyzing(false)
        toast.error('Lost connection to server')
      }
    }, 1500)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Intelligent Screening</h1>
        <p className="text-[12px] text-gray-400 font-medium mt-1">Configure screening criteria and select candidate pool</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Job Description Selection */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase size={16} className="text-indigo-600" /> Target Role
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-1">Select or define the role requirements</p>
              </div>
              <button 
                className="btn-secondary py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider"
                onClick={() => setShowNewJob(!showNewJob)}
              >
                <Plus size={14} className="mr-1" /> New Role
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 px-1">Select Job Description</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  value={selectedJob}
                  onChange={e => setSelectedJob(e.target.value)}
                >
                  <option value="">Choose a role...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              {selectedJob && (() => {
                const jd = jobs.find(j => String(j.id) === selectedJob)
                return jd ? (
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="text-sm font-bold text-gray-900 mb-1">{jd.title}</div>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                      {jd.description}
                    </p>
                    {jd.requiredSkills && (
                      <div className="flex flex-wrap gap-1.5">
                        {jd.requiredSkills.split(',').map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-gray-100 text-[10px] font-semibold text-gray-600 rounded-md shadow-sm">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {showNewJob && (
            <div className="glass-card p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Plus size={16} className="text-indigo-600" /> Create New Job Description
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 px-1">Job Title *</label>
                  <input 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="e.g. Senior Product Designer"
                    value={jdForm.title}
                    onChange={e => setJdForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 px-1">Description *</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[150px] placeholder:text-gray-400"
                    placeholder="Describe the responsibilities and requirements..."
                    value={jdForm.description}
                    onChange={e => setJdForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 px-1">Required Skills (comma-separated)</label>
                  <input 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="React, Figma, Tailwind CSS"
                    value={jdForm.requiredSkills}
                    onChange={e => setJdForm(p => ({ ...p, requiredSkills: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 px-1">Experience</label>
                    <input 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. 5+ years"
                      value={jdForm.experienceRequired}
                      onChange={e => setJdForm(p => ({ ...p, experienceRequired: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 px-1">Education</label>
                    <input 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. BS in Design"
                      value={jdForm.educationRequired}
                      onChange={e => setJdForm(p => ({ ...p, educationRequired: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    className="flex-1 btn-primary"
                    onClick={handleSaveJD}
                    disabled={savingJD}
                  >
                    {savingJD ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Job Description'}
                  </button>
                  <button 
                    className="btn-ghost text-sm px-4"
                    onClick={() => setShowNewJob(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Resume Selection */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" /> Candidate Pool
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-1">Select candidates for screening</p>
              </div>
              <button 
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                onClick={() => setSelectedResumes(
                  selectedResumes.length === resumes.length ? [] : resumes.map(r => r.id)
                )}
              >
                {selectedResumes.length === resumes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-1 mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                {selectedResumes.length === 0 
                  ? `Analyzing all ${resumes.length} available resumes` 
                  : `${selectedResumes.length} candidate(s) selected for screening`}
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
              {resumes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No resumes available</p>
                  <button 
                    className="text-xs font-bold text-indigo-600 mt-2"
                    onClick={() => navigate('/upload')}
                  >
                    Go to Upload
                  </button>
                </div>
              ) : (
                resumes.map(r => {
                  const isChecked = selectedResumes.includes(r.id) || selectedResumes.length === 0
                  return (
                    <label 
                      key={r.id} 
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200/50' 
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedResumes.includes(r.id)} 
                        onChange={() => toggleResume(r.id)} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{r.candidateName}</div>
                        <div className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">{r.fileName}</div>
                      </div>
                      <div className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                        {r.fileType}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* AI Intelligence Config */}
          <div className="glass-card p-6 border-indigo-100/50 bg-indigo-50/10 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> AI Intelligence
              </h3>
              <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                Pro Feature
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-indigo-100 bg-white hover:border-indigo-200 transition-all cursor-pointer group">
                <div className="pt-0.5">
                  <input 
                    type="radio" 
                    name="analysis_mode"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    checked={analysisMode === 'semantic'}
                    onChange={() => setAnalysisMode('semantic')}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Semantic Fast Scan</div>
                  <div className="text-[10px] text-gray-400 font-medium leading-relaxed">Keyword + Semantic similarity. Fast and reliable.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-indigo-100 bg-white hover:border-indigo-200 transition-all cursor-pointer group shadow-sm">
                <div className="pt-0.5">
                  <input 
                    type="radio" 
                    name="analysis_mode"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    checked={analysisMode === 'llm'}
                    onChange={() => setAnalysisMode('llm')}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    Deep AI Analysis <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] rounded">LLM</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium leading-relaxed">Full reasoning via GPT-4o. Detects transferable skills and writes detailed pitches.</div>
                </div>
              </label>
            </div>
          </div>

          <button 
            className="w-full btn-primary py-4 shadow-xl shadow-gray-900/10 text-base"
            onClick={handleAnalyze}
            disabled={analyzing || !selectedJob || resumes.length === 0}
          >
            {analyzing ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" /> Analyzing...</>
            ) : (
              <><Sparkles size={20} className="mr-3" strokeWidth={3} /> Run AI Analysis</>
            )}
          </button>
          
          {analyzing && task && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500 animate-spin" /> 
                  {task.status === 'PENDING' ? 'Queuing...' : 'Analyzing Resumes'}
                </span>
                <span className="text-indigo-600">
                  {Math.round((task.processedResumes / task.totalResumes) * 100)}%
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-100">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                  style={{ width: `${(task.processedResumes / task.totalResumes) * 100}%` }}
                />
              </div>
              
              <div className="flex items-center justify-center gap-2 text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                {task.message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
