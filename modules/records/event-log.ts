import { orderBy } from "lodash-es";
import { Action, ActionObjectTypes } from "atomic-object/cqrs/actions";
import * as Hexagonal from "atomic-object/hexagonal";
import { JsonMap } from "helpers/json";
import { KnexPort } from "atomic-object/records/knex-port";

export interface UnsavedEventLog {
  type: string;
  payload: JsonMap;
  effect: JsonMap | null;
}

export interface SavedEventLog extends UnsavedEventLog {
  timestamp: string;
  index: number;
}

export type EventLogsForAction<TActions extends Action> = ActionObjectTypes<
  TActions
> & {
  effect: JsonMap | null;
};

export class EventLogRecordRepository {
  constructor(protected ctx: Hexagonal.Context<KnexPort>) {
    if ((ctx as any).name) {
      throw new Error("Bad");
    }
  }

  private get db() {
    return this.ctx.get(KnexPort);
  }

  table() {
    return this.db.table("EventLog");
  }

  async count(): Promise<number> {
    return parseInt(String((await this.table().count())[0].count), 10);
  }

  async insert(unsaved: UnsavedEventLog): Promise<SavedEventLog> {
    const [result] = await this.table().insert(unsaved, ["timestamp", "index"]);
    const returning = { ...result, ...unsaved };
    return returning;
  }

  /** Because we want to log events in the order they occur, this allows us to
   * save the captured effect after the action finishes running while also
   * allowing us to log the event before the action starts running */
  async updateEffect(record: SavedEventLog, effect: JsonMap) {
    const [result] = await this.table()
      .where({ index: record.index })
      .update({ effect })
      .returning(["effect"]);
    return { ...record, ...result };
  }

  async allWithType<K extends string, T extends JsonMap>(
    action: Action<K, T>
  ): Promise<EventLogsForAction<Action<K, T>>[]> {
    return await this.table().where({ type: action.type });
  }
}

export const EventLogRecordRepositoryPort = Hexagonal.port<
  EventLogRecordRepository,
  "EventLogRecordRepository"
>("EventLogRecordRepository");
export type EventLogRecordRepositoryPort = typeof EventLogRecordRepositoryPort;

export const EventLogRecordRepositoryAdapter = Hexagonal.adapter({
  port: EventLogRecordRepositoryPort,
  requires: [KnexPort],
  build: ctx => new EventLogRecordRepository(ctx),
});
