import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

type DiscussTopic = {
  to: string
  title: string
  line: string
}

type DiscussSectionProps = {
  topics: DiscussTopic[]
}

/**
 * "Cần cùng xem" (mockup `#attention`): a small stack of the most material
 * things the household should talk through, each a button linking to the
 * relevant page.
 */
export function DiscussSection({ topics }: DiscussSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft xl:col-span-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('dashboard.redesign.discuss.eyebrow')}
      </p>
      <h3 className="section-title mt-1 text-xl font-semibold">
        {t('dashboard.redesign.discuss.title', { count: topics.length })}
      </h3>

      {topics.length === 0 ? (
        <p className="mt-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.discuss.empty')}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {topics.map((topic) => (
            <button
              key={`${topic.to}-${topic.title}`}
              type="button"
              onClick={() => navigate(topic.to)}
              className="w-full rounded-2xl border border-border p-4 text-left transition hover:bg-[hsl(var(--muted))]"
            >
              <p className="text-sm font-medium">{topic.title}</p>
              <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                {topic.line}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
