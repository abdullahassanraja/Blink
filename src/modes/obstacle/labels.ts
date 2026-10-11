/**
 * Relevant Obstacle Labels
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 4 Step 4
 *
 * Filter for obstacles relevant to visually impaired navigation.
 * Based on COCO dataset classes detected by EfficientDet-Lite0.
 */

export const RELEVANT_OBSTACLES: Record<string, string> = {
  person: 'Person',
  chair: 'Chair',
  couch: 'Couch',
  bed: 'Bed',
  'dining table': 'Table',
  bench: 'Bench',
  'potted plant': 'Plant',
  backpack: 'Backpack',
  suitcase: 'Suitcase',
  bicycle: 'Bicycle',
  car: 'Car',
  motorcycle: 'Motorcycle',
  bus: 'Bus',
  truck: 'Truck',
  dog: 'Dog',
  cat: 'Cat',
  tv: 'Screen',
  laptop: 'Laptop',
  door: 'Door',
  stairs: 'Stairs',
}

export function isRelevantObstacle(categoryName: string): boolean {
  const normalized = categoryName.toLowerCase().trim()
  return Boolean(RELEVANT_OBSTACLES[normalized])
}

export function getSpokenLabel(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim()
  return RELEVANT_OBSTACLES[normalized] ?? categoryName
}
