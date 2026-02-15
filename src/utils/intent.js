export const extractIntent = (text) => {
  const normalized = text.toLowerCase();

  if (normalized.includes("create agent") || normalized.includes("إنشاء وكيل")) {
    return "create_agent";
  }
  if (normalized.includes("update file") || normalized.includes("تعديل ملف")) {
    return "update_file";
  }
  if (
    normalized.includes("[execute_command]") ||
    normalized.includes("تنفيذ أمر") ||
    normalized.includes("execute command") ||
    normalized.includes("run command") ||
    normalized.includes("تشغيل أمر")
  ) {
    return "execute_command";
  }

  return "none";
};

export const intentToAction = (intent) => {
  switch (intent) {
    case "create_agent":
      return "create_file";
    case "update_file":
      return "update_file";
    case "execute_command":
      return "execute_command";
    default:
      return null;
  }
};
