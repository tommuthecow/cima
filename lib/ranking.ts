export type Bucket = 'liked' | 'fine' | 'disliked'

export interface BucketConfig {
  minScore: number
  maxScore: number
}

export const BUCKET_CONFIGS: Record<Bucket, BucketConfig> = {
  liked: { minScore: 6.7, maxScore: 10 },
  fine: { minScore: 3.4, maxScore: 6.6 },
  disliked: { minScore: 0, maxScore: 3.3 }
}

export interface RankingItem {
  id: string
  rank: number
}

export function deriveScore(bucket: Bucket, rank: number, totalInBucket: number): number {
  const config = BUCKET_CONFIGS[bucket]
  const { minScore, maxScore } = config
  
  if (totalInBucket === 1) {
    return (minScore + maxScore) / 2
  }
  
  const position = rank / (totalInBucket - 1)
  return maxScore - position * (maxScore - minScore)
}

export function binaryInsertionComparisons(
  items: RankingItem[],
  newItemId: string
): { comparisons: Array<{ itemId: string; rank: number }>, insertAt: number } {
  if (items.length === 0) {
    return { comparisons: [], insertAt: 0 }
  }
  
  let left = 0
  let right = items.length - 1
  const comparisons: Array<{ itemId: string; rank: number }> = []
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    comparisons.push({ itemId: items[mid].id, rank: items[mid].rank })
    
    return {
      comparisons,
      insertAt: mid
    }
  }
  
  return { comparisons: [], insertAt: left }
}

export function updateRanks(
  items: RankingItem[],
  insertAt: number,
  newItemId: string
): RankingItem[] {
  const newItems = [...items]
  
  newItems.splice(insertAt, 0, { id: newItemId, rank: insertAt })
  
  for (let i = 0; i < newItems.length; i++) {
    newItems[i].rank = i
  }
  
  return newItems
}

export interface ComparisonState {
  newTitleId: string
  bucket: Bucket
  currentComparisons: Array<{ titleId: string; rank: number }>
  comparisonIndex: number
  left: number
  right: number
  skippedComparisons: Set<number>
}

export function initializeComparison(
  newTitleId: string,
  bucket: Bucket,
  existingItems: RankingItem[]
): ComparisonState {
  const comparisons: Array<{ titleId: string; rank: number }> = []
  
  if (existingItems.length > 0) {
    const mid = Math.floor(existingItems.length / 2)
    comparisons.push({ titleId: existingItems[mid].id, rank: existingItems[mid].rank })
  }
  
  return {
    newTitleId,
    bucket,
    currentComparisons: comparisons,
    comparisonIndex: 0,
    left: 0,
    right: existingItems.length - 1,
    skippedComparisons: new Set()
  }
}

export function getNextComparison(
  state: ComparisonState,
  userPreferredNew: boolean,
  existingItems: RankingItem[]
): ComparisonState | null {
  const currentComparison = state.currentComparisons[state.comparisonIndex]
  const currentMid = existingItems.findIndex(item => item.id === currentComparison.titleId)
  
  let newLeft = state.left
  let newRight = state.right
  
  if (userPreferredNew) {
    newRight = currentMid - 1
  } else {
    newLeft = currentMid + 1
  }
  
  if (newLeft > newRight) {
    return null
  }
  
  const newMid = Math.floor((newLeft + newRight) / 2)
  const nextComparison = existingItems[newMid]
  
  return {
    ...state,
    currentComparisons: [...state.currentComparisons, { titleId: nextComparison.id, rank: nextComparison.rank }],
    comparisonIndex: state.comparisonIndex + 1,
    left: newLeft,
    right: newRight
  }
}

export function getFinalInsertPosition(
  state: ComparisonState,
  userPreferredNew: boolean,
  existingItems: RankingItem[]
): number {
  const currentComparison = state.currentComparisons[state.comparisonIndex]
  const currentMid = existingItems.findIndex(item => item.id === currentComparison.titleId)
  
  if (userPreferredNew) {
    return currentMid
  } else {
    return currentMid + 1
  }
}
