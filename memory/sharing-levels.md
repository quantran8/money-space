# Sharing levels (client)

How much of a record the shared picture shows, and how this app renders it.
Related: [[assets]], [[settings-and-sharing]], [[domain-overview]].

> Replaces `asset-classification.md`'s two-axis model and the deleted
> `members-and-permissions.md`. The backend doc of record is
> `money-space-backend/memory/sharing-levels.md`; keep the two in step.

## The model

One axis, two values, and **nothing is ever excluded from a shared figure**:

| value | label (vi) | meaning |
|---|---|---|
| `detail` | Chia sẻ chi tiết | the shared list shows the source, amount and holder |
| `summary_only` | Chỉ đóng góp vào bức tranh chung | the amount counts; the specifics are folded |

Gone entirely: `private`, `grouped`, `financialNature` (all four values),
`privacyOwnerMemberId`, and the household-level sharing defaults.

`holderMemberId` stays and means something different: **who is responsible for**
the money. It is what the members list reports.

## `normalizeVisibility` is the read boundary

`src/features/assets/model/asset-classification.ts`. **Every** read of a stored
`visibilityLevel` goes through it. Legacy `grouped` / `private` fold to
`summary_only`, never to `detail` — a record the household chose not to itemize
must not start showing its name because the app was redeployed. An absent value
takes the default (`detail`).

This is why the 4 → 2 collapse was safe to ship before the backend migration:
after the boundary, nothing downstream ever sees four values.

## It is a presentation contract, not a security boundary

Both partners have the same rights and either can switch any record to `detail`
in one edit, so folding cannot be concealment. It applies to **everyone,
including the person who set it** — what I see is what they see, and that
symmetry is what makes the setting trustworthy without a permission system.

**Do not let the copy over-promise.** "danh sách chung không hiện chi tiết" is
true regardless of what the API returns. Never write "người kia không thấy".

## How a folded record renders

- **Asset list** (`asset-list.tsx`): source cell becomes a non-interactive
  "Khoản đóng góp chung" placeholder; holder shows `—`; the detail link is
  hidden. **Liquidity and the amount stay** — §2.15 requires every calculated
  number to be explainable, and a contribution with no bucket would make the
  "Dùng ngay" total stop adding up. The sharing column itself was removed: with
  two values it read the same on nearly every row.
- **Asset detail** (`asset-detail-page.tsx`): reachable by deep link, so it
  replaces the chart and info list with a notice panel and a "switch to sharing
  the details" action.
- **Journal**: a folded record's name and amount are withheld by the server.

The only way to see the specifics is to change the level back, which anyone may
do and which is journalled. **Do not add a "peek" affordance.**
