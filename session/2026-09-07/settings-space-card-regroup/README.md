# Settings: merge space/members/plan, move currency & language out

- **Date**: 2026-09-07
- **Session folder**: `session/2026-09-07/settings-space-card-regroup/`
- **Status**: done

## What the task is

On `/settings`, take Tiền tệ and Ngôn ngữ out of the first card and put them in
a new "Cài đặt khác" panel. The first card becomes one panel holding the space
name, the members list and the plan.

## Changes made

- `web/src/features/settings/ui/components/household-overview-card.tsx` → renamed to
  `household-name-field.tsx`; exports `HouseholdNameField` (the name input only —
  no `Panel`, no currency/language selects).
- `web/src/features/settings/ui/components/space-card.tsx` — new. One `Panel`,
  three blocks split by `.divider`: name, members, plan.
- `web/src/features/settings/ui/components/other-settings-card.tsx` — new. Tiền tệ
  and Ngôn ngữ selects, kept on the same `useSettingsPage` form.
- `web/src/features/members/ui/components/members-list-section.tsx` — added
  `asBlock` to drop its own `Panel`.
- `web/src/features/settings/ui/components/subscription-card.tsx` — same `asBlock` prop.
- `web/src/features/settings/ui/settings-page.tsx` — mounts `SpaceCard` and
  `OtherSettingsCard`; no longer mounts `MembersListSection` / `SubscriptionCard`
  directly.
- `packages/core/src/i18n/resources.ts` — new `settings.other.title` (vi/en).

## Key decisions

- Page order is now: space switcher → space (name/members/plan) → categories →
  other settings → data → sign-out → danger/leave.
- `asBlock` over duplicated markup: one component, two wrappers, so members and
  plan stay editable in one place.
- The plan block and its divider are skipped when `useEntitlement` returns no
  entitlement, otherwise a hairline hangs under the members list.
- Save still lives in the page header — it commits fields in two panels now, so
  neither may own the button.

## Mobile app parity notes

- Mobile has no settings page equivalent yet (`mobile/src/features/settings/ui/`
  only has sign-out and household-data sections), so there is nothing to port
  beyond the grouping decision above when that screen lands.
- `settings.other.title` is in shared core i18n and is available to mobile already.

---

## Pass 2 — space card redesign from mockup

The user supplied an HTML mockup for the "Không gian gia đình" card. Applied
the card itself; the mockup's top-level tab nav ("Không gian gia đình / Nhóm sự
kiện") was explicitly **out of scope** — the other cards stay stacked vertically.

### Changes

- `web/src/features/settings/ui/components/space-identity.tsx` — new. Name as a
  heading with a pencil; inline edit form (Lưu / Huỷ, Enter / Escape) replaces the
  always-live input. Meta line under it: "N thành viên · N nguồn tiền".
- `web/src/features/settings/ui/components/plan-pill.tsx` — new. Plan as one word
  in a pill, top-right, linking to `/settings/subscription`.
- `web/src/features/settings/ui/components/subscription-card.tsx` — **deleted**.
  The pill replaced it; `SubscriptionPage` already carries expiry, days remaining,
  limits, plans and order history.
- `web/src/features/settings/ui/components/household-name-field.tsx` — deleted,
  folded into `space-identity.tsx`.
- `web/src/features/members/ui/components/member-row.tsx` — owner row now carries a
  `StatusChip` ("Chủ gia đình") beside the name.
- `web/src/features/members/ui/components/members-list-section.tsx` — `asBlock`
  tightens the header→list gap to 16 (the 28 of `s-head-body` double-spaced inside
  the card).
- `packages/core/src/i18n/resources.ts` — `settings.household.editName`,
  `settings.billing.viewPlan`, `members.list.owner` (vi + en).

### Key decisions

- **Inline Lưu calls the page's `submitSettings`.** Name, currency and language are
  one form behind one `updateHouseholdConfig` mutation, so the inline button commits
  whatever is pending rather than owning a second save path. The header's Save stays
  as the route for currency/language.
- **Huỷ restores without `shouldDirty`** — otherwise the header's Save button stays
  up with nothing to commit.
- The mockup's input is `border + white`, which is what the design system already
  says (`Input`: fields are marked by a `--committed` stroke, never a wash fill).
  `check-design-scale.mjs` enforces this — a `bg-wash` input fails the build.
- Plan pill is a `Link`, not a button: it navigates.

## Mobile app parity notes (pass 2)

- Still nothing to port — `mobile/src/features/settings/ui/` has only sign-out and
  household-data sections.
- When the mobile settings screen lands: name is read-only until tapped, plan is a
  pill that pushes the subscription screen, and the owner chip belongs on the member
  row.

