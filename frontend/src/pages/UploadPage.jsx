import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, User, Mail, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadResume } from '../services/api.js'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function FileRow({ file, onRemove, status, error }) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf')
  
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm hover:border-gray-200 transition-all group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
        {isPdf ? <FileText size={20} /> : <FileText size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{file.name}</div>
        <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
        {status === 'uploading' && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        )}
        {error && <div className="text-[10px] text-red-600 mt-1 font-medium">{error}</div>}
      </div>
      <div className="flex items-center gap-2">
        {status === 'uploading' && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
        {status === 'done'      && <CheckCircle size={18} className="text-emerald-500" />}
        {status === 'error'     && <AlertCircle size={18} className="text-red-500" />}
        {status === 'idle' && (
          <button 
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" 
            onClick={() => onRemove(file.name)}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [globalName, setGlobalName] = useState('')
  const [globalEmail, setGlobalEmail] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF and DOCX files are accepted')
    }
    const newItems = accepted.map(f => ({
      file: f,
      name: '',
      email: '',
      status: 'idle',
      error: null,
    }))
    setFiles(prev => [...prev, ...newItems])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.file.name !== name))

  const updateField = (idx, field, value) => {
    setFiles(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleUploadAll = async () => {
    if (files.length === 0) { toast.error('Add at least one resume file'); return }
    const missingName = files.some(f => !(f.name || globalName).trim())
    if (missingName) { toast.error('Please provide a candidate name for each resume'); return }

    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const item = files[i]
      if (item.status === 'done') continue
      const candidateName = (item.name || globalName).trim()
      const candidateEmail = (item.email || globalEmail).trim()
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        await uploadResume(item.file, candidateName, candidateEmail)
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f))
      }
    }
    setUploading(false)
    toast.success('Batch processing complete!')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Upload Resumes</h1>
        <p className="text-sm text-gray-500 mt-1">Batch import candidate profiles for AI screening</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: Dropzone and Config */}
        <div className="lg:col-span-3 space-y-6">
          <div 
            {...getRootProps()} 
            className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
              isDragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
            }`}>
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {isDragActive ? 'Release to drop files' : 'Drop resumes here'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">Support for PDF and DOCX files up to 20MB</p>
            <div className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300">
              Browse Files
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <User size={16} className="text-indigo-600" /> Default Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 px-1">Global Candidate Name</label>
                <input 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="e.g. John Doe"
                  value={globalName}
                  onChange={e => setGlobalName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 px-1">Global Email (Optional)</label>
                <input 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="e.g. john@example.com"
                  value={globalEmail}
                  onChange={e => setGlobalEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-900">
              Upload Queue <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{files.length}</span>
            </h3>
            {files.some(f => f.status === 'done') && (
              <button 
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                onClick={() => setFiles(prev => prev.filter(f => f.status !== 'done'))}
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="max-h-[600px] overflow-y-auto pr-1">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-sm text-gray-400">Add files to start uploading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((item, idx) => (
                  <div key={item.file.name + idx} className="space-y-2">
                    <FileRow 
                      file={item.file} 
                      status={item.status} 
                      error={item.error} 
                      onRemove={removeFile} 
                    />
                    {item.status === 'idle' && (
                      <div className="grid grid-cols-2 gap-2 px-2 pb-2 border-b border-gray-100">
                        <input 
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Candidate name override"
                          value={item.name}
                          onChange={e => updateField(idx, 'name', e.target.value)}
                        />
                        <input 
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Email override"
                          value={item.email}
                          onChange={e => updateField(idx, 'email', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <button 
              className="w-full btn-primary py-3 mt-4"
              onClick={handleUploadAll}
              disabled={uploading}
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Processing...</>
              ) : (
                <><Plus size={18} className="mr-2" /> Start Uploading {files.filter(f => f.status === 'idle').length} Files</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
