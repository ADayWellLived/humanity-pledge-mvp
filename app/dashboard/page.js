'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS, ptp, todayStr } from '@/lib/constants';
import { Plus, LogOut } from 'lucide-react';

const C = COLORS;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
      } else {
        setUser(session.user);
        await loadPledges(session.user.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadPledges = async (userId) => {
    const { data, error } = await supabase
      .from('pledges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pledges:', error);
    } else {
      setPledges(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) return <div style={styles.root}>Loading...</div>;

  return (
    <div style={styles.root}>
      <style>{`${FONTS} * { box-sizing: border-box; } html, body { margin: 0; }`}</style>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>The Humanity Pledge</div>
          <div style={styles.subtitle}>{user?.email}</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.heading}>Your pledges</h2>
          <button onClick={() => setShowForm(true)} style={styles.addBtn}>
            <Plus size={16} /> New pledge
          </button>
        </div>

        {pledges.length === 0 ? (
          <div style={styles.empty}>
            <p>No pledges yet. Create your first one to get started.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {pledges.map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} onRefresh={() => loadPledges(user.id)} />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <PledgeForm
          userId={user.id}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            loadPledges(user.id);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function PledgeCard({ pledge, onRefresh }) {
  const [logs, setLogs] = useState([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await supabase
        .from('log_entries')
        .select('*')
        .eq('pledge_id', pledge.id)
        .order('date', { ascending: false });
      setLogs(data || []);
    };
    loadLogs();
  }, [pledge.id]);

  const achieved = logs.reduce((sum, log) => sum + (log.amount || 1), 0);
  const percent = ptp(achieved, pledge.target);
  const done = achieved >= pledge.target;

  const handleRemove = async () => {
    if (confirm('Delete this pledge?')) {
      await supabase.from('pledges').delete().eq('id', pledge.id);
      onRefresh();
    }
  };

  return (
    <>
      <div style={styles.card}>
        <button onClick={handleRemove} style={styles.removeBtn}>✕</button>
        <h3 style={styles.pledgeText}>{pledge.text}</h3>
        <p style={styles.unit}>{pledge.unit}</p>
        <div style={styles.progress}>
          <div style={{ ...styles.fill, width: `${percent}%`, background: done ? C.glow : C.ember }} />
        </div>
        <div style={styles.stats}>
          <span style={styles.percent}>{percent}%</span>
          <span style={styles.count}>{achieved} / {pledge.target}</span>
        </div>
        <button onClick={() => setShowLog(true)} style={styles.logBtn}>Log progress</button>
      </div>
      {showLog && (
        <LogModal
          pledge={pledge}
          onClose={() => setShowLog(false)}
          onSuccess={() => {
            setShowLog(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function PledgeForm({ userId, onClose, onSuccess }) {
  const [text, setText] = useState('');
  const [unit, setUnit] = useState('acts');
  const [target, setTarget] = useState(50);
  const [deadline, setDeadline] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('pledges').insert([
      {
        user_id: userId,
        text,
        unit,
        target: parseInt(target),
        deadline,
        visibility,
      },
    ]);

    if (error) {
      alert('Error creating pledge: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>New pledge</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="What will you commit to?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Unit (e.g. acts, hours, pieces)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            style={styles.input}
          />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={styles.input}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Creating...' : 'Create pledge'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LogModal({ pledge, onClose, onSuccess }) {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('log_entries').insert([
      {
        pledge_id: pledge.id,
        user_id: (await supabase.auth.getUser()).data.user.id,
        date: todayStr(),
        amount: parseInt(amount),
      },
    ]);

    if (error) {
      alert('Error logging: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Log progress</h2>
        <p style={styles.pledgeDesc}>{pledge.text}</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <button type="button" onClick={() => setAmount(Math.max(1, amount - 1))} style={styles.stepBtn}>−</button>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...styles.input, textAlign: 'center', width: 80 }}
            />
            <button type="button" onClick={() => setAmount(amount + 1)} style={styles.stepBtn}>+</button>
          </div>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Logging...' : 'Log it'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: C.void,
    fontFamily: 'Inter, sans-serif',
    color: C.ink,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: `1px solid ${C.surfaceEdge}`,
  },
  title: {
    fontFamily: "'Instrument Serif', serif",
    fontStyle: 'italic',
    fontSize: 24,
  },
  subtitle: {
    fontSize: 12,
    color: C.inkSoft,
    marginTop: 4,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: `1px solid ${C.surfaceEdge}`,
    color: C.inkSoft,
    padding: '8px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
  },
  main: {
    maxWidth: 880,
    margin: '0 auto',
    padding: '32px 20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 28,
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: C.ember,
    color: C.void,
    border: 'none',
    padding: '10px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 16,
  },
  card: {
    position: 'relative',
    background: C.surface,
    border: `1px solid ${C.surfaceEdge}`,
    borderRadius: 16,
    padding: 20,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'transparent',
    border: 'none',
    color: C.inkFaint,
    cursor: 'pointer',
    fontSize: 18,
  },
  pledgeText: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 18,
    margin: '0 0 8px 0',
    paddingRight: 20,
  },
  unit: {
    fontSize: 12,
    color: C.inkSoft,
    margin: '0 0 12px 0',
    fontStyle: 'italic',
  },
  progress: {
    width: '100%',
    height: 8,
    background: C.surfaceHi,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 14,
  },
  percent: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 800,
    color: C.gold,
  },
  count: {
    color: C.inkFaint,
  },
  logBtn: {
    width: '100%',
    background: `linear-gradient(135deg, ${C.ember}, ${C.emberDim})`,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '11px 14px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: C.inkSoft,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 6, 8, 0.72)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  modal: {
    background: C.surface,
    borderRadius: 18,
    padding: 26,
    width: '100%',
    maxWidth: 440,
    border: `1px solid ${C.surfaceEdge}`,
  },
  modalTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 24,
    margin: '0 0 16px 0',
  },
  pledgeDesc: {
    fontSize: 14,
    color: C.inkSoft,
    margin: '0 0 16px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: '11px 13px',
    borderRadius: 9,
    border: `1px solid ${C.surfaceEdge}`,
    background: C.surfaceHi,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    color: C.ink,
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: `1px solid ${C.surfaceEdge}`,
    background: C.surfaceHi,
    fontSize: 18,
    cursor: 'pointer',
    color: C.ink,
  },
  submitBtn: {
    background: `linear-gradient(135deg, ${C.ember}, ${C.gold})`,
    color: C.void,
    border: 'none',
    borderRadius: 999,
    padding: '11px 20px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 8,
  },
};
