import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RequerimientoLoteData {
  codigo: string;
  titulo: string;
  persona: string;
  cargo: string;
}

interface ReporteData {
  codigoRequerimiento: string;
  fecha: string;
  nroCertificacion?: string;
  titulo?: string;
  personaNombres?: string;
  personaDocumento?: string;
  cargoNombre?: string;
  unidadSolicitante: string;
  unidadDestino: string;
  observaciones?: string | null;
  usuarioEnvio?: string;
  esMasivo?: boolean;
  cantidadLote?: number;
  requerimientosLote?: RequerimientoLoteData[];
}

export function generarPdfDerivacion(data: ReporteData) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'normal');

  // ─── ENCABEZADO ──────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CÁMARA DE SENADORES', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Estado Plurinacional de Bolivia', pageWidth / 2, 17, { align: 'center' });
  doc.text('Sistema de Control y Seguimiento de Contratación', pageWidth / 2, 22, {
    align: 'center',
  });

  doc.setLineWidth(0.3);
  doc.line(10, 25, pageWidth - 10, 25);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const tituloReporte = data.esMasivo ? 'REPORTE DE DERIVACIÓN MASIVA' : 'REPORTE DE DERIVACIÓN';
  doc.text(tituloReporte, pageWidth / 1.5, 32, { align: 'center' });

  if (data.esMasivo) {
    // ─── REPORTE MASIVO (Cabecera + Lista) ──────────────────────────────────
    autoTable(doc, {
      startY: 38,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
      head: [['Datos del Lote', 'Información']],
      body: [
        ['Código Grupo:', data.codigoRequerimiento],
        ['Fecha de Emisión:', data.fecha],
        ['Cantidad de Requerimientos:', `${data.cantidadLote} registros`],
        ['Unidad Solicitante:', data.unidadSolicitante],
        ['Unidad de Destino:', data.unidadDestino],
        ['Observaciones:', data.observaciones || 'Ninguna'],
        ['Derivado por:', data.usuarioEnvio || 'Sistema'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } },
      margin: { left: 10, right: 10 },
    });

    // ✅ Tabla de detalle ajustada
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 7, // ✅ Texto más pequeño
        cellPadding: 1,
        overflow: 'linebreak', // ✅ Permite saltos de línea
      },
      headStyles: {
        fillColor: [128, 0, 0],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      head: [['Código', 'Título', 'Persona', 'Cargo']],
      body: (data.requerimientosLote || []).map((r) => [r.codigo, r.titulo, r.persona, r.cargo]),
      // ✅ Anchos ajustados para que quepan en A5 (Suma total: 128mm)
      columnStyles: {
        0: { cellWidth: 38 }, // Código
        1: { cellWidth: 48 }, // Título
        2: { cellWidth: 28 }, // Persona
        3: { cellWidth: 14, halign: 'center' }, // Cargo (Más estrecho pero con salto de línea)
      },
      margin: { left: 10, right: 10 },
    });
  } else {
    // ─── REPORTE INDIVIDUAL ──────────────────────────────────────────────────
    autoTable(doc, {
      startY: 38,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
      head: [['Detalle del Trámite', 'Información']],
      body: [
        ['Código Requerimiento:', data.codigoRequerimiento],
        ['Fecha de Emisión:', data.fecha],
        ['Nro. Certificación:', data.nroCertificacion || '—'],
        ['Título:', data.titulo || '—'],
        ['Persona:', data.personaNombres || '—'],
        ['Documento de Identidad:', data.personaDocumento || '—'],
        ['Cargo a Contratar:', data.cargoNombre || 'No especificado'],
        ['Unidad Solicitante:', data.unidadSolicitante],
        ['Unidad de Destino:', data.unidadDestino],
        ['Observaciones:', data.observaciones || 'Ninguna'],
        ['Derivado por:', data.usuarioEnvio || 'Sistema'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 'auto' } },
      margin: { left: 10, right: 10 },
    });
  }

  const nombreArchivo = data.esMasivo
    ? `Derivacion-Masiva-${data.codigoRequerimiento}.pdf`
    : `Derivacion-${data.codigoRequerimiento}.pdf`;

  doc.save(nombreArchivo);
}
