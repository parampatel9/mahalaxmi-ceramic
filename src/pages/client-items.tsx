import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { ClientItemsView } from 'src/sections/client-item/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <>
      <title>{`Client Items - ${CONFIG.appName}`}</title>
      <ClientItemsView clientId={clientId ?? ''} />
    </>
  );
}
