import { BookOpen, Binary, PieChart, Sigma, Triangle, Hash } from 'lucide-react'

const TOPIC_ICONS = [
  { match: /binary/, Icon: Binary },
  { match: /fraction/, Icon: PieChart },
  { match: /algebra/, Icon: Sigma },
  { match: /geometr/, Icon: Triangle },
  { match: /number/, Icon: Hash },
]

export default function TopicIcon({ topic, size = 24 }) {
  const name = topic?.name?.toLowerCase() || ''
  const Icon = TOPIC_ICONS.find((t) => t.match.test(name))?.Icon || BookOpen
  return <Icon size={size} aria-hidden="true" />
}
