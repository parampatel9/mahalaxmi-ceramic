import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { ClientHistoryView } from 'src/sections/client-history/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <>
      <title>{`Client History - ${CONFIG.appName}`}</title>
      <ClientHistoryView clientId={clientId ?? ''} />
    </>
  );
}
