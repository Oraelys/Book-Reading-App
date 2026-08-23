import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionBuilderService {

  /*
   * =====================================
   * Build Reading Sessions
   * =====================================
   */

  build(events: any[]) {

    const sessions: any[] = [];

    let current: any[] = [];

    const timeout =
      1000 * 60 * 30; // 30 min

    events.sort(

      (a, b) =>

        new Date(a.created_at).getTime() -

        new Date(b.created_at).getTime(),

    );

    for (const event of events) {

      if (!current.length) {

        current.push(event);

        continue;

      }

      const previous =
        current[current.length - 1];

      const gap =

        new Date(event.created_at).getTime() -

        new Date(previous.created_at).getTime();

      if (gap > timeout) {

        sessions.push(current);

        current = [];

      }

      current.push(event);

    }

    if (current.length) {

      sessions.push(current);

    }

    return sessions;

  }

}