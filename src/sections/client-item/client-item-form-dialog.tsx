import type { ItemType } from 'src/redux/apis/itemTypesApis';
import type { ClientItem } from 'src/redux/apis/clientItemsApis';

import { useState, useEffect } from 'react';

import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

type ClientItemFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (itemNumber: string, actualPrice: number, itemTypeId: string) => void;
  item: ClientItem | null;
  title: string;
  submitLabel: string;
  itemTypes: ItemType[];
};

function getItemTypeId(item: ClientItem | null): string {
  if (!item?.itemTypeId) return '';
  if (typeof item.itemTypeId === 'string') return item.itemTypeId;
  return item.itemTypeId._id;
}

export function ClientItemFormDialog({
  open,
  onClose,
  onSubmit,
  item,
  title,
  submitLabel,
  itemTypes,
}: ClientItemFormDialogProps) {
  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string>('');
  const [itemTypeError, setItemTypeError] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedItemTypeId(getItemTypeId(item));
      setItemTypeError(false);
    }
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const itemNumber = (form.elements.namedItem('itemNumber') as HTMLInputElement)?.value?.trim();
    const actualPrice = parseFloat(
      (form.elements.namedItem('actualPrice') as HTMLInputElement)?.value || '0'
    );

    if (!selectedItemTypeId) {
      setItemTypeError(true);
      return;
    }

    if (itemNumber != null && itemNumber !== '') {
      onSubmit(itemNumber, actualPrice, selectedItemTypeId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form key={item?._id ?? 'new'} onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="itemNumber"
            label="Item Number"
            fullWidth
            required
            defaultValue={item?.itemNumber ?? ''}
            sx={{ mt: 1 }}
          />
          <TextField
            name="actualPrice"
            label="Actual Price"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
            defaultValue={item?.actualPrice ?? 0}
          />
          <FormControl fullWidth required error={itemTypeError}>
            <InputLabel id="item-type-label">Item Type</InputLabel>
            <Select
              labelId="item-type-label"
              value={selectedItemTypeId}
              label="Item Type"
              onChange={(e) => {
                setSelectedItemTypeId(e.target.value);
                setItemTypeError(false);
              }}
            >
              {itemTypes.map((it) => (
                <MenuItem key={it._id} value={it._id}>
                  {it.itemType}
                </MenuItem>
              ))}
            </Select>
            {itemTypeError && <FormHelperText>Item Type is required</FormHelperText>}
          </FormControl>
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