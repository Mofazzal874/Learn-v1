// Centralized categories for courses and videos
export const CATEGORIES = [
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Artificial Intelligence',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'Database',
  'UI/UX Design',
  'Graphic Design',
  'Business',
  'Marketing',
  'Finance',
  'Photography',
  'Music',
  'Art & Craft',
  'Health & Fitness',
  'Lifestyle',
  'Cooking',
  'Language Learning',
  'Education',
  'Science',
  'Mathematics',
  'Miscellaneous'
] as const;

export type Category = typeof CATEGORIES[number];

export const getCategoryOptions = () => {
  return CATEGORIES.map(category => ({
    value: category.toLowerCase(),
    label: category
  }));
};