import type { Customer } from 'src/redux/apis/customersApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

// ----------------------------------------------------------------------

type CustomerDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer | null;
};

export function CustomerDeleteDialog({
  open,
  onClose,
  onConfirm,
  customer,
}: CustomerDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Sale (Customer)</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the sale for &quot;{customer?.customerName}&quot; (Bill #
          {customer?.billNumber}, {customer?.itemNumber ?? customer?.items?.[0]?.itemNumber ?? '—'})? This action
          cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
