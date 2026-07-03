import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Task {
  id:          string;
  title:       string;
  description: string;
  reward:      number;
  status:      'locked' | 'active';
  type:        string;
  link?:       string;
  icon:        string;
  createdAt:   number;
}

export function useTasks(telegramId: string) {
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Live tasks from Firestore
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return unsub;
  }, []);

  // User's completed tasks
  useEffect(() => {
    if (!telegramId || telegramId === 'guest') return;
    const q = collection(db, 'users', telegramId, 'completedTasks');
    const unsub = onSnapshot(q, snap => {
      setCompleted(new Set(snap.docs.map(d => d.id)));
    });
    return unsub;
  }, [telegramId]);

  const completeTask = async (task: Task, balance: number) => {
    if (!telegramId || telegramId === 'guest') return false;
    if (completed.has(task.id)) return false;
    try {
      // Mark task completed
      await setDoc(doc(db, 'users', telegramId, 'completedTasks', task.id), {
        completedAt: Date.now(),
        reward:      task.reward,
        serverTimestamp: serverTimestamp(),
      });
      // Add reward to balance
      const userRef  = doc(db, 'users', telegramId);
      const snap     = await getDoc(userRef);
      if (snap.exists()) {
        const cur = snap.data().balance ?? 0;
        await setDoc(userRef, { balance: cur + task.reward, totalEarned: (snap.data().totalEarned ?? 0) + task.reward }, { merge: true });
      }
      return true;
    } catch { return false; }
  };

  return { tasks, completed, isLoading, completeTask };
}
