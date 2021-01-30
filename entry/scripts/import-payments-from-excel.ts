import {
  NodeScript,
  run,
  scriptFailure,
  scriptSuccess,
} from "modules/helpers/scripting";
import * as path from "path";
import * as fs from "fs";
import { Row, Workbook } from "exceljs";
import * as DateIso from "modules/core/date-iso";
import {
  buildAssertColumnHeader,
  columnGetterForRow,
} from "modules/helpers/excel-import-helpers";
import { Payment } from "modules/core/schemas/payment.gen";
import * as Loan from "modules/core/loan/entity";
import { buildValidator } from "modules/core/schemas";
import { buildContext } from "modules/server/context";
import * as DateTimeIso from "modules/core/date-time-iso";
import { PaymentRepositoryPort } from "modules/domain-services/payment/repository";
import { PaymentRecordRepositoryPort } from "modules/records/payment";
import { buildPayment } from "modules/core/payment/entity";
import uuid from "uuid";
import { LoanRepositoryPort } from "modules/domain-services/loan/repository";

export const Validator = buildValidator<Payment>({
  schema: require("modules/core/schemas/payment.schema.json"),
});

enum ColumnHeaderIndexes {
  PaymentDate = 1,
  PrincipalPayment = 2,
  InterestPayment = 3,
}

const filePath = path.resolve(process.argv[2]);
const forLoanId = process.argv[3];

const main: NodeScript = async () => {
  const context = buildContext();
  try {
    const loan = await context.get(LoanRepositoryPort).find({ id: forLoanId });
    if (!loan) {
      throw new Error(`must provide valid loan id to associate payments with`);
    }
    const workbook = new Workbook();
    const readSpreadsheet = await workbook.xlsx.readFile(filePath);
    const paymentRows: Payment[] = [];
    const worksheet = readSpreadsheet.worksheets[0];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        validateColumnHeaders(row);
      } else {
        paymentRows.push(excelRowToPayment(row));
      }
    });
    await context.get(PaymentRepositoryPort).insertMany(
      paymentRows.map(row =>
        buildPayment({
          interestPayment: row.interestPayment,
          principalPayment: row.principalPayment,
          paidAt: row.paymentDate,
          loanId: Loan.id(loan),
          id: uuid(),
        })
      )
    );
    return scriptSuccess();
  } catch (e) {
    await context.destroy();
    return scriptFailure({
      name: "import-payments-from-excel",
      message: "payment import failed",
      baseError: e,
    });
  }
};

const validateColumnHeaders = (row: Row) => {
  const assertColumnHeader = buildAssertColumnHeader(row);

  assertColumnHeader({
    columnIndex: ColumnHeaderIndexes.PaymentDate,
    expectedHeaderText: "Payment Date",
  });
  assertColumnHeader({
    columnIndex: ColumnHeaderIndexes.PrincipalPayment,
    expectedHeaderText: "Principal Payment",
  });
  assertColumnHeader({
    columnIndex: ColumnHeaderIndexes.InterestPayment,
    expectedHeaderText: "Interest Payment",
  });
};

const excelRowToPayment = (row: Row): Payment => {
  const dateTime = row.getCell(ColumnHeaderIndexes.PaymentDate).value;
  const principalPayment = row.getCell(ColumnHeaderIndexes.PrincipalPayment)
    .value;
  const interestPayment = row.getCell(ColumnHeaderIndexes.InterestPayment)
    .value;
  if (!(dateTime && principalPayment && interestPayment)) {
    throw new Error(`This row is missing a column: ${row}`);
  }
  const payment: unknown = {
    paymentDate: DateTimeIso.toIsoDateTime(new Date(dateTime.toString())),
    principalPayment: parseFloat(principalPayment.toString()),
    interestPayment: parseFloat(interestPayment.toString()),
  };

  const validatedPayment = Validator.validate(payment);
  return validatedPayment;
};

run(main);
