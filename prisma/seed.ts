import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Converts Excel serial date (number) to ISO string (YYYY-MM-DD)
 * or handles formatted date strings
 */
function parseExcelDate(value: string | number | undefined): string {
  if (!value) return "";

  // If it's an Excel serial number
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }

  // If it's a string like "46023"
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const serial = parseInt(value, 10);
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }

  // If it's already a date string (e.g. "01/01/2026")
  if (typeof value === "string" && value.includes("/")) {
    const parts = value.split("/");
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return String(value);
}

/**
 * Cleans currency strings and converts to number
 */
function parseCurrency(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;

  // Remove R$, dots (thousands), and replace comma with dot
  const cleaned = value
    .toString()
    .replace(/R\$\s?/, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

interface RawExcelRow {
  ID?: number;
  Data?: string | number;
  Produto?: string;
  Categoria?: string;
  Quantidade?: number;
  "Preço Unitário"?: string | number;
  "Custo Unitário"?: string | number;
  "Total Venda"?: string | number;
  Vendedor?: string;
}

async function main() {
  const filePath = path.join(process.cwd(), "sales_data.xlsx");

  if (!fs.existsSync(filePath)) {
    console.error("❌ sales_data.xlsx not found at:", filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet) as RawExcelRow[];

  console.log(`📄 Found ${rawData.length} rows in Excel file...`);
  if (rawData.length > 0) {
    console.log("Headers encontrados:", Object.keys(rawData[0]));
  }

  // Clear existing records
  await prisma.sale.deleteMany();
  console.log("🗑️  Cleared existing sales records.");

  // Insert all rows
  for (const row of rawData) {
    const total = parseCurrency(row["Total Venda"]);
    const precoUnitario = parseCurrency(row["Preço Unitário"]);
    const unitCost = parseCurrency(row["Custo Unitário"]);
    const quantidade = Number(row["Quantidade"] ?? 1);

    await prisma.sale.create({
      data: {
        data: parseExcelDate(row["Data"]),
        produto: String(row["Produto"] ?? ""),
        categoria: String(row["Categoria"] ?? ""),
        quantidade,
        precoUnitario,
        custo: unitCost,
        total,
        vendedor: String(row["Vendedor"] ?? "Vendedor Padrão"),
      },
    });
  }

  console.log(`✅ Seeded ${rawData.length} records into the database.`);
}

main()
  .catch((e: Error) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
