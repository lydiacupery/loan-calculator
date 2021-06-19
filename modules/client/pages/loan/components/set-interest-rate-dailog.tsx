import {
  Box,
  Button,
  colors,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
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
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { fieldToTextField, TextFieldProps } from "formik-material-ui";
import NumberFormat, { NumberFormatProps } from "react-number-format";

type FormValues = {
  updateInterestRateForLoanStart: DateTimeIso.Type;
  updateInterestRateForLoanEnd: DateTimeIso.Type;
  rate: number;
};

export const PercentageInput: React.FC<NumberFormatProps> = React.memo(
  props => {
    return (
      <NumberFormat
        {...props}
        getInputRef={props.inputRef}
        onValueChange={values => {
          props.onChange &&
            props.onChange({
              target: {
                name: props.name,
                value: values.value,
              },
            });
        }}
        suffix="%"
      />
    );
  }
);

export const SetInterestRateDialog: React.FC<{
  loanId: string;
  currentRate: number;
}> = props => {
  const classes = useStyles();

  const [updateInterestRateForLoanBetween] = useMutationBundle(
    UpdateInterestRateForLoanBetween
  );

  const [open, setOpen] = React.useState(true);

  const initialValues: FormValues = {
    rate: props.currentRate * 100,
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
                What is the new rate?
              </DialogContentText>

              <Grid item container xs={12}>
                <Field
                  name="rate"
                  component={(props: TextFieldProps) => (
                    <TextField
                      // type="number"
                      name="numberformat"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        inputComponent: props => (
                          <PercentageInput {...props} defaultValue={10} />
                        ),
                      }}
                      {...fieldToTextField(props)}
                    />
                  )}
                  handleChange={handleChange}
                />
              </Grid>
              <Box m={4} />

              <DialogContentText id="alert-dialog-description">
                When should the new rate to become effective?
              </DialogContentText>
              {/* <Field name="updateInterestRateForLoanStart">
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
                </Field> */}
              {/* <Field
                  component={DateTimePicker}
                  // name="updateInterestRateForLoanStart"
                  label="Range start"
                /> */}
              <Grid item container xs={12}>
                <Field
                  name="updateInterestRateForLoanStart"
                  component={(props: TextFieldProps) => (
                    <TextField
                      type="datetime-local"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      {...fieldToTextField(props)}
                    />
                  )}
                  handleChange={handleChange}
                />
              </Grid>
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
    </Dialog>
  );
};

const useStyles = makeStyles(theme => ({
  clearIcon: {
    color: "#f50057", // todo, should be same as tabs, pul into theme
  },
}));
