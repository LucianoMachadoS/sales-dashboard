export interface Sale {
  id: number;
  Data: string;
  Produto: string;
  Categoria: string;
  Quantidade: number;
  PreçoUnitário: number;
  Custo: number;
  Total: number;
  Vendedor: string;
}

export interface ExcelRow {
  ID: number;
  Data: string;
  Produto: string;
  Categoria: string;
  Quantidade: number;
  "Preço Unitário": number;
  Total: number;
  Vendedor: string;
}
