/** Parse a flat explanation string into per-option reasons.
 *  Format: "[Letter]. [correct reason]... Incorrect: [A]. [reason] [B]. [reason]..."
 */
export function parseExplanation(
  explanation: string,
  optionCount: number,
  correctIdx: number
): { correctReason: string; optionReasons: Record<number, string> } {
  const [correctPart, incorrectPart = ''] = explanation.split(/Incorrect:\s*/i);

  // Extract the reason for the correct answer (strip leading letter prefix e.g. "C. ")
  const correctReason = correctPart.replace(/^[A-E]\.\s+/, '').trim();

  const optionReasons: Record<number, string> = {};

  // Map correct option to the correctReason
  optionReasons[correctIdx] = correctReason;

  // Parse wrong-answer reasons from the "Incorrect:" section
  if (incorrectPart) {
    // Split on letter+period boundaries: "A. ", "B. ", etc.
    const parts = incorrectPart.split(/(?=[A-E]\.\s)/);
    for (const part of parts) {
      const m = part.match(/^([A-E])\.\s+([\s\S]+)/);
      if (m) {
        const idx = m[1].charCodeAt(0) - 65;
        if (idx >= 0 && idx < optionCount && idx !== correctIdx) {
          optionReasons[idx] = m[2].replace(/\s+/g, ' ').trim();
        }
      }
    }
  }

  return { correctReason, optionReasons };
}
