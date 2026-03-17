/**
 * Stage dependency map for renovation planning.
 * Keys correspond to order_index of stages in stageBreakdown.ts
 *
 * 1. Демонтаж
 * 2. Электрика (черновая)
 * 3. Сантехника (черновая)
 * 4. Стяжка пола
 * 5. Штукатурка стен
 * 6. Укладка плитки
 * 7. Электрика (чистовая)
 * 8. Сантехника (чистовая)
 * 9. Шпаклёвка и покраска
 * 10. Напольное покрытие
 * 11. Установка дверей
 * 12. Монтаж потолков
 * 13. Чистовая отделка
 * 14. Финальная уборка
 */

export interface StageDependency {
  /** This stage can only start AFTER ALL of these stages are approved */
  must_after: number[];
  /** This stage can run simultaneously with these stages */
  can_parallel_with: number[];
}

export const STAGE_DEPENDENCIES: Record<number, StageDependency> = {
  1: {
    must_after: [],
    can_parallel_with: [],
  },
  2: {
    must_after: [1],
    can_parallel_with: [3],        // Электрика ↔ Сантехника (черновая)
  },
  3: {
    must_after: [1],
    can_parallel_with: [2],        // Сантехника ↔ Электрика (черновая)
  },
  4: {
    must_after: [2, 3],            // After BOTH electrical and plumbing rough-in
    can_parallel_with: [],
  },
  5: {
    must_after: [4],               // After floor screed
    can_parallel_with: [],
  },
  6: {
    must_after: [5],               // After plastering
    can_parallel_with: [7, 8, 9],  // Tile ↔ fin. electrical ↔ fin. plumbing ↔ paint
  },
  7: {
    must_after: [5],
    can_parallel_with: [6, 8, 9],
  },
  8: {
    must_after: [5],
    can_parallel_with: [6, 7, 9],
  },
  9: {
    must_after: [5],
    can_parallel_with: [6, 7, 8],  // Painting can run with finish trades
  },
  10: {
    must_after: [4],               // Flooring after screed (can be laid before painting)
    can_parallel_with: [11, 12],
  },
  11: {
    must_after: [5],               // Doors after plastering
    can_parallel_with: [10, 12],
  },
  12: {
    must_after: [5],               // Ceilings after plastering
    can_parallel_with: [10, 11],
  },
  13: {
    must_after: [9, 10, 11, 12],   // Final trim after everything else
    can_parallel_with: [],
  },
  14: {
    must_after: [13],              // Cleaning is always last
    can_parallel_with: [],
  },
};

/**
 * Returns true if stage with `stageIndex` can start given the set of approved stage indices.
 */
export function canStartStage(
  stageIndex: number,
  approvedIndices: Set<number>,
): boolean {
  const dep = STAGE_DEPENDENCIES[stageIndex];
  if (!dep) return true;
  return dep.must_after.every((required) => approvedIndices.has(required));
}

/**
 * Returns list of stage indices that are unlocked given approved set.
 */
export function getUnlockedStages(
  approvedIndices: Set<number>,
  totalStages: number = 14,
): number[] {
  const result: number[] = [];
  for (let i = 1; i <= totalStages; i++) {
    if (!approvedIndices.has(i) && canStartStage(i, approvedIndices)) {
      result.push(i);
    }
  }
  return result;
}
