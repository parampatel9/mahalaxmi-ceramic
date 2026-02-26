import { CONFIG } from 'src/config-global';

import { ClientNewView } from 'src/sections/client/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`New Client - ${CONFIG.appName}`}</title>
      <ClientNewView mode="new" />
    </>
  );
}
