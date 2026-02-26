import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { ItemTypeNewView } from 'src/sections/item-type/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { itemTypeId } = useParams();

  return (
    <>
      <title>{`Edit Item Type - ${CONFIG.appName}`}</title>
      <ItemTypeNewView mode="edit" itemTypeId={itemTypeId} />
    </>
  );
}
