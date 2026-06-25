import { useState } from 'react';
import type { AdminUser } from '@/models/types';

interface Props { adminUser: AdminUser; }

const MOCK_TICKETS = [
  { id: 't1', user: '@alice99',   message: 'My balance is not updating after tapping', status: 'open',        time: '2h ago' },
  { id: 't2', user: '@bob_taps',  message: 'Staking page shows wrong APY calculation', status: 'in-progress', time: '4h ago' },
  { id: 't3', user: '@crypto_x',  message: 'TON wallet keeps disconnecting',            status: 'open',        time: '6h ago' },
  { id: 't4', user: '@miner22',   message: 'Cannot see my referral rewards',            status: 'resolved',    time: '1d ago' },
];

const STATUS_COLORS: Record<string, string> = {
  open:         '#4FC3F7',
  'in-progress':'#FFE082',
  resolved:     '#A5D6A7',
};

export default function SupportModule({ adminUser: _adminUser }: Props) {
  const [search,    setSearch]    = useState('');
  const [tickets,   setTickets]   = useState(MOCK_TICKETS);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = tickets.filter(t =>
    t.user.includes(search) || t.message.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = (id: string, status: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const selectedTicket = tickets.find(t => t.id === selected);

  return (
    <div className="p-5">
      <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-4">
        Support Tickets
      </h3>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users or messages..."
        className="w-full bg-obsidian-900 border border-obsidian-600 rounded-xl px-4 py-2.5 text-chrome-200 text-sm outline-none focus:border-chrome-500 mb-4"
        style={{ touchAction: 'auto', userSelect: 'auto' }}
      />

      {/* Ticket list */}
      <div className="space-y-2 mb-4">
        {filtered.map(ticket => (
          <div
            key={ticket.id}
            onClick={() => setSelected(selected === ticket.id ? null : ticket.id)}
            className="admin-metric-card cursor-pointer transition-all"
            style={{
              borderColor: selected === ticket.id ? 'rgba(79,195,247,0.4)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-chrome-200 text-sm font-semibold">{ticket.user}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_COLORS[ticket.status], background: `${STATUS_COLORS[ticket.status]}15` }}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-steel-400 text-xs truncate">{ticket.message}</p>
              </div>
              <span className="text-steel-400 text-[10px] flex-shrink-0">{ticket.time}</span>
            </div>

            {/* Expanded actions */}
            {selected === ticket.id && (
              <div className="mt-3 pt-3 border-t border-obsidian-700 space-y-2">
                <p className="text-chrome-300 text-xs">{ticket.message}</p>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Admin note..."
                  rows={2}
                  className="w-full bg-obsidian-900 border border-obsidian-600 rounded-lg px-3 py-2 text-chrome-200 text-xs outline-none resize-none"
                  style={{ touchAction: 'auto', userSelect: 'auto' }}
                />
                <div className="flex gap-2">
                  {['in-progress', 'resolved'].map(s => (
                    <button
                      key={s}
                      onClick={e => { e.stopPropagation(); updateStatus(ticket.id, s); }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize border transition-colors"
                      style={{
                        color:       STATUS_COLORS[s],
                        borderColor: `${STATUS_COLORS[s]}40`,
                        background:  `${STATUS_COLORS[s]}10`,
                      }}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-steel-400 text-sm text-center py-8">No tickets found</p>
      )}
    </div>
  );
}
