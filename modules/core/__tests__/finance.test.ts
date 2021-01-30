import * as Finance from "modules/core/finance";

describe("finance module", () => {
  describe("number of payments", () => {
    test.each`
      annualRate | pmt      | pv        | result
      ${0.03}    | ${-1000} | ${100000} | ${115.217}
      ${0.04}    | ${-1000} | ${100000} | ${121.842}
      ${0.04}    | ${-2000} | ${100000} | ${54.787}
      ${0.04}    | ${-2000} | ${987.77} | ${0.495}
    `(
      "for annual rate of $annualRate, pmt of $pmt, pv of $pv the number of payments is $result",
      ({ annualRate, pmt, pv, result }) => {
        expect(Finance.numberOfPayments(annualRate / 12, pmt, pv)).toBeCloseTo(
          result
        );
      }
    );
  });
});
