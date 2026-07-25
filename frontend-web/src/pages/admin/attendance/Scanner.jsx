import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { scanAttendance } from '../../../services/attendanceService';
import './Scanner.css';

const DEBOUNCE_MS = 2000;

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Scanner() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const lastScanRef = useRef({ code: '', time: 0 });

  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(false);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, []);

  // Refocus after every render caused by a result landing (feedback change)
  // or the busy flag clearing — runs after React has committed the DOM, so
  // .focus() never fires against a stale/disabled element.
  useEffect(() => {
    focusInput();
  }, [feedback, busy]);

  const handleSubmit = async (code) => {
    if (busy) return;
    const trimmed = code.trim();
    setValue('');
    if (!trimmed) return focusInput();

    const now = Date.now();
    if (trimmed === lastScanRef.current.code && now - lastScanRef.current.time < DEBOUNCE_MS) {
      return focusInput();
    }
    lastScanRef.current = { code: trimmed, time: now };

    setBusy(true);
    try {
      const res = await scanAttendance({ code: trimmed, marked_by: user?.id });
      const entry = {
        id: `${Date.now()}`,
        time: new Date(),
        action: res.action,
        memberName: res.member?.name,
        memberCode: res.member?.member_id,
        message: res.message,
      };
      setFeedback(entry);
      if (res.action !== 'ignored') {
        setRecent((r) => [entry, ...r].slice(0, 15));
      }
    } catch (err) {
      setFeedback({
        id: `${Date.now()}`,
        time: new Date(),
        action: 'error',
        message: err.response?.data?.message || 'Scan failed. Try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(value);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Attendance Scanner</h1>
        <p className="admin-page-subtitle">Scan a member's QR code, or type their member ID and press Enter</p>
      </div>

      <div className="sc-layout">
        <div className="sc-card">
          <input
            ref={inputRef}
            className="sc-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(focusInput, 50)}
            placeholder="Scan QR or type member ID…"
            autoComplete="off"
          />

          {feedback && (
            <div className={`sc-feedback sc-feedback--${feedback.action}`}>
              {feedback.action === 'checkin' && (
                <>
                  <div className="sc-feedback-title">✓ Checked In</div>
                  <div className="sc-feedback-name">{feedback.memberName} ({feedback.memberCode})</div>
                  <div className="sc-feedback-time">{fmtTime(feedback.time)}</div>
                </>
              )}
              {feedback.action === 'checkout' && (
                <>
                  <div className="sc-feedback-title">→ Checked Out</div>
                  <div className="sc-feedback-name">{feedback.memberName} ({feedback.memberCode})</div>
                  <div className="sc-feedback-time">{fmtTime(feedback.time)}</div>
                </>
              )}
              {feedback.action === 'ignored' && (
                <>
                  <div className="sc-feedback-title">⏳ Too Soon</div>
                  <div className="sc-feedback-name">{feedback.memberName} ({feedback.memberCode})</div>
                  <div className="sc-feedback-time">{feedback.message}</div>
                </>
              )}
              {feedback.action === 'error' && (
                <>
                  <div className="sc-feedback-title">✕ Not Found</div>
                  <div className="sc-feedback-time">{feedback.message}</div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="sc-card sc-recent">
          <h2 className="sc-recent-title">Recent Scans</h2>
          {recent.length === 0 ? (
            <p className="sc-empty">No scans yet.</p>
          ) : (
            <ul className="sc-recent-list">
              {recent.map((r) => (
                <li key={r.id} className={`sc-recent-item sc-recent-item--${r.action}`}>
                  <span className={`sc-recent-badge sc-recent-badge--${r.action}`}>
                    {r.action === 'checkin' ? 'IN' : 'OUT'}
                  </span>
                  <span className="sc-recent-name">{r.memberName} <span className="sc-recent-code">({r.memberCode})</span></span>
                  <span className="sc-recent-time">{fmtTime(r.time)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Scanner;
