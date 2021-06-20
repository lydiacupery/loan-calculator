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
  InputAdornment,
  makeStyles,
  TextField,
} from "@material-ui/core";
import { TextField as FMUITextField } from "formik-material-ui";
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
  rate: number;
};

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
    updateInterestRateForLoanStart: DateTimeIso.now(),
  };

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleUpdate(values: FormValues) {
    console.log("got me some form values!", values);
    await updateInterestRateForLoanBetween({
      variables: {
        loanId: props.loanId,
        effectiveStarting: values.updateInterestRateForLoanStart,
        rate: values.rate,
      },
    });
    handleClose();
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
                <Field name="rate" component={PercentageInputTextField} />
              </Grid>
              <Box m={4} />

              <DialogContentText id="alert-dialog-description">
                When should the new rate to become effective?
              </DialogContentText>
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

function PercentageInputTextField(props: TextFieldProps) {
  const {
    form: { setFieldValue },
    field: { name },
  } = props;
  return (
    <TextField
      {...fieldToTextField(props)}
      InputProps={{
        endAdornment: <InputAdornment position="end">%</InputAdornment>,
      }}
    />
  );
}

const useStyles = makeStyles(theme => ({
  clearIcon: {
    color: "#f50057", // todo, should be same as tabs, pul into theme
  },
}));
