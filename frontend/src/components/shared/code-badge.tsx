import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

interface CodeBadgeProps {
  codigo: string | null;
  fallbackId?: number;
  className?: string;
}

export function CodeBadge({ codigo, fallbackId, className }: CodeBadgeProps) {
  const { copied, copy } = useCopyToClipboard();

  if (!codigo) {
    return <span className="font-mono text-xs text-muted-foreground">#{fallbackId ?? '—'}</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copy(codigo);
    if (ok) toast.success('Código copiado', { duration: 2000 });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:bg-muted',
        className
      )}
      title="Click para copiar"
    >
      {codigo}
      {copied ? (
        <Check className="size-3 text-success" />
      ) : (
        <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}
