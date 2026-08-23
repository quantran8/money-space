import { useSignupPage } from '@money-space/core/features/auth/hooks/use-auth-page'
import { AuthLayout } from '@/features/auth/ui/auth-page'
import { SignupView } from '@/features/auth/ui/components/signup-view'

export function SignupPage() {
  const { googlePending, form, submit, onGoogle } = useSignupPage()

  return (
    <AuthLayout>
      <SignupView
        form={form}
        onSubmit={submit}
        onGoogle={onGoogle}
        googlePending={googlePending}
      />
    </AuthLayout>
  )
}
