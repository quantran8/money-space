import { AuthLogo } from '@/features/auth/ui/components/auth-logo'

/** Compact brand mark shown above the form on small screens (brand panel is hidden there). */
export function AuthMobileHeader() {
  return (
    <AuthLogo
      className="mb-10 text-[17px] lg:hidden"
      markClassName="size-10 rounded-[11px] bg-wash"
    />
  )
}
