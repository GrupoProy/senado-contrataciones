import { useEffect, useState } from 'react';
import { UserCheck, UserPlus, AlertTriangle, Loader2, CheckCircle2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { requerimientoApi } from '../api/requerimiento-api';
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { formatDate, cn } from '@/lib/utils';
import type { PersonaRef } from '../types/requerimiento-types';

interface Props {
  value: PersonaRef;
  onChange: (v: PersonaRef) => void;
  onProcesoActivoChange?: (bloqueado: boolean) => void;
  onExisteChange?: (existe: boolean | null) => void;
  requerimientoId?: number;
  //esNuevo?: boolean;
}

export function PersonaSearchSection({
  value,
  onChange,
  onProcesoActivoChange,
  onExisteChange,
  requerimientoId,
}: Props) {
  const { data: tiposDoc } = useCatalogoPorCodigo('TIPO_DOCUMENTO');

  const [debouncedNumDoc, setDebouncedNumDoc] = useState('');
  //const [busquedaManual, setBusquedaManual] = useState(false);

  // Efecto debounce: busca automáticamente después de 600ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNumDoc(value.numeroDocumento || '');
    }, 600);
    return () => clearTimeout(timer);
  }, [value.numeroDocumento]);

  const puedeBuscar =
    (value.tipoDocumento?.length ?? 0) >= 2 && (debouncedNumDoc?.length ?? 0) >= 4;

  const {
    data: busqueda,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      'requerimiento',
      'buscar-persona',
      value.tipoDocumento,
      debouncedNumDoc,
      value.complemento || null,
    ],
    queryFn: () =>
      requerimientoApi.buscarPersona(
        value.tipoDocumento,
        debouncedNumDoc,
        value.complemento || null
      ),
    enabled: puedeBuscar,
    staleTime: 1000 * 60 * 5,
  });

  const personaId = busqueda?.persona?.id ?? null;
  /*const { data: proceso } = useQuery({
    queryKey: ['requerimiento', 'proceso-activo', personaId],
    queryFn: () => requerimientoApi.procesoActivoPersona(personaId!),
    enabled: !!personaId,
    staleTime: 15_000,
  });*/

  const { data: proceso } = useQuery({
    queryKey: ['requerimiento', 'proceso-activo', personaId, requerimientoId],
    queryFn: () => requerimientoApi.procesoActivoPersona(personaId!, requerimientoId),
    enabled: !!personaId,
    staleTime: 15_000,
  });
  useEffect(() => {
    onProcesoActivoChange?.(!!proceso?.tieneProcesoActivo);
  }, [proceso, onProcesoActivoChange]);

  useEffect(() => {
    if (puedeBuscar && !isFetching && busqueda !== undefined) {
      onExisteChange?.(busqueda.existe ?? false);
    } else if (!puedeBuscar) {
      onExisteChange?.(null);
    }
  }, [busqueda, isFetching, puedeBuscar, onExisteChange]);

  const personaExiste = busqueda?.existe && busqueda.persona;
  const tieneBloqueo = proceso?.tieneProcesoActivo;

  // Solo mostramos "No existe" si la búsqueda terminó y no hay error
  const mostrarFormularioNuevo = !isFetching && puedeBuscar && busqueda?.existe === false;

  const handleManualSearch = () => {
    // setBusquedaManual(true);
    setDebouncedNumDoc(value.numeroDocumento || '');
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* ─── Controles de Búsqueda ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Tipo documento *</Label>
          <Select
            value={value.tipoDocumento}
            onValueChange={(v) => {
              onChange({ ...value, tipoDocumento: v, numeroDocumento: '', complemento: null });
              setDebouncedNumDoc('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {tiposDoc?.map((t) => (
                <SelectItem key={t.codigo} value={t.codigo}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Número documento *</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={value.numeroDocumento}
                onChange={(e) => {
                  const raw = e.target.value.toUpperCase();
                  const sanitized = ['CI', 'NIT'].includes(value.tipoDocumento)
                    ? raw.replace(/[^0-9]/g, '')
                    : raw;
                  onChange({ ...value, numeroDocumento: sanitized });
                }}
                placeholder="Ej: 12345678"
                inputMode={['CI', 'NIT'].includes(value.tipoDocumento) ? 'numeric' : 'text'}
                maxLength={['CI', 'NIT'].includes(value.tipoDocumento) ? 13 : 30}
                className="pr-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualSearch();
                  }
                }}
              />
              {!isFetching && personaExiste && (
                <CheckCircle2 className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-success" />
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleManualSearch}
              disabled={!puedeBuscar || isFetching}
              title="Buscar persona"
            >
              {isFetching ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input
            value={value.complemento ?? ''}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              onChange({ ...value, complemento: val ? val : null });
            }}
            placeholder="Opcional"
            className="uppercase"
          />
        </div>
      </div>

      {/* ─── Persona Encontrada ────────────────────────────────────── */}
      {personaExiste && (
        <div
          className={cn(
            'rounded-lg border p-4 shadow-sm',
            tieneBloqueo
              ? 'border-destructive/40 bg-destructive/5'
              : 'border-emerald-500/40 bg-emerald-500/5'
          )}
        >
          <div className="flex items-start gap-3">
            {tieneBloqueo ? (
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            ) : (
              <UserCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-foreground">
                  {busqueda.persona!.nombres} {busqueda.persona!.primerApellido}{' '}
                  {busqueda.persona!.segundoApellido ?? ''}
                </p>
                {busqueda.persona!.edad !== null && (
                  <Badge variant="outline" className="text-[10px]">
                    {busqueda.persona!.edad} años
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>
                  <strong>Doc:</strong> {busqueda.persona!.tipoDocumento}{' '}
                  {busqueda.persona!.numeroDocumento}
                  {busqueda.persona!.complemento && `-${busqueda.persona!.complemento}`}
                </span>
                {busqueda.persona!.fechaNacimiento && (
                  <span>
                    <strong>Nacimiento:</strong> {formatDate(busqueda.persona!.fechaNacimiento)}
                  </span>
                )}
                {busqueda.persona!.email && (
                  <span>
                    <strong>Email:</strong> {busqueda.persona!.email}
                  </span>
                )}
              </div>
              {tieneBloqueo && proceso?.motivoBloqueo && (
                <div className="mt-3 rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive">
                  ⚠️ {proceso.motivoBloqueo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Persona No Registrada ─────────────────────────────────── */}
      {mostrarFormularioNuevo && (
        <div className="rounded-lg border border-info/40 bg-info/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <UserPlus className="mt-0.5 size-5 shrink-0 text-info" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-info">Persona no registrada</p>
              <p className="text-xs text-muted-foreground">
                El documento no existe en el sistema. Complete los datos para registrarla
                automáticamente.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombres *</Label>
              <Input
                value={value.nombres ?? ''}
                onChange={(e) => onChange({ ...value, nombres: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Primer apellido *</Label>
              <Input
                value={value.primerApellido ?? ''}
                onChange={(e) =>
                  onChange({ ...value, primerApellido: e.target.value.toUpperCase() })
                }
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Segundo apellido</Label>
              <Input
                value={value.segundoApellido ?? ''}
                onChange={(e) =>
                  onChange({ ...value, segundoApellido: e.target.value.toUpperCase() })
                }
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha nacimiento *</Label>
              <Input
                type="date"
                value={value.fechaNacimiento ?? ''}
                onChange={(e) => onChange({ ...value, fechaNacimiento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={value.email ?? ''}
                onChange={(e) => onChange({ ...value, email: e.target.value.toLowerCase() })}
                className="lowercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={value.telefono ?? ''}
                onChange={(e) => onChange({ ...value, telefono: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
