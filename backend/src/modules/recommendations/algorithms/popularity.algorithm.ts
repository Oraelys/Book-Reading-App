export class PopularityAlgorithm {

  static score(
    popularity: number,
    trending: number,
  ) {

    return popularity * 0.7 +
           trending * 0.3;

  }

}