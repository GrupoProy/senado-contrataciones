import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFeriados } from '@/hooks/use-feriados';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  blockWeekendsAndHolidays?: boolean;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Seleccione fecha',
  blockWeekendsAndHolidays = true,
}: DatePickerProps) {
  const { data: feriados } = useFeriados();

  const selectedDate = value ? new Date(value + 'T12:00:00') : undefined;

  // ✅ 1. Guardamos los feriados en un Set de strings para búsquedas instantáneas
  const feriadosSet = new Set(feriados?.map((f: { fecha: string }) => f.fecha) || []);

  // ✅ 2. Función que decide si un día se bloquea
  const isDayDisabled = (date: Date) => {
    if (!blockWeekendsAndHolidays) return false;

    // Bloquear Sábados (6) y Domingos (0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;

    // Bloquear Feriados: Convertimos el Date a "YYYY-MM-DD" y lo buscamos en el Set
    const dateStr = format(date, 'yyyy-MM-dd');
    if (feriadosSet.has(dateStr)) return true;

    return false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date: Date | undefined) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'));
            } else {
              onChange('');
            }
          }}
          // ✅ 3. Pasamos la función evaluadora en lugar del array
          disabled={isDayDisabled}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}
