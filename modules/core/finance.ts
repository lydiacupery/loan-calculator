// --------------------------------------------------------------------
// Calculates the number of periods based on rate, payment,
// present value (as a negative).  Future value and type
// (0 as in arrears, 1 as in advance) are optional fields.
//
// ## Math:
//
//                       -fv + pmt*(1_rate*type) / rate
//     (1+rate)^nper = ----------------------------------
//                        pv + pmt*(1+rate*type) / rate
//
// This output is then used in the log function.
//
// If rate equals zero, there is no time value of money
// Calculations needed, and the function returns:
//
//     nper = (-fv - pv) / pmt
//
// Returns either a number or error message (as string).
// --------------------------------------------------------------------
//
export const numberOfPayments = function(
  rate: number,
  pmt: number,
  pv: number,
  fv?: number,
  type?: "arrears" | "advance"
): number {
  type = typeof type === "undefined" ? "arrears" : type;
  fv = typeof fv === "undefined" ? 0 : fv;

  if (rate === 0) {
    if (pmt === 0) {
      throw new Error("Rate and Payment cannot be 0");
    }
    return -(pv + fv) / pmt;
  }

  const pmtAndRateCalc =
    (pmt * (1 + rate * (type === "advance" ? 1 : 0))) / rate;

  var fvCalc = -fv + pmtAndRateCalc;
  var pvCalc = pv + pmtAndRateCalc;

  const bothLessThan0 = pvCalc < 0 && fvCalc < 0;
  // if fv or pv is less than 0, but not both
  if (!bothLessThan0 && (fvCalc <= 0 || pvCalc <= 0)) {
    throw new Error(
      `Just one of the future value calc ${fvCalc} and present value calc ${pvCalc} cannot be less than 0`
    );
  }

  const finalFvCalc = bothLessThan0 ? -fvCalc : fvCalc;
  const finalPVCalc = bothLessThan0 ? -pvCalc : pvCalc;

  return (Math.log(finalFvCalc) - Math.log(finalPVCalc)) / Math.log(rate + 1);
};

export const getInterestAndPrincipalPortionsOfPayment = (args: {
  payment: number;
  principal: number;
  interestRate: number;
}) => {
  const interestPayment = args.principal * args.interestRate;
  const principalPayment = Math.min(
    args.payment - interestPayment,
    args.principal
  );
  return { interestPayment, principalPayment };
};
