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
      setHistory([]);
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

  // ─── Lưu 1 reading mới (Chỉ lưu khi đã đăng nhập) ──────────────────────────
  const saveReading = useCallback(async (newEntry) => {
    if (!newEntry || !isAuthenticated) return;

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
    setHistory((prev) => prev.filter((h) => h.id !== item.id));
  }, [isAuthenticated]);

  // ─── Xoá nhiều readings ───────────────────────────────────────────────────
  const deleteMultipleReadings = useCallback(async (itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    const idsToDelete = new Set(itemsToDelete.map((i) => i.id));

    if (isAuthenticated) {
      await Promise.allSettled(
        itemsToDelete.map((item) => {
          const remoteId = item._remoteId || item.id;
          if (!remoteId) return Promise.resolve();
          return fetch(`${SSO_BASE}/readings/${remoteId}`, {
            method: 'DELETE',
            headers: authHeaders(),
            credentials: 'include',
          });
        })
      );
    }

    setHistory((prev) => prev.filter((h) => !idsToDelete.has(h.id)));
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
    }
    setHistory([]);
  }, [isAuthenticated]);

  // ─── Cập nhật data của 1 reading (dùng để lưu AI conversation) ─────────────
  const updateReadingData = useCallback(async (readingId, partialData) => {
    if (!isAuthenticated || !readingId) return;
    try {
      const res = await fetch(`${SSO_BASE}/readings/${readingId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: partialData }),
      });
      if (!res.ok) throw new Error('Failed to update reading data');
      const responseData = await res.json();
      setHistory((prev) =>
        prev.map((item) =>
          item.id === readingId
            ? { ...item, data: { ...item.data, ...partialData } }
            : item
        )
      );
      return responseData.reading;
    } catch (err) {
      console.error('updateReadingData error:', err);
    }
  }, [isAuthenticated]);

  return {
    history,
    setHistory,
    historyLoaded,
    loadHistory,
    saveReading,
    deleteReading,
    deleteMultipleReadings,
    clearHistory,
    updateReadingData,
  };
}
