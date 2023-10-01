/**
 * https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values/55614659#55614659
 * assumes array elements are primitive types
 * check whether 2 arrays are equal sets.
 * @param a1 is an array
 * @param a2 is an array
 */
export function areArraysEqualSets<T>(a1: T[], a2: T[]): boolean {
  const superSet: {[index: string]: number} = {};
  for (const i of a1) {
    const e = i + typeof i;
    superSet[e] = 1;
  }

  for (const i of a2) {
    const e = i + typeof i;
    if (!superSet[e]) {
      return false;
    }
    superSet[e] = 2;
  }

  for (let e in superSet) {
    if (superSet[e] === 1) {
      return false;
    }
  }

  return true;
}
