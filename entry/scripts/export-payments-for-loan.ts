import {
  NodeScript,
  run,
  scriptFailure,
  scriptSuccess,
} from "modules/helpers/scripting";
import * as path from "path";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";
import { buildContext } from "modules/server/context";
import * as DateTimeIso from "modules/core/date-time-iso";

import * as ExcelJs from "exceljs";
import { GetLoan } from "modules/client/graphql/types.gen";

const filePath = path.resolve(process.argv[2]);
const loanId = process.argv[3];

const main: NodeScript = async () => {
  const context = buildContext();
  try {
    const loan = await context.get(LoanRepositoryPort).find({ id: loanId });
    if (!loan) {
      throw new Error(`must provide valid loan id to associate payments with`);
    }

    const workbook = new ExcelJs.Workbook();
    const sheet = workbook.addWorksheet("Completed Payments");

    sheet.columns = [
      { header: "Paid At", key: "paidAt" },
      {
        header: "Principal Payment",
        key: "principalPayment",
        width: 25,
        style: {
          numFmt: '"$"#,##0.00;[Red]-"$"#,##0.00',
        },
      },
      {
        header: "Interest Payment",
        key: "interestPayment",
        width: 30,
        style: {
          numFmt: '"$"#,##0.00;[Red]-"$"#,##0.00',
        },
      },

      {
        header: "Total Payment",
        key: "totalPayment",
        width: 30,
        style: {
          numFmt: '"$"#,##0.00;[Red]-"$"#,##0.00',
        },
      },
      {
        header: "Remaining Principal",
        key: "remainingPrincipal",
        width: 30,
        style: {
          numFmt: '"$"#,##0.00;[Red]-"$"#,##0.00',
        },
      },
    ];

    const loanResult = await context.apolloClient.query<GetLoan.Query>({
      query: GetLoan.Document,
      variables: {
        loanId,
        effectiveDateTime: DateTimeIso.now(),
      },
    });

    if (loanResult.data.getLoan) {
      loanResult.data.getLoan.completedPayments.forEach(payment => {
        sheet.addRow({
          paidAt: payment.date,
          principalPayment: Number(payment.principalPayment),
          interestPayment: Number(payment.interestPayment),
          totalPayment: Number(payment.totalPayment),
          remainingPrincipal: Number(payment.remainingPrincipal),
        });
      });
    }
    await workbook.xlsx.writeFile(filePath);
    return scriptSuccess();
  } catch (e) {
    await context.destroy();
    return scriptFailure({
      name: "export-payments-for-loan",
      message: "export payments for loan failed",
      baseError: e,
    });
  }
};

run(main);
