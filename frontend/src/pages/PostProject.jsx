import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
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
      <div className="page-head">
        <h1>Post a project</h1>
        <p className="muted">Describe the work the way you would explain it to a friend. We will work out the skills.</p>
      </div>

      <div className="panel form">
        <label className="field">
          <span>Business</span>
          <select value={businessId} onChange={(e) => { setBusinessId(e.target.value); changeDescription('') }}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
          </select>
        </label>
        <label className="field">
          <span>What do you need?</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => changeDescription(e.target.value)}
            placeholder="For example: a website for my restaurant with our menu and online ordering"
          />
          <small>Mention a budget and a deadline if you have them.</small>
        </label>
        <div className="row-between">
          {SAMPLES[businessId]
            ? <button type="button" className="link" onClick={() => changeDescription(SAMPLES[businessId])}>Use a sample request</button>
            : <span />}
          <button className="btn primary" disabled={busy || description.trim().length < 10} onClick={analyze}>
            <Sparkle size={16} weight="fill" /> {busy && !req ? 'Reading request' : 'Find required skills'}
          </button>
        </div>
      </div>

      {req && (
        <div className="panel form reveal">
          <div className="row-between">
            <h2>Requirements</h2>
            <span className={`tag ${aiUsed ? 'on' : ''}`}>{aiUsed ? 'Extracted by AI' : 'Keyword fallback'}</span>
          </div>
          <label className="field"><span>Title</span><input value={req.title} onChange={update('title')} /></label>
          <label className="field"><span>Summary</span><input value={req.summary} onChange={update('summary')} /></label>
          <div className="field">
            <span>Required skills</span>
            <SkillChips skills={req.required_skills} editable onChange={(skills) => setReq({ ...req, required_skills: skills })} />
          </div>
          <div className="grid-3">
            <label className="field"><span>Budget (₹)</span><input type="number" min={0} value={req.budget_inr} onChange={update('budget_inr', true)} /></label>
            <label className="field"><span>Duration (weeks)</span><input type="number" min={1} max={12} value={req.duration_weeks} onChange={update('duration_weeks', true)} /></label>
            <label className="field"><span>Hours per week</span><input type="number" min={1} max={40} value={req.hours_per_week} onChange={update('hours_per_week', true)} /></label>
          </div>
          <label className="field">
            <span>Difficulty</span>
            <select value={req.difficulty} onChange={update('difficulty')}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary" disabled={busy || req.required_skills.length === 0} onClick={publish}>
              {busy ? 'Publishing' : 'Publish and match'} <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
