export const getHealth = (req, res) => {
  res.json({ status: "ok", timestamp: Date.now(), correlationId: req.correlationId });
};
