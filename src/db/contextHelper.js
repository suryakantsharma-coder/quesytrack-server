import mongoose from 'mongoose';
import Project from '../models/project.model.js';
import Calibration from '../models/calibration.model.js';
import Gauge from '../models/gauge.model.js';
import Report from '../models/report.model.js';
import User from '../models/user.model.js';

const LIMIT_PER_COLLECTION = 20;

/**
 * Keyword-based intent detection.
 * Returns an array of collection names to query (e.g. ['projects', 'calibrations']).
 */
export function detectIntent(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase().trim();
  const intents = [];

  if (/\b(project|projects)\b/.test(lower)) intents.push('projects');
  if (/\b(calibration|calibrations)\b/.test(lower)) intents.push('calibrations');
  if (/\b(gauge|gauges)\b/.test(lower)) intents.push('gauges');
  if (/\b(report|reports)\b/.test(lower)) intents.push('reports');
  if (/\b(service|services)\b/.test(lower)) intents.push('services');
  if (/\b(user|users|account|accounts)\b/.test(lower)) intents.push('users');
  if (/\b(help|faq|faqs)\b/.test(lower)) intents.push('faqs');

  if (intents.length === 0) {
    intents.push('projects', 'calibrations', 'gauges', 'reports');
  }
  return [...new Set(intents)];
}

/**
 * Fetch documents from MongoDB for the given intents and build a context string.
 */
export async function getContextForMessage(lastMessageContent) {
  const intents = detectIntent(lastMessageContent);
  const parts = [];

  for (const intent of intents) {
    try {
      if (intent === 'projects') {
        const docs = await Project.find().limit(LIMIT_PER_COLLECTION).lean();
        if (docs.length) parts.push('Projects:\n' + JSON.stringify(docs, null, 0));
      } else if (intent === 'calibrations') {
        const docs = await Calibration.find().limit(LIMIT_PER_COLLECTION).lean();
        if (docs.length) parts.push('Calibrations:\n' + JSON.stringify(docs, null, 0));
      } else if (intent === 'gauges') {
        const docs = await Gauge.find().limit(LIMIT_PER_COLLECTION).lean();
        if (docs.length) parts.push('Gauges:\n' + JSON.stringify(docs, null, 0));
      } else if (intent === 'reports') {
        const docs = await Report.find().limit(LIMIT_PER_COLLECTION).lean();
        if (docs.length) parts.push('Reports:\n' + JSON.stringify(docs, null, 0));
      } else if (intent === 'users') {
        const docs = await User.find().select('-password').limit(LIMIT_PER_COLLECTION).lean();
        if (docs.length) parts.push('Users (no passwords):\n' + JSON.stringify(docs, null, 0));
      } else if (intent === 'services' || intent === 'faqs') {
        const db = mongoose.connection.db;
        if (!db) continue;
        const collName = intent === 'services' ? 'services' : 'faqs';
        const coll = db.collection(collName);
        const docs = await coll.find({}).limit(LIMIT_PER_COLLECTION).toArray();
        if (docs.length) parts.push(`${collName}:\n` + JSON.stringify(docs, null, 0));
      }
    } catch (err) {
      console.error(`contextHelper: error fetching ${intent}:`, err.message);
    }
  }

  return parts.length ? parts.join('\n\n') : '';
}
