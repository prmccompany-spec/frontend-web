import { query } from '../config/database.js';

export const createEvent = async (data) => {
  const {
    title,
    status = 'upcoming',
    date,
    start_time       = null,
    end_time         = null,
    location         = null,
    attendees        = null,
    short_description = null,
    full_description  = null,
    highlights       = '[]',
    organizer        = null,
    contact_person   = null,
    phone            = null,
    is_live          = false,
    video_link       = null,
    image            = null,
  } = data;

  const result = await query(
    `INSERT INTO events
      (title, status, date, start_time, end_time, location, attendees,
       short_description, full_description, highlights,
       organizer, contact_person, phone, is_live, video_link, image, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      title, status, date, start_time, end_time, location, attendees,
      short_description, full_description,
      typeof highlights === 'string' ? highlights : JSON.stringify(highlights),
      organizer, contact_person, phone,
      is_live ? 1 : 0, video_link, image,
    ]
  );
  return result.insertId;
};

export const getAllEvents = async (status = null) => {
  if (status) {
    return await query(
      'SELECT * FROM events WHERE is_active = 1 AND status = ? ORDER BY date DESC',
      [status]
    );
  }
  return await query('SELECT * FROM events WHERE is_active = 1 ORDER BY date DESC');
};

export const getEventById = async (id) => {
  const rows = await query('SELECT * FROM events WHERE id = ? AND is_active = 1', [id]);
  return rows[0] || null;
};

export const updateEvent = async (id, data) => {
  const fields = [];
  const values = [];

  const allowed = [
    'title', 'status', 'date', 'start_time', 'end_time', 'location', 'attendees',
    'short_description', 'full_description', 'organizer', 'contact_person',
    'phone', 'video_link', 'image',
  ];

  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });

  if (data.highlights !== undefined) {
    fields.push('highlights = ?');
    values.push(typeof data.highlights === 'string' ? data.highlights : JSON.stringify(data.highlights));
  }

  if (data.is_live !== undefined) {
    fields.push('is_live = ?');
    values.push(data.is_live ? 1 : 0);
  }

  if (fields.length === 0) return null;

  values.push(id);
  return await query(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const updateEventImage = async (id, imagePath) => {
  return await query('UPDATE events SET image = ? WHERE id = ?', [imagePath, id]);
};

export const deactivateEvent = async (id) => {
  return await query('UPDATE events SET is_active = 0 WHERE id = ?', [id]);
};
