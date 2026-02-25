import type { Client } from 'src/redux/apis/clientsApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

// ----------------------------------------------------------------------

type ClientDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client: Client | null;
};

export function ClientDeleteDialog({ open, onClose, onConfirm, client }: ClientDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Client</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete &quot;{client?.clientName}&quot;? This action cannot be
          undone.
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