---

## Pass 3 — plan pill opens the paywall; redeem becomes its own card

### Changes

- `web/src/features/settings/ui/components/plan-pill.tsx` — the pill is a button
  now, not a `Link`: it opens `PaywallSheet` via `usePaywallStore`. Reason is
  `expired` for a lapsed plan, `manage` for an active one, `general` otherwise.
  A **lifetime** household gets a plain `<p>` — nothing to buy, so it is not a control.
- `web/src/features/settings/ui/components/redeem-card.tsx` — new. A card with one
  button that opens `RedeemCodeForm` in a `ResponsiveDialog`. Sits under the space card.
- `web/src/features/billing/ui/subscription-page.tsx` — trimmed to what only a route
  can do: report the payment return and list order history. The plans list and the
  redeem form are gone; the header carries a button into the paywall sheet.
- `web/src/features/billing/ui/paywall-sheet.tsx` — the "có mã?" link goes to
  `/settings` (where the redeem card is), not `/settings/subscription`.
- `packages/core/src/shared/stores/paywall-store.ts` — new `manage` reason.
- `packages/core/src/i18n/resources.ts` — `billing.paywall.title.manage` and
  `.subtitle.manage` (vi + en).

### Key decisions

- **No new plan-picker was built.** `PaywallSheet` already is one — benefits, plan
  list, checkout CTA, mounted once in the shell and driven by a store. The pill is
  one more door into it.
- **`/settings/subscription` stays a route.** PayOS redirects there after checkout
  (`usePaymentReturn` polls the order from `sessionStorage`), so it cannot become a
  modal. `PAYOS_RETURN_URL` is set in the deploy environment, not in `backend/.env` —
  do not delete this route without changing that first.
- The redeem modal does **not** auto-close on success: `onRedeemed` fires as the form
  switches to its success state, which is the screen that says what the code granted.
- A Premium household clicking their own pill used to read "Mở khóa Oursight Premium".
  Hence the `manage` reason.

## Mobile app parity notes (pass 3)

- Mobile mounts its own paywall sheet already; if a plan pill lands there it should
  open that, not push a screen.
- Mobile has no checkout, so it needs no subscription route — a redeem card plus a
  modal is the whole billing surface it needs.

---

## Pass 4 — redeem back in the paywall; plan rows equal-height, price-led

Reverses pass 3's redeem card.

### Changes

- `web/src/features/settings/ui/components/redeem-card.tsx` — **deleted**, and
  unmounted from `settings-page.tsx`. Settings has no code section again.
- `web/src/features/billing/ui/paywall-sheet.tsx`:
  - "Có mã kích hoạt?" now expands `RedeemCodeForm` **inside the sheet** instead of
    navigating. The subscription page no longer carries the form (pass 3 trimmed it),
    so a link-out would land nowhere. Expansion is keyed off `open` the same way the
    plan choice is, so a dismissed sheet reopens collapsed.
  - Plan rows rebuilt as a 2-column grid: **price at `t-subhead` (20)** with the
    discount chip beside it on the first line, plan name + struck-through compare-at
    on the second, savings line spanning both columns on the third.
  - Every row is the same height — the discount slot (`min-h-6`) and the savings line
    (`min-h-5`) are reserved whether or not the plan has them, and `h-full` on the
    button makes the `<li>` grid stretch them to match.
  - `useNavigate` removed; it had no remaining caller.

### Key decisions

- **Price is the primary fact.** It was `t-body-sm`, the same step as the plan name,
  so nothing in the row read as the thing being compared. Name drops to `t-body-sm
  text-ink2` as the label for the price rather than the headline.
- **No `num` (mono) on money here.** `formatMoney` returns "…triệu" / "…tỷ" for VND —
  accented Vietnamese, which §10.1 / v5 §5.1 say mono must never touch.
- Equal height is done with reserved slots, not a fixed row height: the content still
  decides the size, it just cannot differ per row.

## Mobile app parity notes (pass 4)

- Mobile's paywall should carry the same row structure — price first, reserved slots
  for discount and savings.
- No settings-level redeem section on mobile either; the code field belongs at the wall.

---

## Pass 5 — redeem gets its own dialog

Pass 4 expanded the code form inline inside the paywall. It is now a separate
sheet.

### Changes

- `web/src/features/billing/ui/redeem-sheet.tsx` — new. `RedeemCodeForm` in its own
  `ResponsiveDialog`, mounted in `app-shell.tsx` beside `PaywallSheet`.
- `packages/core/src/shared/stores/paywall-store.ts` — `redeemOpen` flag plus
  `openRedeem` / `closeRedeem`. `openRedeem` **closes the paywall** as it opens the
  code sheet.
