import { useEffect, useRef, useState } from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'
import { api } from '../api'
import { Avatar } from './bits'

const POLL_MS = 4000

const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

// Chat between a Business and its assigned Student. Polls for new messages while the tab is visible.
export default function ChatBox({ projectId, me, otherName, readOnly = false }) {
  const [messages, setMessages] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scroller = useRef(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      api.messages(projectId).then((m) => alive && setMessages(m)).catch(() => {})
    }
    load()
    const timer = readOnly ? null : setInterval(load, POLL_MS)
    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
  }, [projectId, readOnly])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSending(true)
    setError('')
    try {
      const message = await api.sendMessage(projectId, me, text)
      setMessages((current) => [...(current ?? []), message])
      setDraft('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="chat">
      <header className="chat-head">
        <Avatar name={otherName} />
        <div>
          <strong>{otherName}</strong>
          <div className="small muted">{readOnly ? 'Chat history' : 'Messages about this project'}</div>
        </div>
      </header>

      <div className="chat-log" ref={scroller} aria-live="polite">
        {messages === null && <p className="small muted chat-empty">Loading messages</p>}
        {messages?.length === 0 && (
          <p className="small muted chat-empty">
            {readOnly ? 'No messages were sent on this project.' : `Say hello to ${otherName.split(' ')[0]}. Agree on deadlines, content and feedback here.`}
          </p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`bubble ${m.sender === me ? 'mine' : 'theirs'}`}>
            <p>{m.text}</p>
            <time className="small">{timeOf(m.sent_at)}</time>
          </div>
        ))}
      </div>

      {!readOnly && (
        <form className="chat-form" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${otherName.split(' ')[0]}`}
            aria-label="Message"
            maxLength={1000}
          />
          <button className="btn primary" disabled={sending || !draft.trim()} aria-label="Send">
            <PaperPlaneRight size={16} weight="fill" />
          </button>
        </form>
      )}
      {error && <p className="error small">{error}</p>}
    </section>
  )
}
