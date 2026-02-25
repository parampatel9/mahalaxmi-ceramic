import type { ClientItem } from 'src/redux/apis/clientItemsApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

// ----------------------------------------------------------------------

type ClientItemDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: ClientItem | null;
};

export function ClientItemDeleteDialog({
  open,
  onClose,
  onConfirm,
  item,
}: ClientItemDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete item &quot;{item?.itemNumber}&quot;? This action cannot
          be undone.
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
