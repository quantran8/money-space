import { useLoginPage } from '@/features/auth/hooks/use-auth-page'
import { AuthLayout } from '@/features/auth/ui/auth-page'
import { LoginView } from '@/features/auth/ui/components/login-view'

export function LoginPage() {
  const { googlePending, form, submit, onGoogle } = useLoginPage()

  return (
    <AuthLayout>
      <LoginView
        form={form}
        onSubmit={submit}
        onGoogle={onGoogle}
        googlePending={googlePending}
      />
    </AuthLayout>
  )
}
