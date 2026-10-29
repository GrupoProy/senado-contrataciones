export function imprimirReporteDerivacion(data: {
  codigoRequerimiento: string;
  codigoDerivacion: string;
  fecha: string;
  titulo: string;
  nroCertificacion: string;
  personaNombres: string;
  personaDocumento: string;
  cargoNombre: string;
  unidadSolicitante: string;
  unidadDestino: string;
  observaciones?: string | null;
  usuarioEnvio?: string;
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, habilite las ventanas emergentes para imprimir el reporte.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Derivación - ${data.codigoRequerimiento}</title>
      <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
        .header h2 { margin: 5px 0 0; font-size: 14px; font-weight: normal; }
        .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .info-table th, .info-table td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
        .info-table th { background-color: #f5f5f5; width: 30%; font-weight: bold; }
        .footer { margin-top: 80px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; }
        .signature-box { width: 45%; border-top: 1px solid #000; padding-top: 5px; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
        .btn-print { display: block; margin: 0 auto 30px; padding: 10px 20px; background: #0056b3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
      </style>
    </head>
    <body>
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir Documento</button>
      
      <div class="header">
        <h1>Cámara de Senadores</h1>
        <h2>Estado Plurinacional de Bolivia</h2>
        <h2>Sistema de Control y Seguimiento de Contratación de Personal</h2>
      </div>

      <div class="title">REPORTE OFICIAL DE DERIVACIÓN</div>

      <table class="info-table">
        <tr><th>Código Requerimiento:</th><td><strong>${data.codigoRequerimiento}</strong></td></tr>
        <tr><th>Código Derivación:</th><td><strong>${data.codigoDerivacion}</strong></td></tr>
        <tr><th>Fecha de Emisión:</th><td>${data.fecha}</td></tr>
        <tr><th>Nro. Certificación:</th><td>${data.nroCertificacion}</td></tr>
        <tr><th>Título del Requerimiento:</th><td>${data.titulo}</td></tr>
      </table>

      <table class="info-table">
        <tr><th>Persona a Contratar:</th><td>${data.personaNombres}</td></tr>
        <tr><th>Documento de Identidad:</th><td>${data.personaDocumento}</td></tr>
        <tr><th>Cargo:</th><td>${data.cargoNombre || 'No especificado'}</td></tr>
      </table>

      <table class="info-table">
        <tr><th>Unidad Solicitante:</th><td>${data.unidadSolicitante}</td></tr>
        <tr><th>Unidad de Destino:</th><td><strong>${data.unidadDestino}</strong></td></tr>
        <tr><th>Observaciones:</th><td>${data.observaciones || 'Ninguna'}</td></tr>
      </table>

      <div class="footer">
        <div class="signature-box">
          <br><br><br>
          <strong>${data.usuarioEnvio || 'Firma Digital'}</strong><br>
          Unidad Emisora
        </div>
        <div class="signature-box">
          <br><br><br>
          <strong>Recibido Conforme</strong><br>
          Unidad de Destino
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
