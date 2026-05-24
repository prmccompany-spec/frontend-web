import { asyncHandler } from '../middleware/errorHandler.js';
import {
  addEvent,
  fetchAllEvents,
  fetchEventById,
  modifyEvent,
  saveEventImage,
  removeEvent,
} from '../services/eventService.js';

export const listEvents = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const events = await fetchAllEvents(status || null);
  res.json({ success: true, count: events.length, data: events });
});

export const getEvent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid event ID' });
  }
  const event = await fetchEventById(id);
  res.json({ success: true, data: event });
});

// Normalise camelCase FormData keys → snake_case, empty strings → null
const normaliseBody = (raw, file) => {
  const s = (v) => (v === '' || v === undefined ? null : v);
  const isLiveRaw = raw.isLive ?? raw.is_live;

  let highlights = raw.highlights ?? '[]';
  if (typeof highlights === 'string') {
    try { highlights = JSON.parse(highlights); } catch { highlights = []; }
  }

  return {
    title:             s(raw.title),
    status:            s(raw.status) ?? 'upcoming',
    date:              s(raw.date),
    start_time:        s(raw.startTime   ?? raw.start_time),
    end_time:          s(raw.endTime     ?? raw.end_time),
    location:          s(raw.location),
    attendees:         s(raw.attendees),
    short_description: s(raw.shortDescription ?? raw.short_description),
    full_description:  s(raw.fullDescription  ?? raw.full_description),
    highlights,
    organizer:         s(raw.organizer),
    contact_person:    s(raw.contactPerson  ?? raw.contact_person),
    phone:             s(raw.phone),
    is_live:           isLiveRaw === 'true' || isLiveRaw === true,
    video_link:        s(raw.videoLink ?? raw.video_link),
    image:             file ? `uploads/events/${file.filename}` : s(raw.image),
  };
};

export const createEvent = asyncHandler(async (req, res) => {
  const body = normaliseBody(req.body, req.file);
  const eventId = await addEvent(body);
  res.status(201).json({ success: true, message: 'Event created successfully', eventId });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid event ID' });
  }
  const body = normaliseBody(req.body, req.file);
  await modifyEvent(id, body);
  res.json({ success: true, message: 'Event updated successfully' });
});

export const uploadEventImage = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid event ID' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  const imagePath = `uploads/events/${req.file.filename}`;
  await saveEventImage(id, imagePath);
  res.json({ success: true, message: 'Event image uploaded', image: imagePath });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid event ID' });
  }
  await removeEvent(id);
  res.json({ success: true, message: 'Event deleted successfully' });
});
