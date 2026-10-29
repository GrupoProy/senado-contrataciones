//import { randomUUID } from 'crypto'
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sufijoAleatorio(longitud = 7): string {
  let s = '';
  for (let i = 0; i < longitud; i++) {
    s += ALFABETO.charAt(Math.floor(Math.random() * ALFABETO.length));
  }
  return s;
}

function fechaCompacta(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/** REQ-YYYYMMDD-XXXXXXX */
export function generarCodigoRequerimiento(): string {
  return `REQ-${fechaCompacta()}-${sufijoAleatorio()}`;
}

/** DER-YYYYMMDD-XXXXXXX */
export function generarCodigoDerivacion(): string {
  return `DER-${fechaCompacta()}-${sufijoAleatorio()}`;
}

/** CT-YYYYMMDD-XXXXX */
// src/shared/utils/codigo.util.ts

export function generarNumeroContrato(): string {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  
  // Usamos los milisegundos y un número aleatorio de 3 dígitos para garantizar unicidad
  //const ms = String(ahora.getMilliseconds()).padStart(3, '0');
  //const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  
  return `CT-${year}${month}${day}-${sufijoAleatorio()}`;
}

/*
export function generarNumeroContrato(): string {
  // Usamos UUID y lo cortamos para que sea legible, pero con 0% de colisión
  const uuid = randomUUID().split('-')[0].toUpperCase();
  const year = new Date().getFullYear();
  return `CT-${year}-${uuid}`;
}*/