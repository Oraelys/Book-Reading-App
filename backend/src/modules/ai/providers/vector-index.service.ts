import { Injectable } from '@nestjs/common';

@Injectable()
export class VectorIndexService {

  private readonly users =

    new Map<string, Float32Array>();

  private readonly novels =

    new Map<string, Float32Array>();

  /*
   * ----------------------------
   * User
   * ----------------------------
   */

  addUser(
    id: string,
    embedding: number[],
  ) {

    this.users.set(
      id,
      Float32Array.from(embedding),
    );

  }

  getUser(
    id: string,
  ) {

    return this.users.get(id);

  }

  removeUser(
    id: string,
  ) {

    this.users.delete(id);

  }

  /*
   * ----------------------------
   * Novel
   * ----------------------------
   */

  addNovel(
    id: string,
    embedding: number[],
  ) {

    this.novels.set(
      id,
      Float32Array.from(embedding),
    );

  }

  getNovel(
    id: string,
  ) {

    return this.novels.get(id);

  }

  removeNovel(
    id: string,
  ) {

    this.novels.delete(id);

  }

  allNovels() {

    return [...this.novels.entries()];

  }

  clear() {

    this.users.clear();

    this.novels.clear();

  }

}