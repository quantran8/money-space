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

The invite dialog is email-only. There is no role to offer.
