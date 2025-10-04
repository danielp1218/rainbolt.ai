/**
 * Mock chat function - simulates API call with latency
 * Replace this with actual API call when backend is ready
 */
export async function sendMessageMock(_text: string): Promise<{ text: string }> {
  // Simulate network latency (600-900ms)
  const delay = 600 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, delay));
  
  return { text: "hello world" };
}
