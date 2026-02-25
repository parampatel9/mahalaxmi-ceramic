import { CONFIG } from 'src/config-global';

import { ItemTypesView } from 'src/sections/item-type/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Item Types - ${CONFIG.appName}`}</title>
      <ItemTypesView />
    </>
  );
}
