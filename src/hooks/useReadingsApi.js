import { useState, useCallback } from 'react';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';
const APP = 'tarot';

function getToken() {
  return localStorage.getItem('sso_token');
}

function authHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function useReadingsApi(isAuthenticated) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // ─── Load lịch sử ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      try {
        const saved = localStorage.getItem('tarot_draw_history');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch {
        setHistory([]);
      }
      setHistoryLoaded(true);
      return;
    }

    try {
      const res = await fetch(`${SSO_BASE}/readings?app=${APP}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load readings');
      const data = await res.json();

      const mapped = (data.readings || []).map((r) => ({
        id: r.id,
        timestamp: r.createdAt,
        question: r.question || '',
        spread: r.type,
        title: r.title,
        cards: r.data?.cards || [],
        data: r.data,
        _remoteId: r.id,
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('loadHistory error:', err);
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated]);

  // ─── Lưu 1 reading mới ─────────────────────────────────────────────────────
  const saveReading = useCallback(async (newEntry) => {
    if (!newEntry) return;

    if (!isAuthenticated) {
      setHistory((prev) => {
        const updated = [newEntry, ...prev].slice(0, 20);
        localStorage.setItem('tarot_draw_history', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      const res = await fetch(`${SSO_BASE}/readings`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app: APP,
          type: newEntry.spread || 'custom',
          question: newEntry.question || null,
          title: newEntry.title || `Trải bài ${newEntry.spread || ''}`,
          data: newEntry,
        }),
      });
      if (!res.ok) throw new Error('Failed to save reading');
      const data = await res.json();
      const saved = data.reading;
      const mappedItem = { ...newEntry, id: saved.id, _remoteId: saved.id };
      setHistory((prev) => [mappedItem, ...prev]);
    } catch (err) {
      console.error('saveReading error:', err);
    }
  }, [isAuthenticated]);

  // ─── Xoá 1 reading ─────────────────────────────────────────────────────────
  const deleteReading = useCallback(async (item) => {
    const remoteId = item._remoteId || item.id;
    if (isAuthenticated && item._remoteId) {
      try {
        await fetch(`${SSO_BASE}/readings/${remoteId}`, {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
      } catch (err) {
        console.error('deleteReading error:', err);
      }
    }
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== item.id);
      if (!isAuthenticated) {
        localStorage.setItem('tarot_draw_history', JSON.stringify(updated));
      }
      return updated;
    });
  }, [isAuthenticated]);

  // ─── Xoá toàn bộ ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await fetch(`${SSO_BASE}/readings/all?app=${APP}`, {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
      } catch (err) {
        console.error('clearHistory error:', err);
      }
    } else {
      localStorage.removeItem('tarot_draw_history');
    }
    setHistory([]);
  }, [isAuthenticated]);

  return {
    history,
    setHistory,
    historyLoaded,
    loadHistory,
    saveReading,
    deleteReading,
    clearHistory,
  };
}
