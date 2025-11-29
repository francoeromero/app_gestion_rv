import { useState, useEffect, useCallback } from 'react';

export const useGoogleSheet = (url, interval = 30000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseCSV = (text) => {
    if (!text) return [];
    
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comilla escapada ("") dentro de comillas
          currentVal += '"';
          i++; // Saltar la siguiente comilla
        } else {
          // Inicio o fin de comillas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Fin de celda
        currentRow.push(currentVal);
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // Fin de línea
        // Manejar \r\n o \n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        
        // Solo agregar si hay contenido (evitar líneas vacías al final)
        if (currentRow.length > 0 || currentVal) {
          currentRow.push(currentVal);
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    
    // Agregar la última fila si quedó pendiente
    if (currentRow.length > 0 || currentVal) {
      currentRow.push(currentVal);
      rows.push(currentRow);
    }

    if (rows.length === 0) return [];

    // Extraer cabeceras (primera fila)
    const headers = rows[0].map(h => h.trim());
    
    return rows.slice(1).map(row => {
      return headers.reduce((obj, header, index) => {
        // Asignar valor o string vacío si no existe la columna
        obj[header] = row[index] ? row[index].trim() : '';
        return obj;
      }, {});
    });
  };

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    try {
      // Añadimos un timestamp para evitar caché del navegador
      const cacheBuster = `&t=${new Date().getTime()}`;
      const fetchUrl = url.includes('?') ? `${url}${cacheBuster}` : `${url}?${cacheBuster}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Error al cargar la hoja de cálculo');
      
      const text = await response.text();
      const parsedData = parseCSV(text);
      
      setData(parsedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching Google Sheet:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    
    if (interval > 0) {
      const id = setInterval(fetchData, interval);
      return () => clearInterval(id);
    }
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
};
