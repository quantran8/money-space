import { AlertCircle, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * What renders when a route throws instead of the white screen it used to be.
 *
 * Wired as `errorElement` rather than a class component wrapping the tree:
 * react-router already catches render, loader and action errors per route, and
 * an error inside one page leaves the shell — and the navigation out of it —
 * intact. A top-level boundary would take the whole app down with the page.
 *
 * "Open again" re-navigates rather than reloading: the query cache survives, so
 * a transient failure recovers without refetching the household's whole
 * picture. A hard reload is the fallback when the route itself is what broke.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()

  /**
   * A 404 is not a failure — say so plainly instead of implying something broke.
   *
   * Two ways to land here. As `errorElement` there is a thrown error, and a
   * 404 arrives as a route response. As the `*` route's `element` nothing was
   * thrown at all and `useRouteError()` is undefined — that is the
   * no-such-page case, which is also a 404.
   */
  const isNotFound =
    error === undefined || (isRouteErrorResponse(error) && error.status === 404)

  // For whoever is debugging, never for the household: raw and untranslated.
  // Dev only, and only when something was actually thrown.
  const detail =
    import.meta.env.DEV && error !== undefined
      ? error instanceof Error
        ? error.stack || error.message
        : String(error)
      : null

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={isNotFound ? SearchX : AlertCircle}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!isNotFound && (
                <Button onClick={() => navigate(0)}>
                  {t('common.errorBoundary.retry')}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>
                {t('common.errorBoundary.goHome')}
              </Button>
            </div>
          }
        >
          <span className="block t-subhead text-ink">
            {t(
              isNotFound
                ? 'common.errorBoundary.notFoundTitle'
                : 'common.errorBoundary.title',
            )}
          </span>
          <span className="mt-1 block">
            {t(
              isNotFound
                ? 'common.errorBoundary.notFoundDescription'
                : 'common.errorBoundary.description',
            )}
          </span>
        </EmptyState>

        {detail && (
          <pre className="mt-6 max-h-64 overflow-auto rounded-lg bg-wash p-3 text-left t-caption-sm text-ink2">
            {detail}
          </pre>
        )}
      </div>
    </div>
  )
}
