import { createServerClient } from '@/lib/supabase';

async function getMembers() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, full_name, subscription_tier, subscription_status, trial_ends_at, created_at, onboarding_complete')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function MembersPage() {
  const members = await getMembers();

  const tierBadge = (tier: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      member: { bg: '#EAF3DC', text: '#3D6020' },
      subscriber: { bg: '#FFF3E8', text: '#A04010' },
      inactive: { bg: '#F0F0F0', text: '#888' },
    };
    return colors[tier] ?? colors.inactive;
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Members</h1>
      <p style={{ color: '#7A9A6A', marginBottom: 32, fontSize: 14 }}>{members.length} total</p>

      <div style={{ background: '#FFFFFF', border: '1px solid #C8DFB0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#EAF3DC' }}>
              {['Name', 'Tier', 'Status', 'Trial ends', 'Joined'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#7A9A6A', fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const c = tierBadge(m.subscription_tier ?? 'inactive');
              return (
                <tr key={m.id} style={{ borderTop: '1px solid #EAF3DC' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>
                    {m.full_name ?? m.first_name ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: c.bg, color: c.text, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                      {m.subscription_tier ?? 'inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                    {m.subscription_status ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                    {m.trial_ends_at ? new Date(m.trial_ends_at).toLocaleDateString('en-NZ') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                    {new Date(m.created_at).toLocaleDateString('en-NZ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
