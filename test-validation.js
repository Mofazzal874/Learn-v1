// Test validation function
const invalidKeywords = [
  "weather", 
  "score",
  "news",
  "today",
  "current",
  "calculate",
  "what is",
  "who is",
  "where is",
  "when is",
  "why is",
  "how to fix",
  "debug",
  "error",
  "problem",
  "hi",
  "hello",
  "hey",
  "howdy"
].filter(keyword => keyword && keyword.trim().length > 0);

const validatePrompt = (prompt) => {
  const lowerCasePrompt = prompt.toLowerCase().trim();
  
  console.log("Validating prompt:", lowerCasePrompt);
  
  // Check minimum length
  if (lowerCasePrompt.length < 3) {
    throw new Error("Please enter a longer topic description.");
  }

  // Check maximum length
  if (lowerCasePrompt.length > 200) {
    throw new Error("Please enter a shorter topic description.");
  }

  // Check for invalid keywords
  const matchedKeyword = invalidKeywords.find(keyword => lowerCasePrompt.includes(keyword));
  console.log("Matched keyword:", matchedKeyword);
  if (matchedKeyword) {
    throw new Error(`Please enter a topic you want to learn about, rather than a question or problem.`);
  }

  return true;
};

// Test cases
const testPrompts = [
  "Machine Learning",
  "machine learning",
  "Web Development",
  "what is python",
  "how to fix bug",
  "React and Node.js",
  "Data Science"
];

console.log("Testing validation function:");
testPrompts.forEach(prompt => {
  try {
    const result = validatePrompt(prompt);
    console.log(`✅ "${prompt}": PASSED`);
  } catch (error) {
    console.log(`❌ "${prompt}": FAILED - ${error.message}`);
  }
});
