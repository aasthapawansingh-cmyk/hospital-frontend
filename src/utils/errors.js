export function getErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join(", ");
  }

  if (typeof data === "object") {
    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    return Object.entries(data)
      .map(([field, value]) => `${field}: ${value}`)
      .join(", ");
  }

  return fallback;
}
