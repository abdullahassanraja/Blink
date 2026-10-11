/**
 * Blink Central Confidence & Uncertainty Manager
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 6 Step 4 & 5
 *
 * Centralizes all confidence thresholds across modes and provides
 * a unified helper for honest uncertainty phrasing.
 */

import { strings, Lang } from '../config/strings'

export const CONFIDENCE_THRESHOLDS = {
  // Money identifier: requires 85% top probability, 20% margin over second, and 3 consecutive frame wins
  moneyTopP: 0.85,
  moneyMargin: 0.20,
  moneyConsecutiveFrames: 3,

  // Obstacle detector: requires 50% detection confidence
  obstacleScore: 0.50,

  // Scene description: requires 70% confidence
  describeConfidence: 0.70,

  // Auto-rescan countdown delay (ms)
  rescanDelayMs: 4000,
} as const

export type UnsureReason =
  | 'unlegible'
  | 'money_not_sure'
  | 'money_no_note'
  | 'describe_unsure'
  | 'too_dark'
  | 'offline_describe'

/**
 * Returns the standard, honest spoken line when a mode is uncertain.
 * No mode invents its own wording.
 */
export function unsure(reason: UnsureReason, lang: Lang = 'en'): string {
  const langStrings = strings[lang] ?? strings.en

  switch (reason) {
    case 'unlegible':
      return langStrings.readUnlegible
    case 'money_not_sure':
      return langStrings.moneyNotSure
    case 'money_no_note':
      return langStrings.moneyNoNote
    case 'describe_unsure':
      return langStrings.describeUnsure
    case 'too_dark':
      return langStrings.alertTooDark
    case 'offline_describe':
      return langStrings.describeOffline
    default:
      return 'I am not sure.'
  }
}

/**
 * Determines whether the failure reason qualifies for an automatic 4-second rescan.
 */
export function isRescanEligible(reason?: string): boolean {
  return reason === 'unlegible' || reason === 'money_not_sure' || reason === 'money_no_note'
}
