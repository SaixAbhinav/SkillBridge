import { useState } from 'react'
import { X } from '@phosphor-icons/react'

export default function SkillChips({ skills, variant = '', editable = false, onChange }) {
  const [draft, setDraft] = useState('')

  function add(e) {
    e.preventDefault()
    const skill = draft.trim().toLowerCase()
    if (skill && !skills.includes(skill)) onChange([...skills, skill])
    setDraft('')
  }

  return (
    <div className="chips">
      {skills.map((s) => (
        <span key={s} className={`chip ${variant}`}>
          {s}
          {editable && (
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(skills.filter((x) => x !== s))}>
              <X size={12} weight="bold" />
            </button>
          )}
        </span>
      ))}
      {editable && (
        <form onSubmit={add} className="chip-add">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add skill" aria-label="Add skill" />
        </form>
      )}
    </div>
  )
}
