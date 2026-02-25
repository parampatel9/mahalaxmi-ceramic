import type { ItemType } from 'src/redux/apis/itemTypesApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ----------------------------------------------------------------------

type ItemTypeFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (itemType: string) => void;
  item: ItemType | null;
  title: string;
  submitLabel: string;
};

export function ItemTypeFormDialog({
  open,
  onClose,
  onSubmit,
  item,
  title,
  submitLabel,
}: ItemTypeFormDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const itemType = (form.elements.namedItem('itemType') as HTMLInputElement)?.value?.trim();
    if (itemType != null && itemType !== '') {
      onSubmit(itemType);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form key={item?._id ?? 'new'} onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            name="itemType"
            label="Item Type"
            fullWidth
            required
            defaultValue={item?.itemType ?? ''}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
