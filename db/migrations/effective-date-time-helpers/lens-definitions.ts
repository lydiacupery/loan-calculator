import Knex from "knex";
import {
  generateDataLensFromBaseAndVersionWithRangesBuilderCode,
  getDropLensCode,
} from "./lens-helpers";

type DataPoolLensOps = {
  off: (knex: Knex) => Promise<void>;
  on: (knex: Knex) => Promise<void>;
};

export const loanLensOpsV1: DataPoolLensOps = {
  off: async (knex: Knex) => {
    await knex.raw(getDropLensCode("Loan"));
  },
  on: async (knex: Knex) => {
    const makeLensCode = await generateDataLensFromBaseAndVersionWithRangesBuilderCode(
      knex,
      {
        tableBaseName: "Loan",
        tableVersionName: "LoanVersion",
        isDeletedSupported: false,
      }
    );
    await knex.raw(makeLensCode.lensCode);
  },
};
