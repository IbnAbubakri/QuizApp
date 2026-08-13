import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ListChecks,
  Upload,
  LogOut,
  ClipboardList,
  Users,
  Lock,
  LockOpen,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import QuestionManager from './QuestionManager'
import ResultsView from './ResultsView'
import StudentsView from './StudentsView'
import MessagePopup from './MessagePopup'
import { useConfirm } from '../hooks/useConfirm'
import { seedTopics } from '../data/seed'
import TopicIcon from './TopicIcon'

const emptyTopic = { name: '', description: '', accent: '#6366f1' }

export default function AdminPanel({ topics, onRefresh, onLogout }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTopic)
  const [activeTopic, setActiveTopic] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [showStudents, setShowStudents] = useState(false)
  const [busy, setBusy] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState(null)
  const { confirm, dialog } = useConfirm()

  const showMessage = (text, tone = 'info') => {
    setMessage({ text, tone })
  }

  const startAdd = () => {
    setForm(emptyTopic)
    setEditing(null)
  }

  const startEdit = (topic) => {
    setForm({
      name: topic.name,
      description: topic.description || '',
      accent: topic.accent || '#6366f1',
    })
    setEditing(topic)
  }

  const saveTopic = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    try {
      if (editing) {
        await supabase.from('topics').update(form).eq('id', editing.id)
      } else {
        await supabase.from('topics').insert(form)
      }
      await onRefresh()
      setEditing(null)
      setForm(emptyTopic)
      showMessage(editing ? 'Topic updated' : 'Topic added', 'success')
    } catch (err) {
      showMessage('Save failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const doDeleteTopic = async (topic) => {
    setBusy(true)
    try {
      await supabase.from('topics').delete().eq('id', topic.id)
      await onRefresh()
      showMessage('Topic deleted', 'success')
    } catch (err) {
      showMessage('Delete failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteTopic = (topic) => {
    confirm({
      title: 'Delete topic?',
      message: `Delete "${topic.name}" and all its questions? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => doDeleteTopic(topic),
    })
  }

  const toggleOpen = async (topic) => {
    const willOpen = topic.is_open === false
    setBusy(true)
    try {
      await supabase.from('topics').update({ is_open: willOpen }).eq('id', topic.id)
      await onRefresh()
      showMessage(willOpen ? `"${topic.name}" opened for students` : `"${topic.name}" locked`)
    } catch (err) {
      showMessage('Update failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const importSeed = async () => {
    setSeeding(true)
    try {
      for (const topic of seedTopics) {
        const { data: inserted } = await supabase
          .from('topics')
          .insert({
            name: topic.name,
            description: topic.description,
            accent: topic.accent,
          })
          .select()
          .single()

        await supabase.from('questions').insert(
          topic.questions.map((q) => ({
            topic_id: inserted.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
          }))
        )
      }
      await onRefresh()
      showMessage('Sample topics and questions imported', 'success')
    } catch (err) {
      showMessage('Import failed: ' + err.message, 'error')
    } finally {
      setSeeding(false)
    }
  }

  if (showResults) {
    return <ResultsView topics={topics} onBack={() => setShowResults(false)} />
  }

  if (showStudents) {
    return <StudentsView onBack={() => setShowStudents(false)} />
  }

  if (activeTopic) {
    return (
      <QuestionManager
        topic={activeTopic}
        onBack={() => setActiveTopic(null)}
        onRefresh={onRefresh}
      />
    )
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <button className="back-btn" onClick={onLogout} aria-label="Back to home">
          <LogOut size={18} />
          <span>Exit</span>
        </button>
        <h1>Admin Panel</h1>
        <div className="admin-header-actions">
          <button className="ghost-btn" onClick={() => setShowStudents(true)}>
            <Users size={16} />
            Students
          </button>
          <button className="ghost-btn" onClick={() => setShowResults(true)}>
            <ClipboardList size={16} />
            Results
          </button>
          {topics.length === 0 && (
            <button className="ghost-btn" onClick={importSeed} disabled={seeding}>
              <Upload size={16} />
              {seeding ? 'Importing…' : 'Import sample topics'}
            </button>
          )}
          <button className="primary-btn" onClick={startAdd}>
            <Plus size={18} />
            Add topic
          </button>
        </div>
      </header>

      {topics.length === 0 ? (
        <div className="notice">
          No topics yet. Add your first topic, or import the sample questions to get started.
        </div>
      ) : (
        <div className="admin-list">
          {topics.map((topic) => (
            <div key={topic.id} className="admin-topic-row">
              <div className="admin-topic-info">
                <span className="category-emoji small">
                  <TopicIcon topic={topic} size={22} />
                </span>
                <div>
                  <h3>{topic.name}</h3>
                  <p>{topic.description}</p>
                  <span className="topic-count">{topic.question_count ?? 0} questions</span>
                  <span
                    className={`topic-status ${topic.is_open === false ? 'locked' : 'open'}`}
                    title={
                      topic.is_open === false
                        ? 'Students cannot start this topic yet'
                        : 'Students can start this topic'
                    }
                  >
                    {topic.is_open === false ? 'Locked' : 'Open'}
                  </span>
                </div>
              </div>
              <div className="admin-topic-actions">
                <button
                  className={`icon-btn ${topic.is_open === false ? 'lock' : ''}`}
                  title={
                    topic.is_open === false
                      ? 'Open topic for students'
                      : 'Lock topic (students cannot start)'
                  }
                  onClick={() => toggleOpen(topic)}
                >
                  {topic.is_open === false ? <Lock size={18} /> : <LockOpen size={18} />}
                </button>
                <button
                  className="icon-btn"
                  title="View questions"
                  onClick={() => setActiveTopic(topic)}
                >
                  <ListChecks size={18} />
                </button>
                <button className="icon-btn" title="Edit topic" onClick={() => startEdit(topic)}>
                  <Pencil size={18} />
                </button>
                <button
                  className="icon-btn danger"
                  title="Delete topic"
                  onClick={() => deleteTopic(topic)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || form.name !== '' || editing === null) && (
        <form className="topic-form" onSubmit={saveTopic}>
          <h2>{editing ? 'Edit topic' : 'Add topic'}</h2>
          <div className="form-row">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Algebra"
                required
              />
            </label>
          </div>
          <label>
            Description
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Simple equations and unknowns"
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={form.accent}
              onChange={(e) => setForm({ ...form, accent: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setEditing(null)
                setForm(emptyTopic)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={busy || !form.name.trim()}>
              {editing ? 'Save changes' : 'Add topic'}
            </button>
          </div>
        </form>
      )}

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'info'}
        autoDismiss={4500}
        onClose={() => setMessage(null)}
      />
      {dialog}
    </div>
  )
}
