import * as XLSX from 'xlsx';

export interface BudgetItem {
  codigoCosto: string;
  nd: number; // 4 = Capitulo, 5 = Subcapitulo, 8 = Agrupador, 10 = APU
  descripcion: string;
  tipo?: string; // M.O, T.C, etc.
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  valorPorInmueble?: number;
  valorPorM2?: number;
}

export interface BudgetChapterSummary {
  codigo: string;
  descripcion: string;
  valorTotal: number;
  porcentajeIncidencia: number;
  totalSubcapitulos: number;
  totalItems: number;
  comentariosCount: number;
}

export interface BudgetComment {
  id: string;
  codigoCosto: string;
  capituloDescripcion: string;
  fecha: string;
  usuarioResidente: string;
  tipoObservacion: 'Mayor Cantidad' | 'Obra Adicional' | 'Reproceso' | 'Ahorro' | 'Nota Técnica';
  cuentaContable?: string; // Ej: 23090001
  comentario: string;
  impactoEstimadoCOP?: number;
}

const STORAGE_BUDGET_COMMENTS_KEY = 'interventor_budget_comments_v1';

export class BudgetService {
  static getComentarios(): BudgetComment[] {
    try {
      const data = localStorage.getItem(STORAGE_BUDGET_COMMENTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error leyendo comentarios de presupuesto:', e);
    }
    // Comentarios de ejemplo iniciales para Belaterra Pietra
    const iniciales: BudgetComment[] = [
      {
        id: 'comm-01',
        codigoCosto: '02000000',
        capituloDescripcion: 'CIMENTACION',
        fecha: '2026-10-24T10:00:00Z',
        usuarioResidente: 'Carlos Mario Gómez',
        tipoObservacion: 'Mayor Cantidad',
        cuentaContable: '23090001',
        comentario: 'Mayor excavación por presencia de estrato blando en eje 9 a 6. Se requirió sobreexcavación de 1.2m y relleno ciclópeo.',
        impactoEstimadoCOP: 18500000,
      },
      {
        id: 'comm-02',
        codigoCosto: '03000000',
        capituloDescripcion: 'ESTRUCTURA',
        fecha: '2026-10-28T14:30:00Z',
        usuarioResidente: 'Carlos Mario Gómez',
        tipoObservacion: 'Nota Técnica',
        comentario: 'Fundida de losa piso 3 completada a satisfacción con cilindros a los 7 días al 78% de resistencia f\'c=28 MPa.',
        impactoEstimadoCOP: 0,
      },
    ];
    localStorage.setItem(STORAGE_BUDGET_COMMENTS_KEY, JSON.stringify(iniciales));
    return iniciales;
  }

  static agregarComentario(comentario: Omit<BudgetComment, 'id' | 'fecha'>): BudgetComment {
    const comentarios = this.getComentarios();
    const nuevo: BudgetComment = {
      ...comentario,
      id: `comm-${Date.now()}`,
      fecha: new Date().toISOString(),
    };
    comentarios.unshift(nuevo);
    localStorage.setItem(STORAGE_BUDGET_COMMENTS_KEY, JSON.stringify(comentarios));
    return nuevo;
  }

  static parseBudgetWorkbook(workbook: XLSX.WorkBook): BudgetItem[] {
    const sheetName = workbook.SheetNames.find(n => n.includes('PRESUPUESTO') || n.includes('OPUS')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];

    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    const items: BudgetItem[] = [];

    // Buscar la fila de encabezados que contenga 'CÓDIGO COSTO' o 'DESCRIPCION'
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(30, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row) && row.some(cell => String(cell).includes('CÓDIGO COSTO') || String(cell).includes('CODIGO'))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) headerRowIdx = 16; // default fallback

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[0] || !row[2]) continue;

      const codigo = String(row[0]).trim();
      const nd = Number(row[1]) || 10;
      const descripcion = String(row[2]).trim();
      const tipo = row[3] ? String(row[3]).trim() : undefined;
      const unidad = row[4] ? String(row[4]).trim() : 'UN';
      const cantidad = parseFloat(String(row[5]).replace(/,/g, '')) || 0;
      const valorUnitario = parseFloat(String(row[6]).replace(/,/g, '')) || 0;
      const valorTotal = parseFloat(String(row[7]).replace(/,/g, '')) || 0;

      if (codigo && descripcion) {
        items.push({
          codigoCosto: codigo,
          nd,
          descripcion,
          tipo,
          unidad,
          cantidad,
          valorUnitario,
          valorTotal,
          valorPorInmueble: parseFloat(String(row[8] || '0').replace(/,/g, '')) || undefined,
          valorPorM2: parseFloat(String(row[9] || '0').replace(/,/g, '')) || undefined,
        });
      }
    }

    return items;
  }
}
