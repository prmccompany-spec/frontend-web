import { useState, useEffect, useCallback } from 'react';
import { getReviews, setReviewStatus, deleteReview } from '../../services/reviewService';
import { showToast } from '../../components/Toast/toastBus';
import './Reviews.css';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
];

function Stars({ count }) {
  return (
    <div className="rv-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`rv-star${i < count ? ' rv-star--filled' : ''}`}>&#9733;</span>
      ))}
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actingId, setActingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getReviews(activeTab || undefined)
      .then((res) => setReviews(res.data?.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (review, status) => {
    setActingId(review.id);
    try {
      await setReviewStatus(review.id, status);
      showToast(`Review ${status}.`, 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? `Failed to ${status === 'approved' ? 'approve' : 'reject'} review.`, 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete this review from "${review.name}"? This can't be undone.`)) return;
    setActingId(review.id);
    try {
      await deleteReview(review.id);
      showToast('Review deleted.', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to delete review.', 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="admin-content rv-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reviews</h1>
        <p className="admin-page-subtitle">Moderate public feedback submitted from the home page — approved reviews appear in the Testimonials section</p>
      </div>

      <div className="rv-tabs">
        {TABS.map((t) => (
          <button
            key={t.key || 'all'}
            className={`rv-tab-btn${activeTab === t.key ? ' rv-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rv-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="rv-empty">
          {activeTab === 'pending' ? 'No reviews waiting for approval.' : 'No reviews in this view.'}
        </div>
      ) : (
        <div className="rv-list">
          {reviews.map((r) => (
            <div className="rv-card" key={r.id}>
              <div className="rv-card-top">
                <div>
                  <div className="rv-name">{r.name}</div>
                  <Stars count={r.rating} />
                </div>
                <span className={`rv-status-badge rv-status-badge--${r.status}`}>{r.status}</span>
              </div>

              <p className="rv-message">{r.message}</p>

              <div className="rv-meta-row">
                <span>Submitted {fmtDateTime(r.created_at)}</span>
                {r.reviewed_at && (
                  <span>· {r.status === 'approved' ? 'Approved' : 'Rejected'} {fmtDateTime(r.reviewed_at)}{r.reviewed_by_name ? ` by ${r.reviewed_by_name}` : ''}</span>
                )}
              </div>

              <div className="rv-actions">
                {r.status !== 'approved' && (
                  <button
                    className="rv-btn rv-btn--success"
                    disabled={actingId === r.id}
                    onClick={() => handleStatus(r, 'approved')}
                  >
                    Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    className="rv-btn rv-btn--warn"
                    disabled={actingId === r.id}
                    onClick={() => handleStatus(r, 'rejected')}
                  >
                    Reject
                  </button>
                )}
                <button
                  className="rv-btn rv-btn--danger"
                  disabled={actingId === r.id}
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reviews;
