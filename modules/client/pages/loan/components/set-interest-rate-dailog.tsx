import {
  Button,
  colors,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  makeStyles,
  TextField,
} from "@material-ui/core";
import { Clear, DeleteOutline } from "@material-ui/icons";
import { Field, Form, Formik } from "formik";
import { useMutationBundle } from "modules/client/graphql/hooks";
import {
  DeletePayment,
  UpdateInterestRateForLoanBetween,
} from "modules/client/graphql/types.gen";
import React from "react";
import * as DateTimeIso from "modules/core/date-time-iso";
import { toNumber } from "lodash";
import { useForm } from "modules/atomic-object/forms/use-form";
import { DateTimePicker } from "formik-material-ui-pickers";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";

type FormValues = {
  updateInterestRateForLoanStart: DateTimeIso.Type;
  updateInterestRateForLoanEnd: DateTimeIso.Type;
  rate: number;
};

export const SetInterestRate: React.FC<{
  loanId: string;
  currentRate: number;
}> = props => {
  const classes = useStyles();

  const [updateInterestRateForLoanBetween] = useMutationBundle(
    UpdateInterestRateForLoanBetween
  );

  const [open, setOpen] = React.useState(true);

  const initialValues: FormValues = {
    rate: props.currentRate,
    updateInterestRateForLoanEnd: DateTimeIso.now(),
    updateInterestRateForLoanStart: DateTimeIso.now(),
  };

  const mutationBuilder = React.useCallback(
    (currentValue: FormValues, initialValues: FormValues) => {
      return {
        loanId: props.loanId,
        rate: toNumber(currentValue.rate),
        updateForRange: {
          start: currentValue.updateInterestRateForLoanStart,
          end: currentValue.updateInterestRateForLoanEnd,
        },
      };
    }
  );

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleUpdate(values: FormValues) {
    console.log("got me some form values!", values);
    // await updateInterestRateForLoanBetween({
    //   variables: {
    //     loanId: props.loanId,
    //     updateForRange: {
    //       start: values.updateInterestRateForLoanStart,
    //       end: values.updateInterestRateForLoanEnd,
    //     },
    //     rate: values.rate,
    //   },
    // });
    // handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Formik<FormValues>
          initialValues={initialValues}
          onSubmit={handleUpdate}
          enableReinitialize
        >
          {({ values, handleSubmit, handleChange, handleBlur }) => (
            <Form>
              <DialogTitle id="alert-dialog-title">
                Update the rate for this loan
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Select the dates you would like to update the rate for
                </DialogContentText>
                <Field name="updateInterestRateForLoanStart">
                  {({
                    field, // { name, value, onChange, onBlur }
                    form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
                    meta,
                  }) => {
                    console.log("field???", field);
                    return (
                      <TextField
                        id="datetime-local"
                        label="Range Start"
                        type="datetime-local"
                        defaultValue={field.value}
                        value={field.value}
                        onChange={v => {
                          console.log("got a v!", v., v);
                        }}
                        onSelect={s => {
                          console.log(s);
                        }}
                        name="updateInterestRateForLoanStart"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    );
                  }}
                </Field>
                {/* <Field
                  component={DateTimePicker}
                  // name="updateInterestRateForLoanStart"
                  label="Range start"
                /> */}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={e => handleSubmit()} autoFocus>
                  Update Rate
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </MuiPickersUtilsProvider>
    </Dialog>
  );
};

const useStyles = makeStyles(theme => ({
  clearIcon: {
    color: "#f50057", // todo, should be same as tabs, pul into theme
  },
}));
