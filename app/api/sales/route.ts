import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { data: "desc" },
    });

    // Map DB columns to frontend Sale interface
    const data = sales.map(
      (s: {
        id: number;
        data: string;
        produto: string;
        categoria: string;
        quantidade: number;
        precoUnitario: number;
        custo: number;
        total: number;
        vendedor: string;
      }) => ({
        id: s.id,
        Data: s.data,
        Produto: s.produto,
        Categoria: s.categoria,
        Quantidade: s.quantidade,
        PreçoUnitário: s.precoUnitario,
        Custo: s.custo,
        Total: s.total,
        Vendedor: s.vendedor,
      }),
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 },
    );
  }
}
