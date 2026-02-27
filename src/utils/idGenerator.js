const generateCustomId = (prefix, sequence) => {
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}-${seqStr}`;
};

const getNextSequence = async (Model, idField, prefix) => {
  const latestDoc = await Model.findOne({
    [idField]: { $regex: `^${prefix}-` },
  }).sort({ [idField]: -1 });

  if (latestDoc && latestDoc[idField]) {
    const lastSeq = parseInt(latestDoc[idField].split('-')[1], 10);
    return lastSeq + 1;
  }
  return 1;
};

const generateNextCustomId = async (Model, idField, prefix) => {
  const nextSeq = await getNextSequence(Model, idField, prefix);
  return generateCustomId(prefix, nextSeq);
};

const resetSequence = async (Model, idField, prefix, startFrom = 1) => {
  const count = await Model.countDocuments({
    [idField]: { $regex: `^${prefix}-` },
  });
  const documents = await Model.find({
    [idField]: { $regex: `^${prefix}-` },
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

const getSequenceInfo = async (Model, idField, prefix) => {
  const count = await Model.countDocuments({
    [idField]: { $regex: `^${prefix}-` },
  });
  const latestDoc = await Model.findOne({
    [idField]: { $regex: `^${prefix}-` },
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

export {
  generateCustomId,
  getNextSequence,
  generateNextCustomId,
  resetSequence,
  getSequenceInfo,
};
