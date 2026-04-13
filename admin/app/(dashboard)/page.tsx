import { createServerClient } from '@/lib/supabase';

async function getStats() {
  const supabase = createServerClient();

  const [total, members, subscribers, pending, badges] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'member'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'subscriber'),
    supabase.from('invite_tokens').select('id', { count: 'exact', head: true }).eq('is_used', false).gt('expires_at', new Date().toISOString()),
    supabase.from('user_badges').select('id', { count: 'exact', head: true }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: quietUsers } = await supabase
    .from('profiles')
    .select('id, first_name, updated_at')
    .neq('subscription_tier', 'inactive')
    .lt('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at')
    .limit(10);

  return {
    total: total.count ?? 0,
    members: members.count ?? 0,
    subscribers: subscribers.count ?? 0,
    pendingInvites: pending.count ?? 0,
    totalBadges: badges.count ?? 0,
    quietUsers: quietUsers ?? [],
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Overview</h1>
      <p style={{ color: '#7A9A6A', marginBottom: 36, fontSize: 14 }}>
        {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Total users', value: stats.total },
          { label: 'Members', value: stats.members },
          { label: 'Subscribers', value: stats.subscribers },
          { label: 'Pending invites', value: stats.pendingInvites },
          { label: 'Badges earned', value: stats.totalBadges },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#FFFFFF',
            border: '1px solid #C8DFB0',
            borderRadius: 12,
            padding: '20px 18px',
          }}>
            <p style={{ fontSize: 12, color: '#7A9A6A', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#5C8A34', fontFamily: 'Montserrat, sans-serif' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quiet users */}
      {stats.quietUsers.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Quiet for 7+ days</h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #C8DFB0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#EAF3DC' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#7A9A6A', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#7A9A6A', fontWeight: 600 }}>Last active</th>
                </tr>
              </thead>
              <tbody>
                {stats.quietUsers.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid #EAF3DC' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{u.first_name ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                      {new Date(u.updated_at).toLocaleDateString('en-NZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
