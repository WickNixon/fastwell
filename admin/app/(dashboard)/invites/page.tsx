'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';

interface InviteToken {
  id: string;
  email: string;
  first_name: string | null;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient();

  const loadInvites = async () => {
    const { data } = await supabase
      .from('invite_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setInvites(data ?? []);
  };

  useEffect(() => { loadInvites(); }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) return;
    setSending(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-invite', {
        body: { email: email.trim(), first_name: firstName.trim() },
      });

      if (fnError || !data?.sent) {
        setError('Failed to send invite. Please try again.');
      } else {
        setSent(true);
        setEmail('');
        setFirstName('');
        await loadInvites();
        setTimeout(() => setSent(false), 3000);
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  const getStatus = (invite: InviteToken) => {
    if (invite.is_used) return { label: 'Used', color: '#7A9A6A' };
    if (new Date(invite.expires_at) < new Date()) return { label: 'Expired', color: '#D06820' };
    return { label: 'Pending', color: '#5C8A34' };
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Invites</h1>
      <p style={{ color: '#7A9A6A', marginBottom: 32, fontSize: 14 }}>Send personalised member invite links</p>

      {/* Send invite form */}
      <div style={{ background: '#FFFFFF', border: '1px solid #C8DFB0', borderRadius: 12, padding: 24, marginBottom: 32, maxWidth: 480 }}>
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>Send invite</h2>
        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#7A9A6A', fontWeight: 600, marginBottom: 6 }}>
              FIRST NAME
            </label>
            <input
              type="text"
              placeholder="Sarah"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#7A9A6A', fontWeight: 600, marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: '#D06820', fontSize: 14 }}>{error}</p>}
          {sent && <p style={{ color: '#5C8A34', fontSize: 14, fontWeight: 600 }}>Invite sent ✓</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={sending || !email.trim() || !firstName.trim()}
            style={{ alignSelf: 'flex-start', padding: '12px 24px' }}
          >
            {sending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>

      {/* Invites table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #C8DFB0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#EAF3DC' }}>
              {['Name', 'Email', 'Status', 'Sent', 'Expires'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#7A9A6A', fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => {
              const status = getStatus(invite);
              return (
                <tr key={invite.id} style={{ borderTop: '1px solid #EAF3DC' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{invite.first_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>{invite.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: status.color, fontSize: 13, fontWeight: 600 }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                    {new Date(invite.created_at).toLocaleDateString('en-NZ')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#7A9A6A' }}>
                    {new Date(invite.expires_at).toLocaleDateString('en-NZ')}
                  </td>
                </tr>
              );
            })}
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#7A9A6A', fontSize: 14 }}>
                  No invites yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
