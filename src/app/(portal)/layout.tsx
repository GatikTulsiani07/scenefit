import type { ReactNode } from 'react';
import { PortalShell } from '@/features/business/portal-shell';

export default function BusinessPortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
