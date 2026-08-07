import { supabase } from './supabase'
import { displayName } from './AuthContext'

export const saveAttempt = async ({ user, topic, score, total, answers }) => {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0
  const failedQuestions = answers
    .map((a, i) =>
      a
        ? {
            number: i + 1,
            question: a.question,
            yourAnswer: a.chosenText,
            correctAnswer: a.correctText,
            explanation: a.explanation || '',
            correct: a.correct,
          }
        : null
    )
    .filter(Boolean)
    .filter((a) => !a.correct)
  const { error } = await supabase.from('quiz_attempts').insert({
    user_id: user?.id || null,
    student_name: displayName(user).trim() || 'Student',
    topic_id: topic.id,
    topic_name: topic.name,
    score,
    total,
    percent,
    failed_questions: failedQuestions,
  })
  return error
}