- `web/src/features/billing/ui/paywall-sheet.tsx` — "Có mã kích hoạt?" is a plain
  button calling `openRedeem` again; the inline expansion and its local state are gone.
- `web/src/features/billing/ui/redeem-code-form.tsx` — new `withHeading` prop, off in
  the dialog so the form does not repeat the dialog's own title and description.

### Key decisions

- **Siblings, not nested.** Both sheets are `ResponsiveDialog`s; rendering one inside
  the other stacks two focus traps. The store swaps them instead.
- **Backing out returns to the paywall.** Closing the code sheet re-opens the plans if
  the household is still not Premium — otherwise they lose the list they were reading
  with no way back. A code that worked leaves them Premium, so no wall re-opens.
- That premium check is read **at close time, not remembered from mount**: this sheet
  lives in the shell for the whole session, so anything captured in `useState` at mount
  would be the value from app start.

## Mobile app parity notes (pass 5)

- Same split applies: a code sheet as a sibling of the paywall sheet, driven by the
  shared `usePaywallStore` (which now carries `redeemOpen`).

---

## Pass 6 — paywall header is static

### Changes

- `web/src/features/billing/ui/paywall-sheet.tsx` — "OURSIGHT PREMIUM" is now the
  dialog **title** (was a small eyebrow caption above a per-reason headline). The
  per-reason title and subtitle are gone; the description is one shared line.
- `packages/core/src/i18n/resources.ts` — new `billing.paywall.headerSubtitle`:
  "Nâng cấp Premium để dùng không giới hạn" / "Upgrade to Premium for unlimited".

### Key decisions

- **`billing.paywall.title.*` and `.subtitle.*` were NOT deleted.** The mobile paywall
  (`mobile/src/features/billing/ui/paywall-sheet.tsx:80`) still reads `title.${reason}`,
  and its `BottomSheet` takes only a `title` prop with no description slot — so making
  mobile static would drop the reason entirely, which is a mobile design call, not part
  of this change.
- Which wall was hit is still conveyed: `LEAD_BENEFIT` reorders the benefits list to
  lead with the relevant one, and an expired plan still gets its "Hết hạn ngày X" chip.

## Mobile app parity notes (pass 6)

- Mobile's paywall still has the dynamic per-reason title. To match web it needs
  "OURSIGHT PREMIUM" as the sheet title plus a subtitle slot on `BottomSheet` for
  `headerSubtitle`. Until then the two differ deliberately, and the `title.*` /
  `subtitle.*` keys must stay.

---

## Pass 7 — crown icon for premium

### Changes

- `web/src/features/forecast/ui/components/range-picker.tsx` — the locked 60/90-day
  rows are marked with `Crown` instead of `Sparkles`.
- `web/src/features/settings/ui/components/plan-pill.tsx` — `Layers` → `Crown`, and
  the icon is now **conditional**: only Premium, trial and lifetime get one. A crown
  beside "Gói Miễn phí" reads as if Free were the paid tier.

### Notes

- Those were the only two standing "premium needed" markers in web. The export button
  (`data-card.tsx`) and the what-if run (`whatif-sheet.tsx`) gate on click and show no
  icon at rest — left as they are.
- Mobile still uses its own icons; not touched.

---

## Pass 8 — locked state reads differently from a normal action

The crown alone was not enough: a gated row still looked like every other row.

### Changes

- `web/src/features/forecast/ui/components/range-picker.tsx` — a locked preset's
  label drops to `text-ink3`, and its crown is `text-attention-ink` (amber) rather
  than `text-ink3`. At metadata grey the crown read as one more label instead of as
  the thing standing between them and the option.
- `web/src/features/settings/ui/components/plan-pill.tsx` — the crown is now on the
  pill in **every** tier; the TONE carries the state:
  - has Premium (or trial/lifetime) → neutral `bg-wash text-ink2` — a status label.
  - Free → `bg-card text-attention-ink ring-1 ring-attention` — an offer.

### Key decisions

- **Amber ink sits on the card surface, not on `attention-soft`.** That pairing
  measures **4.4:1** against `--attention-soft #f6eddc`, just under the 4.5:1 AA floor,
  and the pill is 12px so the large-text exemption does not apply. On `--card #ffffff`
  it is **5.11:1**. The tint moves to a `ring-1 ring-attention` plus an amber hover.
- The row is still **not** `disabled` — the existing comment explains why: a disabled
  control explains nothing, whereas this one opens the paywall.

---

## Pass 9 — warn at CREATE time that an asset will not be auto-priced

