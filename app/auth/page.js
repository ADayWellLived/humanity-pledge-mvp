'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/constants';

const C = COLORS;

export default function Auth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        // Create user record
        const { error: userError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            email,
            display_name: name,
          },
        ]);

        if (userError) throw userError;

        router.push('/dashboard');
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <style>{`${FONTS} * { box-sizing: border-box; } html, body { margin: 0; }`}</style>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.mark}>HP</div>
          <div style={styles.title}>The Humanity Pledge</div>
          <div style={styles.subtitle}>Small acts, kept and counted.</div>

          <form onSubmit={handleAuth} style={styles.form}>
            {isSignUp && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={styles.toggle}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.surfaceEdge}`,
    borderRadius: 18,
    padding: 32,
    textAlign: 'center',
  },
  mark: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.ember}, ${C.gold})`,
    color: C.void,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 800,
    fontSize: 16,
    margin: '0 auto 16px',
    boxShadow: `0 0 16px ${C.ember}66`,
  },
  title: {
    fontFamily: "'Instrument Serif', serif",
    fontStyle: 'italic',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: C.inkSoft,
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 18,
  },
  input: {
    padding: '12px 14px',
    borderRadius: 9,
    border: `1px solid ${C.surfaceEdge}`,
    background: C.surfaceHi,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    color: C.ink,
  },
  button: {
    background: `linear-gradient(135deg, ${C.ember}, ${C.gold})`,
    color: C.void,
    border: 'none',
    borderRadius: 999,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: `0 0 24px ${C.ember}44`,
  },
  toggle: {
    background: 'transparent',
    border: 'none',
    color: C.inkSoft,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  error: {
    color: C.ember,
    fontSize: 13,
    padding: '8px 10px',
    background: `${C.ember}18`,
    borderRadius: 6,
  },
};
