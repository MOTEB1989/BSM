import { loadKnowledgeIndex } from "../services/knowledgeService.js";

export const listKnowledge = async (req, res, next) => {
  try {
    const docs = await loadKnowledgeIndex();
    res.json({ documents: docs, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};
