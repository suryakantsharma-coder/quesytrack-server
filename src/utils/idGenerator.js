/**
 * Custom ID Generator Utility
 * Generates unique custom IDs for different models
 * Format: PREFIX-XXX (e.g., P-001, R-001, G-001, C-001)
 * 
 * Prefixes:
 * - P: Project
 * - R: Report
 * - G: Gauge
 * - C: Calibration
 */

/**
 * Generate a custom ID with prefix
 * @param {string} prefix - The prefix for the ID (P, R, G, C)
 * @param {number} sequence - The sequence number
 * @returns {string} - Generated custom ID (e.g., P-001)
 */
const generateCustomId = (prefix, sequence) => {
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}-${seqStr}`;
};

/**
 * Get the next sequence number for a model
 * @param {Model} Model - Mongoose model
 * @param {string} idField - The field name for custom ID
 * @param {string} prefix - The prefix for the ID
 * @returns {Promise<number>} - Next sequence number
 */
const getNextSequence = async (Model, idField, prefix) => {
  // Find the latest document with this prefix
  const latestDoc = await Model.findOne({
    [idField]: { $regex: `^${prefix}-` }
  }).sort({ [idField]: -1 });
  
  if (latestDoc && latestDoc[idField]) {
    // Extract the sequence number from the last ID (e.g., P-001 -> 1)
    const lastId = latestDoc[idField];
    const lastSeq = parseInt(lastId.split('-')[1], 10);
    return lastSeq + 1;
  }
  
  return 1;
};

/**
 * Generate next custom ID for a model
 * @param {Model} Model - Mongoose model
 * @param {string} idField - The field name for custom ID
 * @param {string} prefix - The prefix for the ID
 * @returns {Promise<string>} - Generated custom ID
 */
const generateNextCustomId = async (Model, idField, prefix) => {
  const nextSeq = await getNextSequence(Model, idField, prefix);
  return generateCustomId(prefix, nextSeq);
};

/**
 * Reset sequence for a model (deletes all documents or resets to specific number)
 * @param {Model} Model - Mongoose model
 * @param {string} idField - The field name for custom ID
 * @param {string} prefix - The prefix for the ID
 * @param {number} startFrom - Starting sequence number (default: 1)
 * @returns {Promise<Object>} - Result of the reset operation
 */
const resetSequence = async (Model, idField, prefix, startFrom = 1) => {
  // Get count of documents with this prefix
  const count = await Model.countDocuments({
    [idField]: { $regex: `^${prefix}-` }
  });

  // Update all existing documents with new sequential IDs starting from startFrom
  const documents = await Model.find({
    [idField]: { $regex: `^${prefix}-` }
  }).sort({ createdAt: 1 });

  let currentSeq = startFrom;
  for (const doc of documents) {
    doc[idField] = generateCustomId(prefix, currentSeq);
    await doc.save();
    currentSeq++;
  }

  return {
    message: `Reset ${count} documents. IDs now start from ${prefix}-${String(startFrom).padStart(3, '0')}`,
    documentsUpdated: count,
    nextId: generateCustomId(prefix, currentSeq),
  };
};

/**
 * Get current sequence info for a model
 * @param {Model} Model - Mongoose model
 * @param {string} idField - The field name for custom ID
 * @param {string} prefix - The prefix for the ID
 * @returns {Promise<Object>} - Current sequence info
 */
const getSequenceInfo = async (Model, idField, prefix) => {
  const count = await Model.countDocuments({
    [idField]: { $regex: `^${prefix}-` }
  });

  const latestDoc = await Model.findOne({
    [idField]: { $regex: `^${prefix}-` }
  }).sort({ [idField]: -1 });

  const lastId = latestDoc ? latestDoc[idField] : null;
  const lastSeq = lastId ? parseInt(lastId.split('-')[1], 10) : 0;

  return {
    prefix,
    totalDocuments: count,
    lastId,
    lastSequence: lastSeq,
    nextId: generateCustomId(prefix, lastSeq + 1),
  };
};

module.exports = {
  generateCustomId,
  getNextSequence,
  generateNextCustomId,
  resetSequence,
  getSequenceInfo,
};
