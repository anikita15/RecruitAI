/**
 * api.js — Axios client for Spring Boot backend
 * All API calls funnel through this module for consistent error handling.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, 
})

// ── Request interceptor — attach JWT token ──
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.token) {
      config.headers['Authorization'] = 'Bearer ' + user.token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — unwrap .data and handle 401s ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Auth APIs
// ─────────────────────────────────────────────────────────────────────────────

export const login = (username, password) => 
  api.post('/auth/signin', { username, password })

export const signup = (payload) => 
  api.post('/auth/signup', payload)

export const logout = () => {
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume APIs
// ─────────────────────────────────────────────────────────────────────────────

export const uploadResume = (file, candidateName, candidateEmail = '') => {
  const form = new FormData()
  form.append('file', file)
  form.append('candidateName', candidateName)
  if (candidateEmail) form.append('candidateEmail', candidateEmail)
  return api.post('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getAllResumes = () => api.get('/resumes')
export const getResumeById = (id) => api.get(`/resumes/${id}`)
export const deleteResume = (id) => api.delete(`/resumes/${id}`)

// ─────────────────────────────────────────────────────────────────────────────
// Job Description APIs
// ─────────────────────────────────────────────────────────────────────────────

export const createJobDescription = (payload) => api.post('/job-descriptions', payload)
export const getAllJobDescriptions = () => api.get('/job-descriptions')
export const getJobDescriptionById = (id) => api.get(`/job-descriptions/${id}`)

// ─────────────────────────────────────────────────────────────────────────────
// Screening / Analysis APIs
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeResumes = (jobDescriptionId, resumeIds = [], mode = 'semantic') =>
  api.post('/screening/analyze', { jobDescriptionId, resumeIds, mode })

export const getTaskStatus = (taskId) => api.get(`/screening/task/${taskId}`)

export const getAllResults = () => api.get('/screening/results')
export const getResultsByJob = (jobId) => api.get(`/screening/results/job/${jobId}`)
export const getResultById = (id) => api.get(`/screening/results/${id}`)

export default api
