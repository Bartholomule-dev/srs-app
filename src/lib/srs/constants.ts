/**
 * SRS Constants
 *
 * Shared constants for the Spaced Repetition System.
 */

/**
 * The minimum quality rating for an answer to be considered "passing" for SRS purposes.
 *
 * Quality ratings follow the FSRS scale (0-5):
 * - 0: Complete blackout, no recall
 * - 1: Incorrect, but upon seeing answer, remembered
 * - 2: Incorrect, but answer seemed familiar
 * - 3: Correct, but required significant effort (Hard)
 * - 4: Correct, with some hesitation (Good)
 * - 5: Correct, instant recall (Easy)
 *
 * A rating of 3 or higher means the user recalled the answer correctly,
 * even if it required effort. This threshold determines:
 * - Whether an answer counts as "correct" in session statistics
 * - Whether the SRS algorithm treats the review as successful
 */
export const QUALITY_PASSING_THRESHOLD = 3;