Reported gap: adding a market-priced asset with the free plan's automatic-pricing
quota already spent gave no indication in the dialog that the price would not be
tracked. The household only learned it afterwards, on the detail page.

### Changes

- `web/src/features/assets/ui/components/auto-price-notice.tsx` — new. Shown in the
  asset dialog **below every field, directly above the submit button** (pass 10 moved
  it there from between the fields, where it read as the symbol field's error — a
  notice belongs at one end of a form, not sandwiched in it). Create only, and only when
  `useQuota('marketPricedAssets').isExhausted`. Crown + amber ring, with a "Xem các
  gói" link opening the paywall at `reason: 'auto_price_quota'` carrying the real
  `limit` / `used` / `limits`.
- `web/src/features/assets/ui/components/asset-form-dialog.tsx` — mounts it.
- `packages/core/src/i18n/resources.ts` — `assets.autoPrice.willBeManualTitle` and
  `.willBeManual` (vi + en). The existing `.atLimit` is past-tense ("they go to the
  ones you added first"); this one is forward-looking.

### Key decisions

- **Nothing is blocked, and the notice says so.** `assets.service.ts:135
  canAutoPrice` does not refuse the create — the backend saves the asset with
  `autoPriceEnabled: false`. Copy matches: "Gia đình vẫn thêm được tài sản này và tự
  nhập giá bất cứ lúc nào."
- **Only on `isExhausted`, not `isLastOne`.** With one slot left the asset being added
  still gets automation, so a warning would be wrong.
- Create only. On an existing asset the detail page's `AutoPriceRow` already states
  how it is priced, and repeating it in the edit dialog would say the same thing twice.
- `useQuota` (display-only) rather than `usePremiumAction`, whose `check` opens the
  paywall as a side effect — wrong during render.

## Mobile app parity notes (pass 9)

- Mobile's asset form has the same gap; the notice is a straight port, and `useQuota`
  already lives in core.

---

## Pass 10 — a form dialog stands aside for the paywall, then comes back

Opening the paywall from inside a form dialog stacked two dialogs (two focus
traps), and the form was left behind the sheet.

### Changes

- `packages/core/src/shared/stores/paywall-store.ts` — `useBillingSheetOpen()`, true
  while either billing sheet (paywall or redeem) is up.
- `web/src/features/assets/ui/components/asset-form-dialog.tsx` — renders with
  `open={open && !billingOpen}`, and `handleOpenChange` ignores the close Radix
  reports when it is hidden this way.
- `web/src/features/whatif/ui/whatif-sheet.tsx` — same treatment; its quota gate opens
  the paywall from inside the sheet.

### Key decisions

- **Hidden, not closed.** Both call sites render `AssetFormDialog` with
  `key={formOpen ? … : 'closed'}`, so actually closing it would REMOUNT it and throw
  away what the household had typed. `formOpen` stays true and only the dialog's own
  `open` goes false, so the fields survive and it reappears on dismiss.
- `handleOpenChange` must swallow the hide-time close: Radix fires `onOpenChange(false)`
  when `open` flips, and that would otherwise clear `editingId` as though the household
  had dismissed the form.
- The what-if sheet's remount key is derived from `prefill`, which does not change when
  the paywall opens — so it is safe there too.
- The other `openPaywall` callers (range picker, plan pill, subscription page) are
  pages or popovers with no form state to lose; left alone.

## Mobile app parity notes (pass 10)

- `useBillingSheetOpen` is in core, so mobile's asset form and what-if sheet can take
  the same guard.

---

## Pass 11 — motion on the paywall CTA

### Changes

- `web/src/features/billing/ui/paywall-sheet.tsx` — the checkout button is wrapped in
  a `motion.div`: a 240ms fade + 6px rise delayed 120ms after the sheet, and a
  `whileTap` scale to 0.985. Both disabled under `prefers-reduced-motion`.

### Key decisions

- **No looping/pulsing/glowing attention-grabber**, which is what "kích thích user
  bấm" would normally mean. Three rules in the repo forbid it:
  - `design/01-foundations.md` §12 Motion — 120–450ms, "hover/elevation rất nhẹ".
  - `web/src/components/ui/motion.tsx` — motion budget 160–260ms, movement 4–12px.
  - `design/UI_COMPONENT_COPY_PRINCIPLES.md` §45 Tone — "non-promotional", no
    marketing language. The product voice rules (`web/CLAUDE.md`) also say the app
    never tells someone they should buy something.
  What the CTA gets instead is *emphasis by arrival order* (it settles last, so the
  eye lands on it) and *press feedback* (it gives way under the finger) — the parts
  that make a button feel worth pressing without nagging.
- `w-full` added to the Button: the flex parent used to stretch it directly, and the
  wrapper would otherwise let it shrink to its text.

## Mobile app parity notes (pass 11)

- Reanimated equivalent: same 240ms/6px entrance and a press scale. Keep it one-shot.

---

## Pass 12 — the CTA animates at REST, not on open

Pass 11 read the request as entrance motion. What was wanted is an idle-state
animation, so the button draws the eye while it is just sitting there.

### Changes

- `web/src/features/billing/ui/paywall-sheet.tsx` — the entrance fade/rise is gone.
  A sheen (`w-1/3`, `via-white/22`) sweeps across the near-black CTA over 1.1s and
  repeats with a 4.6s gap. `whileTap` scale 0.985 stays. The label is wrapped in a
  `relative` span so it sits above the sheen; the Button gets `overflow-hidden`.

### Key decisions

- **The sheen moves, the button does not.** No pulse, scale, glow or colour cycle:
  the surface stays exactly where it is and keeps its tone, which is what keeps it
  inside "hover/elevation rất nhẹ" (§12) while still being noticeable. This is the
  compromise against §45's "non-promotional" — a highlight passing over a stationary
  surface, not a button that throbs.
- **4.6s gap, deliberately long.** Back-to-back sweeps read as a loading shimmer.
- **Linear easing, not the app's `easeOut`.** That curve is expo — ~90% complete in
  its first fifth (motion.tsx documents this) — so a sweep across a width would flash
  rather than pass.
- Off under `prefers-reduced-motion`, and off while `checkout.isStarting`: a moving
  highlight on a button that is already working reads as progress it is not reporting.

## Mobile app parity notes (pass 12)

- Reanimated `withRepeat` + `withDelay` on a translateX'd gradient overlay; same
  1.1s / 4.6s figures.

---

## Pass 13 — what-if shows the remaining quota at every level

### Changes

- `web/src/features/whatif/ui/whatif-sheet.tsx` — the quota line rendered only at
  `isLastOne` / `isExhausted`; it now renders whenever `useQuota` returns a state, so
  "Còn 3 lượt" shows from the start. It sits in the INPUT step, under the amount and
  date fields — before the run is spent, which is the only moment the number is useful.
- `packages/core/src/i18n/resources.ts` — `whatif.quota.remaining_one/_other` (vi + en).

### Key decisions

- **This reverses a deliberate earlier choice.** The old comment read: "Counting every
  run from 1/5 would turn a tool for thinking into a meter." Reversed on request — the
  household cannot decide whether to spend a run on a rough question without knowing
  how many are left.
- **Phrased as what REMAINS, never what has been used** — the same rule the existing
  `lastOne` / `exhausted` copy follows ("một câu là thông tin, câu kia là lời trách").
- Plural-keyed even though `remaining` only ever renders for 2+ (`lastOne` owns the
  singular), so a bare-key fallback cannot produce "1 runs".
- `useQuota` returns `null` for premium and while loading, so a paying household still
  sees no counter.

## Mobile app parity notes (pass 13)

- Same line, same placement (input step), same copy keys — all in core already.

---

## Pass 14 — the what-if quota becomes a badge in the header

Three refinements to pass 13, in order: the line was too small, it was in the
wrong place (bottom), and it should be a tag rather than a sentence.

### Changes

- `web/src/features/whatif/ui/whatif-sheet.tsx` — the quota paragraph is gone. A pill
  badge now sits **beside the dialog title**, in a `flex` row with it. The full
  sentence is kept as the badge's `title` attribute.
- `packages/core/src/i18n/resources.ts` — `whatif.quota.badge` ("Còn {{count}} lượt" /
  "{{count}} left") and `.badgeExhausted` ("Hết lượt tháng này" / "None left this
  month"). The long `remaining` / `lastOne` / `exhausted` strings stay — they are what
  the tooltip shows.

### Key decisions

- **Header, not the form body.** The count decides whether to spend a run on a rough
  question, so it must be read before the fields — and beside the title it is read
  once on open without pushing the first field down.
- **Hidden on the result and sale steps.** Neither spends a run, so the badge would be
  stale context there.
- **Amber ink on `bg-card` with a `ring-attention`, not on `attention-soft`** — the
  same 4.4:1 AA failure found on the plan pill in pass 8. 12px text gets no large-text
  exemption.
- Non-exhausted state stays neutral (`bg-wash text-ink2`, 5.2:1): having runs left is
  not a warning.

## Mobile app parity notes (pass 14)

- Same badge beside the sheet title; copy keys are in core. Mobile has no `title`
  attribute equivalent — either drop the tooltip or make the badge pressable.
