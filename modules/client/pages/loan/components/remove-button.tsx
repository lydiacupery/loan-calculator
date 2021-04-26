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
} from "@material-ui/core";
import { Clear, DeleteOutline } from "@material-ui/icons";
import { useMutationBundle } from "modules/client/graphql/hooks";
import { DeletePayment } from "modules/client/graphql/types.gen";
import React from "react";

export const RemoveButton: React.FC<{
  paymentId: string;
}> = props => {
  const classes = useStyles();

  const [deletePayment] = useMutationBundle(DeletePayment);

  const [open, setOpen] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleDeleteConfirm() {
    await deletePayment({
      variables: {
        paymentId: props.paymentId,
      },
    });
    handleClose();
  }

  return (
    <>
      <IconButton onClick={handleClickOpen}>
        <Clear className={classes.clearIcon}></Clear>
      </IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Are you sure you want to delete this payment?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Deleting this payment will remove this payment from the loan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus>
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const useStyles = makeStyles(theme => ({
  clearIcon: {
    color: "#f50057", // todo, should be same as tabs, pul into theme
  },
}));
