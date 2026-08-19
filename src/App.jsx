import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/AuthContext'
import { useQuiz, topicDurationMs } from './hooks/useQuiz'
import StartScreen from './components/StartScreen'
import QuizScreen from './components/QuizScreen'
import SubmitScreen from './components/SubmitScreen'
import ResultScreen from './components/ResultScreen'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Logo from './components/Logo'

const AdminLogin = lazy(() => import('./components/AdminLogin'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const StudentDashboard = lazy(() => import('./components/StudentDashboard'))

const DRAFT_PREFIX = 'quizapp:draft'

const draftKey = (userId) => (userId ? `${DRAFT_PREFIX}:${userId}` : DRAFT_PREFIX)

const loadDraft = (userId) => {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft?.topic || !Array.isArray(draft?.questions) || draft.questions.length === 0) {
      return null
    }
    return draft
  } catch {
    return null
  }
}

const clearDraft = (userId) => {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    /* storage unavailable */
  }
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const shuffleQuestions = (questions) =>
  shuffle(questions).map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
    }
  })

export default function App() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('home') // home | quiz | submit | result | dashboard | admin-login | admin
  const [activeTopic, setActiveTopic] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizKey, setQuizKey] = useState(0)
  const [authView, setAuthView] = useState('login')
  const [draft, setDraft] = useState(null)
  const [draftInitial, setDraftInitial] = useState(null)
  const [resuming, setResuming] = useState(false)

  const { user, initializing, signOut } = useAuth()

  const isAdmin = !!user && user.app_metadata?.is_admin === true

  const quiz = useQuiz(quizQuestions, topicDurationMs(activeTopic), draftInitial)

  const screenFallback = (
    <div className="auth-screen">
      <Logo withText />
      <div className="spinner" role="status" aria-label="Loading" />
    </div>
  )

  const prevUserRef = useRef(user)
  useEffect(() => {
    if (prevUserRef.current !== user) {
      prevUserRef.current = user
      if (window.location.pathname === '/admin') {
        setView(isAdmin ? 'admin' : 'admin-login')
      } else {
        setView('home')
      }
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || isAdmin) {
      setDraft(null)
      return
    }
    setDraft(loadDraft(user.id))
  }, [user, isAdmin])

  useEffect(() => {
    const syncFromPath = () => {
      if (window.location.pathname === '/admin') {
        setView(isAdmin ? 'admin' : 'admin-login')
      } else {
        setView('home')
      }
    }
    window.addEventListener('popstate', syncFromPath)
    syncFromPath()
    return () => window.removeEventListener('popstate', syncFromPath)
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && window.location.pathname !== '/admin') {
      window.history.replaceState({}, '', '/admin')
      setView('admin')
    }
  }, [isAdmin])

  useEffect(() => {
    if (view === 'quiz' && quiz.finished) {
      setView('submit')
    }
  }, [view, quiz.finished])

  const { current: quizCurrent, answers: quizAnswers, timeLeft: quizTimeLeft, finished: quizFinished } = quiz

  useEffect(() => {
    if (view !== 'quiz' || quizQuestions.length === 0 || !activeTopic || !user || isAdmin) return
    const saved = {
      topic: activeTopic,
      questions: quizQuestions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
      current: quizCurrent,
      answers: quizAnswers.map((a) => (a ? { chosen: a.chosen } : null)),
      timeLeft: quizTimeLeft,
      finished: quizFinished,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(draftKey(user.id), JSON.stringify(saved))
    } catch {
      /* storage unavailable */
    }
  }, [view, quizQuestions, activeTopic, quizCurrent, quizAnswers, quizTimeLeft, quizFinished, user, isAdmin])

  const refreshTopics = useCallback(async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*, questions(count)')
      .order('created_at')
    if (error) throw error
    setTopics(
      (data || []).map((t) => ({ ...t, question_count: t.questions?.[0]?.count ?? 0 }))
    )
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await refreshTopics()
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshTopics])

  const startQuiz = async (topic) => {
    if (topic.is_open === false) return
    setActiveTopic(topic)
    setView('quiz')
    setDraftInitial(null)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at')
    if (error) {
      setError(`Could not load questions: ${error.message}`)
      setView('home')
      return
    }
    quiz.restart()
    let questions = shuffleQuestions(data || [])
    if (questions.length > 50) {
      questions = questions.slice(0, 50)
    }
    setQuizQuestions(questions)
    setQuizKey((k) => k + 1)
  }

  const resumeQuiz = async () => {
    if (!draft || !user) return
    setResuming(true)
    try {
      const { data: dbQuestions, error } = await supabase
        .from('questions')
        .select('id, question, options, answer, explanation')
        .eq('topic_id', draft.topic.id)
      if (error) throw error
      const byId = new Map((dbQuestions || []).map((q) => [q.id, q]))
      const restoredQuestions = draft.questions.map((dq) => {
        const dbq = byId.get(dq.id)
        if (!dbq) return { ...dq, answer: -1, explanation: '' }
        return {
          id: dq.id,
          question: dq.question,
          options: dq.options,
          answer: dq.options.indexOf(dbq.options[dbq.answer]),
          explanation: dbq.explanation || '',
        }
      })
      const restoredAnswers = draft.answers.map((a, i) => {
        const q = restoredQuestions[i]
        if (!a || a.chosen == null || !q) return null
        return {
          question: q.question,
          chosen: a.chosen,
          chosenText: q.options[a.chosen],
          correctText: q.options[q.answer],
          explanation: q.explanation || '',
          correct: a.chosen === q.answer,
        }
      })
      setActiveTopic(draft.topic)
      setQuizQuestions(restoredQuestions)
      setDraftInitial({
        current: draft.current ?? 0,
        answers: restoredAnswers,
        timeLeft: draft.timeLeft,
        finished: draft.finished,
      })
      setQuizKey((k) => k + 1)
      setDraft(null)
      setView('quiz')
    } catch (e) {
      setError(e.message)
    } finally {
      setResuming(false)
    }
  }

  const discardDraft = () => {
    clearDraft(user?.id)
    setDraft(null)
  }

  const restartQuiz = () => {
    setDraftInitial(null)
    quiz.restart()
    setQuizQuestions((prev) => shuffleQuestions(prev))
    setQuizKey((k) => k + 1)
    setView('quiz')
  }

  const exitQuiz = () => {
    clearDraft(user?.id)
    setDraft(null)
    setView('home')
    setQuizQuestions([])
  }

  const exitAdmin = async () => {
    await signOut()
    window.history.pushState({}, '', '/')
    setView('home')
  }

  if (initializing) {
    return (
      <div className="auth-screen">
        <Logo withText />
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    )
  }

  if (isAdmin) {
    return (
      <Suspense fallback={screenFallback}>
        <AdminPanel
          topics={topics}
          onRefresh={async () => {
            await refreshTopics()
          }}
          onLogout={exitAdmin}
        />
      </Suspense>
    )
  }

  const adminLogin = (
    <Suspense fallback={screenFallback}>
      <AdminLogin
        onLogin={() => setView('admin')}
        onBack={() => {
          window.history.pushState({}, '', '/')
          setView('home')
        }}
      />
    </Suspense>
  )

  if (view === 'admin-login' || (!user && window.location.pathname === '/admin')) {
    return adminLogin
  }

  if (view === 'admin') {
    return adminLogin
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitch={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitch={() => setAuthView('login')} />
    )
  }

  if (resuming) {
    return (
      <div className="auth-screen">
        <Logo withText />
        <div className="spinner" role="status" aria-label="Resuming quiz" />
      </div>
    )
  }

  if (view === 'quiz') {
    return (
      <QuizScreen
        key={quizKey}
        topic={activeTopic}
        quiz={quiz}
        user={user}
        questions={quizQuestions}
        onExit={exitQuiz}
      />
    )
  }

  if (view === 'submit') {
    return (
      <SubmitScreen
        topic={activeTopic}
        quiz={quiz}
        user={user}
        questions={quizQuestions}
        onSubmitted={() => {
          clearDraft(user?.id)
          setView('result')
        }}
        onExit={exitQuiz}
      />
    )
  }

  if (view === 'result') {
    return (
      <ResultScreen topic={activeTopic} quiz={quiz} onRestart={restartQuiz} onExit={exitQuiz} />
    )
  }

  if (view === 'dashboard') {
    return (
      <Suspense fallback={screenFallback}>
        <StudentDashboard user={user} onBack={() => setView('home')} />
      </Suspense>
    )
  }

  return (
    <StartScreen
      topics={topics}
      loading={loading}
      error={error}
      user={user}
      onLogout={signOut}
      onDashboard={() => setView('dashboard')}
      onSelect={startQuiz}
      draft={draft}
      onResume={resumeQuiz}
      onDiscard={discardDraft}
    />
  )
}
