import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MessagePopup from './MessagePopup'
import { useConfirm } from '../hooks/useConfirm'

const emptyForm = { question: '', options: ['', '', '', ''], answer: 0, explanation: '' }

export default function QuestionManager({ topic, onBack, onRefresh }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const { confirm, dialog } = useConfirm()

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at')
    setQuestions(data || [])
    setLoading(false)
  }, [topic.id])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const showMessage = (text, tone = 'info') => {
    setMessage({ text, tone })
  }

  const startAdd = () => {
    setForm({ ...emptyForm })
    setEditing(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = (q) => {
    setForm({
      question: q.question,
      options: [...q.options],
      answer: q.answer,
      explanation: q.explanation || '',
    })
    setEditing(q)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setOption = (i, value) => {
    const options = [...form.options]
    options[i] = value
    setForm({ ...form, options })
  }

  const saveQuestion = async (e) => {
    e.preventDefault()
    if (!form.question.trim() || form.options.some((o) => !o.trim())) {
      showMessage('Please fill in the question and all four options.')
      return
    }
    const payload = {
      topic_id: topic.id,
      question: form.question.trim(),
      options: form.options.map((o) => o.trim()),
      answer: form.answer,
      explanation: form.explanation.trim(),
    }
    setBusy(true)
    try {
      if (editing) {
        await supabase.from('questions').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('questions').insert(payload)
      }
      await loadQuestions()
      await onRefresh()
      setEditing(null)
      setShowForm(false)
      setForm({ ...emptyForm })
      showMessage(editing ? 'Question updated' : 'Question added', 'success')
    } catch (err) {
      showMessage('Save failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const doDeleteQuestion = async (q) => {
    setBusy(true)
    try {
      await supabase.from('questions').delete().eq('id', q.id)
      await loadQuestions()
      await onRefresh()
      showMessage('Question deleted', 'success')
    } catch (err) {
      showMessage('Delete failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteQuestion = (q) => {
    confirm({
      title: 'Delete question?',
      message: 'Delete this question? This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => doDeleteQuestion(q),
    })
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to topics">
          <ArrowLeft size={18} />
          <span>{topic.emoji || '📘'} {topic.name}</span>
        </button>
        <div className="admin-header-actions">
          <button className="primary-btn" onClick={startAdd}>
            <Plus size={18} />
            Add question
          </button>
        </div>
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'info'}
        onClose={() => setMessage(null)}
      />
      {dialog}

      {(showForm || editing) && (
        <form className="topic-form" onSubmit={saveQuestion}>
          <h2>{editing ? 'Edit question' : 'Add question'}</h2>

          <label>
            Question
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="e.g. What is the value of 12 × 8?"
              rows={2}
            />
          </label>

          <div className="options-form">
            {form.options.map((opt, i) => (
              <div key={i} className={`option-input ${form.answer === i ? 'selected' : ''}`}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                />
                <label className="radio-correct" title="Mark as correct answer">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={form.answer === i}
                    onChange={() => setForm({ ...form, answer: i })}
                  />
                  correct
                </label>
              </div>
            ))}
          </div>

          <label>
            Explanation (shown when the student answers wrongly)
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              placeholder="e.g. 72 is 8 × 9, because 8 × 9 = 72."
              rows={2}
            />
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setEditing(null)
                setShowForm(false)
                setForm({ ...emptyForm })
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={busy}>
              {editing ? 'Save changes' : 'Add question'}
            </button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {loading && <div className="notice">Loading questions…</div>}
        {!loading && questions.length === 0 && (
          <div className="notice">No questions yet. Click "Add question" to create one.</div>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className="question-row">
            <div className="question-row-info">
              <span className="question-index">{i + 1}</span>
              <div>
                <p className="question-row-text">{q.question}</p>
                <div className="question-row-options">
                  {q.options.map((opt, oi) => (
                    <span key={oi} className={`mini-option ${oi === q.answer ? 'correct' : ''}`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-topic-actions">
              <button className="icon-btn" title="Edit" onClick={() => startEdit(q)}>
                <Pencil size={18} />
              </button>
              <button
                className="icon-btn danger"
                title="Delete"
                onClick={() => deleteQuestion(q)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
