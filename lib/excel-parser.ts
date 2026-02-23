import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { Sale, ExcelRow } from "../types/sales";

export function getSalesData(): Sale[] {
  const filePath = path.join(process.cwd(), "sales_data.xlsx");

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return [];
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON
  const rawData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
  console.log(rawData);

  // Map raw data to fit our interface if needed
  return rawData.map((row: ExcelRow) => ({
    id: row.ID,
    Data: row.Data,
    Produto: row.Produto,
    Categoria: row.Categoria,
    Quantidade: row.Quantidade,
    PreçoUnitário: row["Preço Unitário"],
    Custo: 0,
    Total: row.Total,
    Vendedor: row.Vendedor,
  }));
}
