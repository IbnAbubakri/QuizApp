import { supabase } from './supabase'

export const saveAttempt = async ({ topic, questions, answers }) => {
  const byQuestionId = {}
  ;(questions || []).forEach((q, i) => {
    byQuestionId[q.id] = answers?.[i]?.chosen ?? null
  })
  const { error } = await supabase.rpc('submit_attempt', {
    p_topic_id: topic.id,
    p_answers: byQuestionId,
  })
  return error
}
