import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { ClientItemNewView } from 'src/sections/client-item/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { clientId, itemId } = useParams<{ clientId: string; itemId?: string }>();
  const isEditMode = Boolean(itemId);

  return (
    <>
      <title>{`${isEditMode ? 'Edit' : 'New'} Client Item - ${CONFIG.appName}`}</title>
      <ClientItemNewView clientId={clientId ?? ''} itemId={itemId} />
    </>
  );
}
