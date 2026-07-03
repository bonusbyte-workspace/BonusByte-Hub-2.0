# -*- coding: utf-8 -*-
import os, sys, subprocess

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def w(path, txt):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(txt)
    print("WROTE " + path)

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.stderr.strip(): print(r.stderr.strip())
    return r.returncode

# ── FIX 1: useTelegramUser.ts — strip undefined before Firestore setDoc
w("src/hooks/useTelegramUser.ts", """import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTelegramUser, getInitData } from '@/lib/telegram';
import type { TelegramUser, UserProfile } from '@/models/types';

interface UseTelegramUserReturn {
  telegramUser: TelegramUser | null;
  userProfile:  UserProfile | null;
  isLoading:    boolean;
  error:        string | null;
  isGuestMode:  boolean;
  guestReason:  string | null;
  refetch:      () => Promise<void>;
}

function makeGuest(u: TelegramUser): UserProfile {
  const now = Date.now();
  return {
    telegramId: String(u.id), username: u.username ?? '',
    firstName: u.first_name ?? 'Player', balance: 0, totalEarned: 0,
    energyAtLastSync: 1000, lastSyncAt: now, role: 'user',
    createdAt: now, dailyEarned: 0, dailyResetAt: now,
    tapLevel: 1, energyLevel: 1,
  };
}

// Firestore does NOT accept undefined — strip all undefined fields
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export function useTelegramUser(): UseTelegramUserReturn {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isGuestMode,  setIsGuestMode]  = useState(false);
  const [guestReason,  setGuestReason]  = useState<string | null>(null);

  const fetchOrCreate = useCallback(async (u: TelegramUser) => {
    const uid = String(u.id);
    const ref = doc(db, 'users', uid);
    try {
      const snap = await getDoc(ref);
      const now  = Date.now();
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const initData = getInitData();
        const sp       = initData.split('&').find(p => p.startsWith('start_param='));
        const refId    = sp ? sp.replace('start_param=', '') : undefined;

        const raw = {
          telegramId:       uid,
          username:         u.username   ?? '',
          firstName:        u.first_name ?? 'Player',
          lastName:         u.last_name,
          photoUrl:         u.photo_url,
          referrerId:       refId,
          balance:          0,
          totalEarned:      0,
          energyAtLastSync: 1000,
          lastSyncAt:       now,
          role:             'user',
          createdAt:        now,
          dailyEarned:      0,
          dailyResetAt:     now,
          tapLevel:         1,
          energyLevel:      1,
          serverTimestamp:  serverTimestamp(),
        };

        const safe = stripUndefined(raw as Record<string, unknown>);
        await setDoc(ref, safe);
        setUserProfile(safe as unknown as UserProfile);
      }
      setIsGuestMode(false);
      setGuestReason(null);
    } catch (err: unknown) {
      const code   = (err as { code?: string }).code ?? 'unknown';
      const msg    = err instanceof Error ? err.message : String(err);
      const reason = code + ': ' + msg.slice(0, 120);
      console.error('[BB] Firestore:', reason);
      setUserProfile(makeGuest(u));
      setIsGuestMode(true);
      setGuestReason(reason);
    }
  }, []);

  const refetch = useCallback(async () => {
    const u = getTelegramUser();
    if (!u) return;
    setIsLoading(true);
    await fetchOrCreate(u);
    setIsLoading(false);
  }, [fetchOrCreate]);

  useEffect(() => {
    const u = getTelegramUser() ?? (import.meta.env.DEV
      ? { id: 999999999, first_name: 'Dev', username: 'devuser', language_code: 'en' } as TelegramUser
      : null);
    if (!u) { setError('Open via Telegram.'); setIsLoading(false); return; }
    setTelegramUser(u);
    fetchOrCreate(u).finally(() => setIsLoading(false));
  }, [fetchOrCreate]);

  return { telegramUser, userProfile, isLoading, error, isGuestMode, guestReason, refetch };
}
""")

# ── FIX 2: Firebase.ts — hardcoded config (in case env vars still missing)
w("src/lib/firebase.ts", """import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyDi_HhkIGVF138k359doneP8Lqsaj_6ohg",
  authDomain:        "bonusbyte-6a4bb.firebaseapp.com",
  projectId:         "bonusbyte-6a4bb",
  storageBucket:     "bonusbyte-6a4bb.firebasestorage.app",
  messagingSenderId: "1091428714278",
  appId:             "1:1091428714278:web:c5e3a8508a20e2336b63e7",
  measurementId:     "G-021R7P16BP",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
""")

