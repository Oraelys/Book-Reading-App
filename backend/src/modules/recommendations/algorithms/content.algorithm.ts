export class ContentAlgorithm {

  static similarity(
    categoryMatch: boolean,
    authorMatch: boolean,
    tagMatches: number,
  ) {

    let score = 0;

    if (categoryMatch)
      score += 40;

    if (authorMatch)
      score += 20;

    score += tagMatches * 10;

    return score;

  }

}