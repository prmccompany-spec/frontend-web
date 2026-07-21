import twilio from 'twilio';
import dotenv from 'dotenv';
import { toE164 } from '../utils/phoneUtils.js';

dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

let client;
const getClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    const err = new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID.');
    err.statusCode = 500;
    throw err;
  }
  if (!client) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return client;
};

export const sendOtp = async (phone) => {
  const to = toE164(phone);
  await getClient().verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to, channel: 'sms' });
  return { phone: to };
};

export const checkOtp = async (phone, code) => {
  const to = toE164(phone);
  const result = await getClient().verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to, code });
  return result.status === 'approved';
};
