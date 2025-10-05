/**
 * Utility functions for parsing course data that might be JSON-encoded strings
 */

export const parseStringArray = (data: any): string[] => {
  if (!data) return [];
  
  // If it's already an array, check if items need parsing
  if (Array.isArray(data)) {
    return data.map(item => {
      // If array items are JSON strings, parse them
      if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
          return item;
        }
      }
      return item;
    });
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If JSON parsing fails, return as single item
      return [data];
    }
  }
  
  return [];
};

export const parseCourseData = (course: any) => {
  return {
    ...course,
    prerequisites: parseStringArray(course.prerequisites),
    outcomes: parseStringArray(course.outcomes)
  };
};
