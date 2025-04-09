// Formatear monto con separadores de miles
export const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-PY').format(monto);
};

// Convertir números a letras (versión para guaraníes)
export const numeroALetras = (numero: number): string => {
  
  if (numero === 0) return 'CERO GUARANIES';
  
  // Para simplificar, limitamos a números hasta 999,999,999
  if (numero > 999999999) return 'NUMERO DEMASIADO GRANDE';

  let resultado = '';
  
  // Millones
  const millones = Math.floor(numero / 1000000);
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'UN MILLON ';
    } else {
      resultado += numeroALetrasSinUnidad(millones) + ' MILLONES ';
    }
    numero %= 1000000;
  }
  
  // Miles
  const miles = Math.floor(numero / 1000);
  if (miles > 0) {
    if (miles === 1) {
      resultado += 'MIL ';
    } else {
      resultado += numeroALetrasSinUnidad(miles) + ' MIL ';
    }
    numero %= 1000;
  }
  
  // Resto
  if (numero > 0) {
    resultado += numeroALetrasSinUnidad(numero);
  }
  
  return resultado.trim() + ' GUARANIES';
};

// Función auxiliar para convertir números sin añadir la unidad al final
function numeroALetrasSinUnidad(numero: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  
  if (numero === 0) return '';
  
  let resultado = '';
  
  // Manejo de centenas
  const centena = Math.floor(numero / 100);
  if (centena > 0) {
    if (centena === 1 && numero % 100 === 0) {
      return 'CIEN';
    }
    resultado += centenas[centena] + ' ';
    numero %= 100;
  }
  
  // Manejo de decenas y unidades
  if (numero > 0) {
    if (numero < 10) {
      resultado += unidades[numero];
    } else if (numero < 20) {
      resultado += especiales[numero - 10];
    } else {
      const decena = Math.floor(numero / 10);
      const unidad = numero % 10;
      
      if (unidad === 0) {
        resultado += decenas[decena];
      } else {
        if (decena === 2) {
          resultado += 'VEINTI' + unidades[unidad];
        } else {
          resultado += decenas[decena] + ' Y ' + unidades[unidad];
        }
      }
    }
  }
  
  return resultado.trim();
} 