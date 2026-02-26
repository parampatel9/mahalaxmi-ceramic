import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { ClientNewView } from 'src/sections/client/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <>
      <title>{`Edit Client - ${CONFIG.appName}`}</title>
      <ClientNewView mode="edit" clientId={clientId ?? ''} />
    </>
  );
}
