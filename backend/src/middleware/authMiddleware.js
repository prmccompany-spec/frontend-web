import { verifyToken } from '../utils/tokenUtils.js';
import { getStaffAuthStatusById } from '../models/staffUserModel.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (decoded.account_type === 'staff') {
      const staff = await getStaffAuthStatusById(decoded.id);
      if (!staff || !staff.is_active) {
        return res.status(401).json({ success: false, message: 'Staff account is inactive' });
      }
      req.user = { ...decoded, user_type_id: staff.user_type_id, type_name: staff.type_name };
    } else {
      req.user = decoded;
    }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

export const requireTypes = (...typeIds) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (typeIds.length > 0 && !typeIds.includes(req.user.user_type_id)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

export const requireMemberAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (req.user.account_type && req.user.account_type !== 'member') {
    return res.status(403).json({ success: false, message: 'This action is only available to member accounts' });
  }
  next();
};
