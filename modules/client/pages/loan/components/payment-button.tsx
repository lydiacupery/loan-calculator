import {
  Button,
  FormControl,
  Grid,
  TableCell,
  TableRow,
  Typography,
} from "@material-ui/core";
import * as React from "react";
import * as DateTimeIso from "modules/core/date-time-iso";
import * as DateIso from "modules/core/date-iso";
import { formatUSD } from "modules/core/formatter";
import { Field, Form, Formik } from "formik";
import { MakePayment, Payment } from "modules/client/graphql/types.gen";
import * as IsoDateTime from "modules/core/date-time-iso";
import { useForm } from "modules/atomic-object/forms/use-form";
import * as FMUI from "formik-material-ui";
import { toNumber } from "lodash";

import { StringFormatDefinition } from "ajv";
type FormValues = {
  amount: number;
};

export const PaymentButton: React.FC<{
  initialPaymentAmount: number;
  loanId: string;
}> = props => {
  const [paymentState, setPaymentState] = React.useState<
    "showButton" | "showInput"
  >("showButton");

  React.useEffect(() => {
    setPaymentState("showButton");
  }, [props]);

  const showInput = React.useCallback(() => setPaymentState("showInput"), []);

  const mutationBuilder = React.useCallback(
    (currentValue: FormValues, initialValues: FormValues) => {
      return {
        loanId: props.loanId,
        paymentAmount: toNumber(currentValue.amount),
        effectiveDateTime: IsoDateTime.now(),
      };
    }
  );

  const formValues: FormValues = React.useMemo(
    () => ({
      amount: props.initialPaymentAmount,
    }),
    [props]
  );

  const responseLens = React.useCallback((x: MakePayment.Mutation) => {
    return x.makePayment;
  }, []);
  const errorLens = React.useCallback((x: MakePayment.MakePayment) => [], []);

  const { onSubmit } = useForm(
    MakePayment,
    mutationBuilder,
    responseLens,
    errorLens
  );

  return paymentState === "showButton" ? (
    <Button onClick={showInput}>Make Payment</Button>
  ) : (
    <Formik<FormValues>
      initialValues={formValues}
      onSubmit={onSubmit(formValues)}
      enableReinitialize
    >
      {({ values, handleSubmit, handleChange, handleBlur }) => (
        <Form>
          <FormControl>
            <Grid container direction="column">
              <Typography variant="caption">Payment Amount</Typography>
              <Field component={FMUI.TextField} name="amount"></Field>
            </Grid>
          </FormControl>
        </Form>
      )}
    </Formik>
  );
};
