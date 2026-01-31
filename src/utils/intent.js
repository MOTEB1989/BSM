export const extractIntent = (text) => {
  const normalized = text.toLowerCase();

  if (normalized.includes("create agent") || normalized.includes("إنشاء وكيل")) {
    return "create_agent";
  }
  if (normalized.includes("update file") || normalized.includes("تعديل ملف")) {
    return "update_file";
  }

  return "none";
};

export const intentToAction = (intent) => {
  switch (intent) {
    case "create_agent":
      return "create_file";
    case "update_file":
      return "update_file";
    default:
      return null;
  }
};
