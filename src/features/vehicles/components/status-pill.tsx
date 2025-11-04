import { Badge } from '@/components/ui/badge';

export function StatusPill({ status }: { status: 'OK' | 'DUE_SOON' | 'OVERDUE' }) {
  if (status === 'OVERDUE') {
    return <Badge variant="danger">Depasit</Badge>;
  }
  if (status === 'DUE_SOON') {
    return <Badge variant="warning">In curand</Badge>;
  }
  return <Badge variant="success">OK</Badge>;
}
