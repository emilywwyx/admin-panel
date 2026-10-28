import { Suspense } from "react";
import { Avatar, Empty, FilterLink, PageHeader, Pagination, StatTile, inputClass } from "@/components/ui";
import { PAGE_SIZE, getUsers } from "@/lib/data";
import { formatCount, formatDate, formatDateTime, fullName, shortId } from "@/lib/format";
import { pageParam, param, withParams, type SearchParams } from "@/lib/params";

export default function UsersPage({ searchParams }: PageProps<"/users">) {
  return (
    <>
      <PageHeader title="Users" description="Every profile, with what each person has posted and voted on. Read-only." />
      <Suspense fallback={<p className="text-sm text-muted">Loading users…</p>}>
        <Users searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Users({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = param(params, "q");
  const role = param(params, "role") === "admins" ? "admins" : "all";
  const page = pageParam(params);

  const { users, total, totals, hasEmails } = await getUsers({ query, role, page });
  const href = (values: Record<string, string | number | null>) =>
    withParams("/users", { q: query, role: role === "all" ? null : role, page, ...values });

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Profiles" value={formatCount(totals.all)} />
        <StatTile
          label="Active users"
          value={formatCount(totals.active)}
          detail="Posted a photo, generated captions, or voted"
        />
        <StatTile label="Superadmins" value={formatCount(totals.admins)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex min-w-64 flex-1 gap-2" action="/users">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          <input
            name="q"
            defaultValue={query}
            placeholder={hasEmails ? "Search name, email, or ID" : "Search name or ID"}
            className={inputClass}
          />
        </form>
        <FilterLink href={href({ role: null, page: 1 })} active={role === "all"}>
          Everyone
        </FilterLink>
        <FilterLink href={href({ role: "admins", page: 1 })} active={role === "admins"}>
          Superadmins
        </FilterLink>
      </div>

      {users.length === 0 ? (
        <Empty>No users match.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-line-soft bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-cream-2/60 text-xs font-bold uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Photos</th>
                <th className="px-4 py-3 text-right font-medium">AI generations</th>
                <th className="px-4 py-3 text-right font-medium">Votes cast</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors duration-200 hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={fullName(user)} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{fullName(user)}</p>
                        <p className="truncate text-xs text-muted">
                          {user.email ?? <span className="font-mono">{shortId(user.id)}</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_superadmin ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-cream">
                        Superadmin
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Member</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.photos}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.generations}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{user.votesCast}</td>
                  <td className="px-4 py-3 text-muted">{user.lastActive ? formatDateTime(user.lastActive) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} href={(next) => href({ page: next })} />
    </>
  );
}
