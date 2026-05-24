import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  updateEventImage,
  deactivateEvent,
} from '../models/eventModel.js';

const parseEvent = (event) => {
  if (!event) return null;
  return {
    ...event,
    highlights: (() => {
      try { return JSON.parse(event.highlights || '[]'); } catch { return []; }
    })(),
    is_live: Boolean(event.is_live),
    is_active: Boolean(event.is_active),
  };
};

export const addEvent = async (data) => {
  if (!data.title?.trim()) {
    const err = new Error('title is required'); err.statusCode = 400; throw err;
  }
  if (!data.date) {
    const err = new Error('date is required'); err.statusCode = 400; throw err;
  }
  return await createEvent(data);
};

export const fetchAllEvents = async (status) => {
  const rows = await getAllEvents(status);
  return rows.map(parseEvent);
};

export const fetchEventById = async (id) => {
  const event = await getEventById(id);
  if (!event) {
    const err = new Error('Event not found'); err.statusCode = 404; throw err;
  }
  return parseEvent(event);
};

export const modifyEvent = async (id, data) => {
  const event = await getEventById(id);
  if (!event) {
    const err = new Error('Event not found'); err.statusCode = 404; throw err;
  }
  return await updateEvent(id, data);
};

export const saveEventImage = async (id, imagePath) => {
  const event = await getEventById(id);
  if (!event) {
    const err = new Error('Event not found'); err.statusCode = 404; throw err;
  }
  return await updateEventImage(id, imagePath);
};

export const removeEvent = async (id) => {
  const event = await getEventById(id);
  if (!event) {
    const err = new Error('Event not found'); err.statusCode = 404; throw err;
  }
  return await deactivateEvent(id);
};
