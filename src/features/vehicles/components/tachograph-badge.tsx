import { Badge } from '@/components/ui/badge';

type TachographState = 'ok' | 'soon' | 'overdue' | 'missing' | null;

export function TachographBadge({ state }: { state: TachographState }) {
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
