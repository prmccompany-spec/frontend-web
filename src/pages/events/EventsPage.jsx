import { useState } from 'react';
import eventImg from '../../assets/slide1.jpg';
import EventDetailsModal from './EventDetailsModal';
import LiveEventBanner from './LiveEvent/LiveEventBanner';
import LiveEventModal from './LiveEvent/LiveEventModal';
import './EventsPage.css';

const EVENTS_DATA = {
  completed: [
    {
      id: 1,
      title: 'PRMCF Annual Convention & Felicitation Ceremony',
      image: eventImg,
      date: '24 Jan 2025',
      startTime: '10:00 am',
      endTime: '3:00 pm',
      location: 'Community Bhavan, Bengaluru',
      attendees: '800+',
      description: 'Join us for our annual convention and felicitation ceremony where we celebrate the achievements of our community members and bring everyone together for a day of festivities.',
      fullDescription: 'The PRMCF Annual Convention & Felicitation Ceremony is our flagship event where we gather to celebrate the accomplishments of our members, honor outstanding contributions, and strengthen the bonds of our community. This year\'s event featured a grand celebration with cultural performances, felicitation of award recipients, and interactive sessions.',
      keyHighlights: [
        'Recognition of outstanding members',
        'Cultural performances and entertainment',
        'Community networking sessions',
        'Awards and felicitations',
        'Lunch and dinner reception',
      ],
      organizer: 'PRMCF Management Committee',
      contactPerson: 'K.G. Prakash Raja',
      phone: '+91-8807541551',
    }
  ],
  ongoing: [
    {
      id: 3,
      title: 'PRMCF Tamil New Year Chitirai vizha',
      image: eventImg,
      date: '14 Apr 2026',
      startTime: '10:00 am',
      endTime: '7:30 pm',
      location: 'Online - YouTube Live',
      attendees: '1000+',
      description: 'Join us for our live community meet and greet where members worldwide can connect and engage with our leadership team.',
      fullDescription: 'The PRMCF Live Community Meet & Greet is a virtual event bringing together our global community members for an interactive session with our leadership, Q&A rounds, and community updates.',
      keyHighlights: ['Live Q&A with leadership', 'Community updates', 'Interactive sessions', 'Global participation'],
      organizer: 'PRMCF Management Committee',
      contactPerson: 'K.G. Prakash Raja',
      phone: '+91-8807541551',
      isActive: true,
      youtubeLink: 'https://www.youtube.com/embed/4rsIM8Gm8o8',
    }
  ],
  upcoming: [],
};

function EventsPage() {
  const [activeTab, setActiveTab] = useState('completed');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [liveEvent, setLiveEvent] = useState(null);

  const EVENTS_PER_PAGE = 4;
  const currentEvents = EVENTS_DATA[activeTab];
  const totalPages = Math.ceil(currentEvents.length / EVENTS_PER_PAGE);
  const startIdx = currentPage * EVENTS_PER_PAGE;
  const endIdx = startIdx + EVENTS_PER_PAGE;
  const displayedEvents = currentEvents.slice(startIdx, endIdx);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    document.body.style.overflow = 'hidden';
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
    document.body.style.overflow = 'auto';
  };

  const openLiveEvent = (event) => {
    setLiveEvent(event);
  };

  const closeLiveEvent = () => {
    setLiveEvent(null);
  };

  // Find active live event
  const activeEvent = Object.values(EVENTS_DATA)
    .flat()
    .find((event) => event.isActive);

  return (
    <div className="events-page">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="ev-hero">
        <div className="ev-hero-inner">
          <div className="ev-hero-content">
            <span className="ev-section-eyebrow">Our Calendar</span>
            <h1 className="ev-hero-title">
              Events & <span className="ev-red">Celebrations</span>
            </h1>
            <p className="ev-hero-desc">
              Join us for community events, celebrations, and gatherings that bring our 
              members together and strengthen our bonds.
            </p>
          </div>
        </div>
      </section>

      {/* ── Live Event Banner ────────────────────────── */}
      {activeEvent && (
        <LiveEventBanner event={activeEvent} onWatchNow={() => openLiveEvent(activeEvent)} />
      )}

      {/* ── Events Section ────────────────────────── */}
      <section className="ev-events">
        <div className="ev-events-inner">

          {/* Tab Navigation */}
          <div className="ev-tabs">
            <button
              className={`ev-tab ${activeTab === 'completed' ? 'ev-tab-active' : ''}`}
              onClick={() => handleTabChange('completed')}
            >
              Completed
            </button>
            <button
              className={`ev-tab ${activeTab === 'ongoing' ? 'ev-tab-active' : ''}`}
              onClick={() => handleTabChange('ongoing')}
            >
              Ongoing
            </button>
            <button
              className={`ev-tab ${activeTab === 'upcoming' ? 'ev-tab-active' : ''}`}
              onClick={() => handleTabChange('upcoming')}
            >
              Upcoming
            </button>
          </div>

          {/* Events Grid */}
          <div className="ev-events-list">
            {displayedEvents.map((event) => (
              <div className="ev-event-card" key={event.id}>
                <div className="ev-event-image">
                  <img src={event.image} alt={event.title} />
                  <div className="ev-event-overlay" />
                </div>

                <div className="ev-event-content">
                  <h3 className="ev-event-title">{event.title}</h3>

                  <div className="ev-event-meta">
                    <div className="ev-event-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    <div className="ev-event-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1" />
                        <path d="M12 1v6m0 6v6" />
                        <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24" />
                      </svg>
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>

                  <div className="ev-event-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{event.location}</span>
                  </div>

                  <div className="ev-event-bottom">
                    <div className="ev-event-attendees">
                      <span className="ev-attendee-count">{event.attendees}</span>
                      <span className="ev-attendee-label">Attendees</span>
                    </div>
                    <button className="ev-event-btn" onClick={() => openEventDetails(event)}>View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="ev-pagination">
              <button className="ev-pag-arrow" onClick={handlePrevPage} disabled={totalPages <= 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="ev-pag-dots">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`ev-pag-dot ${currentPage === i ? 'ev-pag-dot-active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                  />
                ))}
              </div>

              <button className="ev-pag-arrow" onClick={handleNextPage} disabled={totalPages <= 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="ev-pag-info">
                Page {currentPage + 1} / {totalPages}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── Event Details Modal ──────────────────────── */}
      <EventDetailsModal event={selectedEvent} onClose={closeEventDetails} />

      {/* ── Live Event Modal ──────────────────────────– */}
      <LiveEventModal event={liveEvent} onClose={closeLiveEvent} />

      {/* ── Scroll-to-top FAB ─────────────────────────── */}
      <button className="ev-fab" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

    </div>
  );
}

export default EventsPage;