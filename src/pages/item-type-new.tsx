import { CONFIG } from 'src/config-global';

import { ItemTypeNewView } from 'src/sections/item-type/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`New Item Type - ${CONFIG.appName}`}</title>
      <ItemTypeNewView mode="new" />
    </>
  );
}
