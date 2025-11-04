import { Badge } from '@/components/ui/badge';

type CopieConformaState = 'ok' | 'soon' | 'overdue' | 'missing' | null;

export function CopieConformaBadge({ state }: { state: CopieConformaState }) {
  if (state === 'overdue') {
    return <Badge variant="danger">Depasit</Badge>;
  }
  if (state === 'soon') {
    return <Badge variant="warning">In curand</Badge>;
  }
  if (state === 'missing') {
    return <Badge variant="outline">Nespecificat</Badge>;
  }
  return <Badge variant="success">OK</Badge>;
}
