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
    await knex.raw(getDropLensCode("MarketProductVariantSalesBundleEntry"));
  },
  on: async (knex: Knex) => {
    const makeLensCode = await generateDataLensFromBaseAndVersionWithRangesBuilderCode(
      knex,
      {
        tableBaseName: "MarketProductVariantSalesBundleEntry",
        tableVersionName: "MarketProductVariantSalesBundleEntryVersion",
        isDeletedSupported: false,
        additionalConstraints: [
          [
            "productSalesBundleEntryId",
            "marketProductVariantId",
            "parentMarketProductVariantId",
          ],
        ],
      }
    );
    await knex.raw(makeLensCode.lensCode);
  },
};
