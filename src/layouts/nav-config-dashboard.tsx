import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Clients',
    path: '/clients',
    icon: icon('ic-user'),
  },
  {
    title: 'Item Types',
    path: '/item-types',
    icon: icon('ic-user'),
  },
  {
    title: 'Sales (Customers)',
    path: '/customers',
    icon: icon('ic-user'),
  },
  {
    title: 'Bill Report',
    path: '/client-history',
    icon: icon('ic-analytics'),
  },
];
