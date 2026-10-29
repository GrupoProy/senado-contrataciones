import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  delay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
          </div>
          <div className={cn('rounded-2xl p-4', bgClass, colorClass)}>
            <Icon className="size-6" />
          </div>
        </div>
        <div className={cn('absolute -right-4 -top-4 opacity-[0.03]', colorClass)}>
          <Icon className="size-32" />
        </div>
      </Card>
    </motion.div>
  );
}
