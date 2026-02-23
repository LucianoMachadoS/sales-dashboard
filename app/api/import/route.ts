import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function parseExcelDate(value: unknown): string {
  // Sem esse cálculo, se você importasse uma planilha onde a célula de data está formatada como "Data" no Excel, o sistema veria apenas um número estranho (como 45292) em vez do dia correto.
  if (!value) return "";
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      const serial = parseInt(value, 10);
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return date.toISOString().split("T")[0];
    }
    if (value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return String(value);
}

function parseCurrency(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value)
    .replace(/R\$\s?/, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<
      string,
      unknown
    >[];

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 },
      );
    }

    // Clear existing records and insert new ones
    await prisma.sale.deleteMany();

    const salesToCreate = rawData.map((row) => {
      const precoUnitario = parseCurrency(row["Preço Unitário"]);
      const quantidade = Number(row["Quantidade"] ?? 0);
      const custoUnitario = parseCurrency(row["Custo Unitário"]);

      return {
        data: parseExcelDate(row["Data"]),
        produto: String(row["Produto"] ?? ""),
        categoria: String(row["Categoria"] ?? ""),
        quantidade: quantidade,
        precoUnitario: precoUnitario,
        custo: custoUnitario,
        total: parseCurrency(row["Total Venda"]),
        vendedor: String(row["Vendedor"] ?? "Vendedor Padrão"),
      };
    });

    await prisma.sale.createMany({
      data: salesToCreate,
    });

    return NextResponse.json({ success: true, count: salesToCreate.length });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json(
      { error: "Failed to import excel" },
      { status: 500 },
    );
  }
}
