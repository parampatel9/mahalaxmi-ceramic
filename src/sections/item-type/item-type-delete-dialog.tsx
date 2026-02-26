import type { ItemType } from 'src/redux/apis/itemTypesApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

// ----------------------------------------------------------------------

type ItemTypeDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  item: ItemType | null;
};

export function ItemTypeDeleteDialog({
  open,
  onClose,
  onConfirm,
  item,
}: ItemTypeDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Item Type</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete item type &quot;{item?.itemType}&quot;?
          This action cannot be undone.
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
