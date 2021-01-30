import * as DateTimeIso from "modules/core/date-time-iso";

type TSTZRangeT = {
  start: DateTimeIso.Type;
  end: DateTimeIso.Type | null;
};

export class TSTZRange implements TSTZRangeT {
  /*
    This is *not* a complete implementation of Postgres range handling.
    It started with parsing existing TSRanges out of the database,
    and later grew to include *writing* them too.
 
    Notably not covered:
     - empty ranges
     - inclusive/exclusive combinations other than `[)`
     - ranges of other scalars
 
    If you find yourself wanting to extend this further, consider bringing
    in a library like https://github.com/WhoopInc/node-pg-range .
  */
  start: TSTZRangeT["start"];
  end: TSTZRangeT["end"];
  constructor(v: string | TSTZRangeT) {
    if (typeof v === "string") {
      const parsed = parse_tstzrange(v);
      this.start = parsed.start;
      this.end = parsed.end;
    } else {
      this.start = v.start;
      this.end = v.end;
    }
  }

  toPostgres(prepare?: any) {
    return `["${this.start}",${this.end ? `"${this.end}"` : "infinity"})`;
  }
}
export function parse_tstzrange(input: string): TSTZRange {
  const matches = input.match(
    /(\[|\()("((?:\\"|[^"])*)"|[^"]*),("((?:\\"|[^"])*)"|[^"]*)(\]|\))/
  );
  if (matches == null) {
    throw new Error(`Unable to parse tstzrange "${input}"`);
  }

  return new TSTZRange({
    start: DateTimeIso.toIsoDateTime(matches[3]),
    end:
      matches[5] && matches[5] !== "infinity"
        ? DateTimeIso.toIsoDateTime(matches[5])
        : null,
  });
}
