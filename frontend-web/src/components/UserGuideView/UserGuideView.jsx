import { useMemo, useState } from 'react';
import './UserGuideView.css';

// Shared "docs site" layout for both the admin and member User Guide pages:
// a sticky table-of-contents on the left, grouped exactly like the source
// data, and content cards on the right (why this page exists, how to use
// it, and any tips). Search filters both the TOC and the cards together.
function UserGuideView({ title, subtitle, sections }) {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.title} ${item.why} ${item.how.join(' ')}`.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [sections, query]);

  const scrollTo = (key) => {
    document.getElementById(`guide-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ug-root">
      <div className="ug-head">
        <h1 className="ug-title">{title}</h1>
        {subtitle && <p className="ug-subtitle">{subtitle}</p>}
        <div className="ug-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ug-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ug-search"
            placeholder="Search the guide…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ug-layout">
        <nav className="ug-toc">
          {filteredSections.map((group) => (
            <div className="ug-toc-group" key={group.group}>
              <div className="ug-toc-group-label">{group.group}</div>
              {group.items.map((item) => (
                <button key={item.key} className="ug-toc-link" onClick={() => scrollTo(item.key)}>
                  {item.title}
                </button>
              ))}
            </div>
          ))}
          {filteredSections.length === 0 && (
            <p className="ug-toc-empty">No matches.</p>
          )}
        </nav>

        <div className="ug-content">
          {filteredSections.length === 0 && (
            <div className="ug-empty">No sections match "{query}".</div>
          )}
          {filteredSections.map((group) => (
            <div className="ug-group" key={group.group}>
              <div className="ug-content-group-label">{group.group}</div>
              {group.items.map((item) => (
                <section id={`guide-${item.key}`} className="ug-card" key={item.key}>
                  <div className="ug-card-header">
                    <h2 className="ug-card-title">{item.title}</h2>
                    {item.path && <span className="ug-card-path">{item.path}</span>}
                  </div>

                  <div className="ug-card-block">
                    <div className="ug-card-label">Why this page exists</div>
                    <p className="ug-card-why">{item.why}</p>
                  </div>

                  <div className="ug-card-block">
                    <div className="ug-card-label">How to use it</div>
                    <ol className="ug-card-steps">
                      {item.how.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>

                  {item.tips && item.tips.length > 0 && (
                    <div className="ug-tips">
                      <div className="ug-tips-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18h6" /><path d="M10 22h4" />
                          <path d="M12 2a7 7 0 0 0-4 12.7c.5.4.8 1 .8 1.7v.1h6.4v-.1c0-.7.3-1.3.8-1.7A7 7 0 0 0 12 2z" />
                        </svg>
                        Tips
                      </div>
                      <ul className="ug-tips-list">
                        {item.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserGuideView;
