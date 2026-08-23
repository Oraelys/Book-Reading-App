export class CollaborativeAlgorithm {

  static score(

    commonReaders: number,

    completionRate: number,

  ) {

    return (

      commonReaders * 3 +

      completionRate * 0.5

    );

  }

}