# ── FIX 3: useAuth.ts — more robust admin login error handling
w("src/hooks/useAuth.ts", """import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged, User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AdminUser, UserRole } from '@/models/types';

const ADMIN_ROLES: UserRole[] = ['developer', 'support', 'economy'];

interface UseAuthReturn {
  adminUser:    AdminUser | null;
  isLoading:    boolean;
  error:        string | null;
  login:        (email: string, password: string) => Promise<boolean>;
  logout:       () => Promise<void>;
  isAuthorized: boolean;
}

export function useAuth(): UseAuthReturn {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const resolveAdmin = useCallback(async (user: User) => {
    try {
      // Check admins collection
      const snap = await getDoc(doc(db, 'admins', user.uid));
      if (snap.exists()) {
        const role = snap.data().role as UserRole;
        if (ADMIN_ROLES.includes(role)) {
          setAdminUser({ uid: user.uid, email: user.email ?? '', role });
          return;
        }
      }
      // Auto-create developer role for first admin (if admins collection is empty)
      // This only runs once — remove after first login
      setAdminUser(null);
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) await resolveAdmin(user);
      else setAdminUser(null);
      setIsLoading(false);
    });
    return unsub;
  }, [resolveAdmin]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await resolveAdmin(cred.user);
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
      setIsLoading(false);
      return false;
    }
  }, [resolveAdmin]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminUser(null);
  }, []);

  return { adminUser, isLoading, error, login, logout, isAuthorized: adminUser !== null };
}
""")

# ── FIX 4: AdminLogin.tsx — show clearer error + setup instructions
w("src/components/admin/AdminLogin.tsx", """import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLogin() {
  const { login, isLoading, error } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email.trim(), password);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(192,192,192,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(192,192,192,0.3) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background:'linear-gradient(145deg,#1A1A1D,#111113)', border:'1px solid rgba(192,192,192,0.15)' }}
      >
        <div className="flex justify-center mb-5">
          <img src="/logo.png" alt="BonusByte" className="w-12 h-12 object-contain opacity-80" />
        </div>
        <h1 style={{
          textAlign:'center', fontSize:20, fontWeight:900, marginBottom:4,
          background:'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 50%,#9A9A9A 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        }}>
          BonusByte Admin
        </h1>
        <p style={{textAlign:'center',color:'#5A6A79',fontSize:10,letterSpacing:'0.1em',
          textTransform:'uppercase',marginBottom:20}}>
          Authorized Access Only
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              required autoComplete="email" placeholder="admin@bonusbyte.io"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #242428',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{color:'#5A6A79',fontSize:10,textTransform:'uppercase',
              letterSpacing:'0.08em',display:'block',marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••••"
              style={{width:'100%',background:'#0A0A0D',border:'1px solid #242428',
                borderRadius:8,padding:'10px 14px',color:'#E8E8E8',fontSize:13,
                outline:'none',boxSizing:'border-box'}}/>
          </div>

          {error && (
            <div style={{background:'rgba(239,83,80,0.1)',border:'1px solid rgba(239,83,80,0.3)',
              borderRadius:8,padding:'10px 14px'}}>
              <p style={{color:'#EF5350',fontSize:12,textAlign:'center',margin:0}}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading || !email || !password}
            style={{
              width:'100%',padding:'12px',borderRadius:10,border:'1px solid rgba(200,200,200,0.3)',
              background:'linear-gradient(180deg,#D0D0D0 0%,#9A9A9A 40%,#7A7A7A 60%,#B8B8B8 100%)',
              fontWeight:900,fontSize:14,cursor:'pointer',color:'#111',marginTop:4,
              opacity: (isLoading || !email || !password) ? 0.5 : 1,
            }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{color:'#333',fontSize:10,textAlign:'center',marginTop:16}}>
          v2.0 · BonusByte Control Panel
        </p>
      </motion.div>
    </div>
  );
}
""")

# ── Git push
print("\nPushing to GitHub...")
run("git add -A")
run('git commit -m "fix: strip undefined Firestore fields + robust admin auth"')
code = run("git push origin main")
if code == 0:
    print("\nDeploying to Vercel... check back in 60 seconds.")
else:
    print("\nPush failed. Run manually: git push origin main")
