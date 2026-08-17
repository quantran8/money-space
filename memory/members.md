# Members (client)

Related: [[households-and-onboarding]], [[sharing-levels]], [[domain-overview]].

> Replaces `members-and-permissions.md`. Backend doc of record:
> `money-space-backend/memory/members-and-lifecycle-safeguard.md`.

## No roles, no permission levels

`HouseholdRole` and `PermissionLevel` are gone from the API and from this app.
`MemberItem` is identity and status only. Any member may read and write anything
in the household, including any record's sharing level.

The members list therefore stopped being a permissions console. Each row shows
the person, their status, and **how many money sources they are responsible
for** (derived from `holderMemberId`) — "who is responsible for what" instead of
"who is allowed what". That reframing is the point, not a side effect.

## The three lifecycle operations

Invite a member · Remove a member · Delete the household.

Creator-only on the server, and kept out of the everyday view in
`HouseholdAdminDisclosure` (`features/household/ui/components/`) — a collapsed
disclosure at the bottom of `/household`, speaking the danger-zone language from
`data-card.tsx`, whose delete row it absorbed so the operation exists in one
place.

**Invite is the deliberate exception.** Burying it makes a one-person household
a dead end at exactly the moment forming the couple is the point, so
`MembersListSection` shows it as a prominent empty-state CTA while
`members.length < 2`, and only the disclosure carries it once there are two.

## Inviting is a QR code, not an email

Tapping "Mời thành viên" shows a **QR code**, not a form. The two people are
normally in the same room, so asking the inviter to type an address for someone
sitting next to them — and then waiting on a mail round-trip — was the slowest
possible way to close that gap. There is still no role to offer.

### The flow

1. **Inviter** opens the dialog. It **reuses** the household's existing pending,
   unexpired invite and only calls `POST /api/households/:id/invites` when there
   is none. Opening the dialog must not mint a token each time: every live token
   is a standing way in, so a household would accumulate open doors. Replacing a
   leaked code is a separate, explicit action (revoke + create).
2. The QR encodes `<origin>/join?household=<householdId>&token=<token>`.
   **Both params, and both are needed**: `household` names the destination so
   the join screen can render before any round-trip, while `token` is the only
   thing that authorizes. There is no join-by-id on the server — a household id
   appears in every request path a member makes, so it is not a secret, and
   anything scannable by id alone would be an open door.
3. **Invitee** scans and lands on `/join`. `GET /api/invites/:token` previews the
   household name and who invited them — and no financial data, because a token
   holder has been granted nothing yet.
4. Accepting calls `POST /api/invites/:token/accept`, which creates the member
   row **with the joiner's own identity** attached. The old email path created a
   placeholder row from an address the inviter typed; that is gone.
5. A token is **single-use** (accept flips it to `accepted`) and expires — 14
   days by default, 90 max.

### Two ways to reach `/join`

1. **Scanning the QR** — the camera app opens the URL directly.
2. **Onboarding's join branch** (`JoinByCodePanel`) — paste the link or scan with
   the in-app camera (`QrScanner`, jsQR over `getUserMedia`). `parseInviteInput`
   accepts a full URL, a foreign-origin URL, a bare `/join/<token>` path, or the
   token on its own: what lands in a clipboard depends on how the link travelled,
   and refusing a recognizable token over formatting is the most irritating way to
   fail. The in-app camera needs a secure context, so paste is always available.

Both routes converge on `/join`, so the preview and the accept exist once.

### Signing up through an invite link joins automatically

`invite link → sign up → account created → invite accepted → in the household`,
with no confirm tap. `RequireAuth` sends the blocked URL to `/auth` as `?next=`;
on success the auth hooks navigate there with router **state** (`fromAuth`), and
`/join` accepts on arrival.

State, not a query param, on purpose: only our own auth completion can set it, so
a forwarded or bookmarked link can never auto-join anyone, and a reload falls back
to the ordinary confirm screen. Someone already signed in who opens a `/join`
link still gets the confirm — they may not have chosen to open it.

### Where the joiner sits in the route tree

`/join` is behind `RequireAuth` but deliberately **outside** `RequireHousehold`.
Whoever scans an invite usually has no household yet, and that gate would send
them to `/onboarding` — the opposite of joining one. For the same reason the
server's accept route carries **no `:householdId`**: the guard returns early only
when that param is absent, so a household-scoped path would 403 the invitee for
exactly the state they are trying to leave.

On accept the client activates the household the **server** returned and
invalidates the households list, so `RequireHousehold` sees a non-zero count
instead of bouncing the new member straight back to `/onboarding`.
