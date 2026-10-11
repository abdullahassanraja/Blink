/**
 * Obstacle Detection Logic & Spatial Mapping
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 4 Step 4
 *
 * Translates bounding box geometry into actionable directional alerts:
 * - Position (left / ahead / right)
 * - Distance estimate buckets (very close / close / near)
 * - Priority calculation (closest and central prioritized)
 *
 * Note: Single-camera distance estimation uses relative bounding box area
 * as a heuristic proxy for proximity.
 */

import { isRelevantObstacle, getSpokenLabel } from './labels'

export type Position = 'left' | 'ahead' | 'right'
export type DistanceBucket = 'very close' | 'close' | 'near'

export interface BoundingBox {
  originX: number
  originY: number
  width: number
  height: number
}

export interface DetectionInput {
  categories: Array<{ categoryName: string; score: number }>
  boundingBox?: BoundingBox
}

export interface ProcessedObstacle {
  label: string
  rawLabel: string
  position: Position
  bucket: DistanceBucket
  score: number
  boxAreaRatio: number
  centerXRatio: number
  priority: number
}

/**
 * Maps bounding box center X to position bucket:
 * Under 0.33 is 'left', over 0.66 is 'right', otherwise 'ahead'.
 */
export function calculatePosition(box: BoundingBox, frameWidth: number): Position {
  const centerX = box.originX + box.width / 2
  const ratio = centerX / frameWidth

  if (ratio < 0.33) return 'left'
  if (ratio > 0.66) return 'right'
  return 'ahead'
}

/**
 * Maps bounding box area ratio to distance bucket:
 * Area = (box.width * box.height) / (frameWidth * frameHeight)
 * - Over 0.35: 'very close'
 * - Over 0.15: 'close'
 * - Over 0.05: 'near'
 * - Below 0.05: null (too distant to be an immediate hazard)
 */
export function calculateDistanceBucket(
  box: BoundingBox,
  frameWidth: number,
  frameHeight: number
): { bucket: DistanceBucket; areaRatio: number } | null {
  const frameArea = frameWidth * frameHeight
  if (frameArea <= 0) return null

  const boxArea = box.width * box.height
  const areaRatio = boxArea / frameArea

  if (areaRatio >= 0.35) return { bucket: 'very close', areaRatio }
  if (areaRatio >= 0.15) return { bucket: 'close', areaRatio }
  if (areaRatio >= 0.05) return { bucket: 'near', areaRatio }
  return null
}

/**
 * Computes priority score where closest and most central objects rank highest.
 */
function computePriority(bucket: DistanceBucket, position: Position, score: number): number {
  let bucketWeight = 1
  if (bucket === 'very close') bucketWeight = 10
  else if (bucket === 'close') bucketWeight = 5
  else if (bucket === 'near') bucketWeight = 2

  const positionWeight = position === 'ahead' ? 3 : 1
  return bucketWeight * 10 + positionWeight * 5 + score
}

/**
 * Processes raw MediaPipe detections, filters relevant obstacles,
 * and returns the single highest priority obstacle for this cycle.
 */
export function selectPrimaryObstacle(
  detections: DetectionInput[],
  frameWidth: number,
  frameHeight: number
): ProcessedObstacle | null {
  const candidates: ProcessedObstacle[] = []

  for (const det of detections) {
    if (!det.boundingBox || !det.categories?.length) continue

    const category = det.categories[0]
    if (!isRelevantObstacle(category.categoryName)) continue

    const distanceData = calculateDistanceBucket(det.boundingBox, frameWidth, frameHeight)
    if (!distanceData) continue

    const position = calculatePosition(det.boundingBox, frameWidth)
    const label = getSpokenLabel(category.categoryName)
    const priority = computePriority(distanceData.bucket, position, category.score)

    candidates.push({
      label,
      rawLabel: category.categoryName,
      position,
      bucket: distanceData.bucket,
      score: category.score,
      boxAreaRatio: distanceData.areaRatio,
      centerXRatio: (det.boundingBox.originX + det.boundingBox.width / 2) / frameWidth,
      priority,
    })
  }

  if (!candidates.length) return null

  // Sort descending by priority (closest + most central first)
  candidates.sort((a, b) => b.priority - a.priority)
  return candidates[0]
}
