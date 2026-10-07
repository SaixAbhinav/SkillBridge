import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

const SAMPLES = {
  B01: 'I run a small restaurant in Hyderabad called Spice Route Kitchen. We need a website with our menu, photos and WhatsApp ordering. Budget ₹8,000, needs to be done in 2 weeks.',
  B02: 'We are a clothing boutique and want to grow on Instagram. Need someone to plan a month of posts and reels for our Diwali collection. Budget ₹5,000, 3 weeks.',
  B03: 'New gym opening in Gachibowli. Need a modern logo and branding kit for posters and social media. Budget ₹4,000, 1 week.',
  B04: 'We sell organic groceries online and track sales in Excel sheets. Want a simple dashboard showing monthly sales and top products. Budget ₹6,000, 2 weeks.',
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function PostProject() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [businessId, setBusinessId] = useState('B01')
  const [description, setDescription] = useState('')
  const [req, setReq] = useState(null)
  const [aiUsed, setAiUsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.businesses().then(setBusinesses).catch((e) => setError(e.message))
  }, [])

  function changeDescription(text) {
    setDescription(text)
    setReq(null)
  }

  async function analyze() {
    setBusy(true)
    setError('')
    try {
      const res = await api.extract(description)
      setReq(res.requirements)
      setAiUsed(res.ai_used)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setError('')
    try {
      const project = await api.createProject({ ...req, business_id: businessId, description })
      navigate(`/projects/${project.id}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const update = (field, numeric = false) => (e) =>
    setReq({ ...req, [field]: numeric ? Number(e.target.value) : e.target.value })

  return (
    <div className="narrow">
      <h1>Post a project</h1>
      <div className="card form">
        <label>
          Business
          <select value={businessId} onChange={(e) => { setBusinessId(e.target.value); changeDescription('') }}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
          </select>
        </label>
        <label>
          Describe what you need, in your own words
          <textarea
            rows={5}
            value={description}
            onChange={(e) => changeDescription(e.target.value)}
            placeholder="e.g. I need a website for my restaurant with our menu and online ordering…"
          />
        </label>
        {SAMPLES[businessId] && (
          <button type="button" className="link" onClick={() => changeDescription(SAMPLES[businessId])}>
            Use sample description
          </button>
        )}
        <button className="btn primary" disabled={busy || description.trim().length < 10} onClick={analyze}>
          {busy && !req ? 'Analyzing…' : 'Analyze with AI'}
        </button>
      </div>

      {req && (
        <div className="card form">
          <div className="row-between">
            <h2>Extracted requirements</h2>
            <span className={`badge ${aiUsed ? 'ai' : ''}`}>{aiUsed ? 'AI extracted' : 'Keyword fallback'}</span>
          </div>
          <label>Title<input value={req.title} onChange={update('title')} /></label>
          <label>Summary<input value={req.summary} onChange={update('summary')} /></label>
          <div>
            <strong className="small">Required skills</strong>
            <SkillChips skills={req.required_skills} editable onChange={(skills) => setReq({ ...req, required_skills: skills })} />
          </div>
          <div className="grid-3">
            <label>Budget (₹)<input type="number" min={0} value={req.budget_inr} onChange={update('budget_inr', true)} /></label>
            <label>Duration (weeks)<input type="number" min={1} max={12} value={req.duration_weeks} onChange={update('duration_weeks', true)} /></label>
            <label>Hours / week<input type="number" min={1} max={40} value={req.hours_per_week} onChange={update('hours_per_week', true)} /></label>
          </div>
          <label>
            Difficulty
            <select value={req.difficulty} onChange={update('difficulty')}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <button className="btn primary" disabled={busy || req.required_skills.length === 0} onClick={publish}>
            {busy ? 'Publishing…' : 'Publish & find students'}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
