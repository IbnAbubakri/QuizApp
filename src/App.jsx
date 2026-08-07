import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/AuthContext'
import { useQuiz } from './hooks/useQuiz'
import StartScreen from './components/StartScreen'
import QuizScreen from './components/QuizScreen'
import SubmitScreen from './components/SubmitScreen'
import ResultScreen from './components/ResultScreen'
import AdminLogin from './components/AdminLogin'
import AdminPanel from './components/AdminPanel'
import StudentDashboard from './components/StudentDashboard'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Logo from './components/Logo'

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
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [authView, setAuthView] = useState('login')

  const { user, initializing, signOut } = useAuth()

  const quiz = useQuiz(quizQuestions)

  const prevUserRef = useRef(user)
  useEffect(() => {
    if (prevUserRef.current !== user) {
      prevUserRef.current = user
      if (window.location.pathname === '/admin') {
        setView(adminAuthed ? 'admin' : 'admin-login')
      } else {
        setView('home')
      }
      if (!user) setAdminAuthed(false)
    }
  }, [user])

  useEffect(() => {
    const syncFromPath = () => {
      if (window.location.pathname === '/admin') {
        setView(adminAuthed ? 'admin' : 'admin-login')
      } else {
        setView('home')
      }
    }
    window.addEventListener('popstate', syncFromPath)
    syncFromPath()
    return () => window.removeEventListener('popstate', syncFromPath)
  }, [adminAuthed])

  useEffect(() => {
    if (view === 'quiz' && quiz.finished) {
      setView('submit')
    }
  }, [view, quiz.finished])

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
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at')
    quiz.restart()
    setQuizQuestions(shuffleQuestions(data || []))
    setQuizKey((k) => k + 1)
  }

  const restartQuiz = () => {
    quiz.restart()
    setQuizQuestions((prev) => shuffleQuestions(prev))
    setQuizKey((k) => k + 1)
    setView('quiz')
  }

  const exitQuiz = () => {
    setView('home')
    setQuizQuestions([])
  }

  const exitAdmin = () => {
    setAdminAuthed(false)
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

  if (!user && !adminAuthed) {
    if (window.location.pathname === '/admin') {
      return (
        <AdminLogin
          onLogin={() => {
            setAdminAuthed(true)
            setView('admin')
          }}
          onBack={() => {
            window.history.pushState({}, '', '/')
            setView('home')
          }}
        />
      )
    }
    return authView === 'login' ? (
      <LoginPage onSwitch={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitch={() => setAuthView('login')} />
    )
  }

  if (view === 'quiz') {
    return (
      <QuizScreen key={quizKey} topic={activeTopic} quiz={quiz} user={user} onExit={exitQuiz} />
    )
  }

  if (view === 'submit') {
    return (
      <SubmitScreen
        topic={activeTopic}
        quiz={quiz}
        user={user}
        onSubmitted={() => setView('result')}
        onExit={exitQuiz}
      />
    )
  }

  if (view === 'result') {
    return (
      <ResultScreen topic={activeTopic} quiz={quiz} onRestart={restartQuiz} onExit={exitQuiz} />
    )
  }

  if (view === 'admin-login') {
    return (
      <AdminLogin
        onLogin={() => {
          setAdminAuthed(true)
          setView('admin')
        }}
        onBack={() => {
          window.history.pushState({}, '', '/')
          setView('home')
        }}
      />
    )
  }

  if (view === 'dashboard') {
    return <StudentDashboard user={user} onBack={() => setView('home')} />
  }

  if (view === 'admin') {
    return (
      <AdminPanel
        topics={topics}
        onRefresh={async () => {
          await refreshTopics()
        }}
        onLogout={exitAdmin}
      />
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
    />
  )
}
