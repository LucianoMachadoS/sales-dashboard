"use client";

import { useEffect, useRef, useState } from "react";
import { Sale } from "@/types/sales";
import {
  ArrowLeft,
  Download,
  FileText,
  Search,
  Table as TableIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function RelatorioPage() {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [vendedor, setVendedor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json)) setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categorias = Array.from(new Set(data.map((d) => d.Categoria))).sort();
  const vendedores = Array.from(new Set(data.map((d) => d.Vendedor))).sort();

  const filteredData = data.filter((s) => {
    if (vendedor && s.Vendedor !== vendedor) return false;
    if (categoria && s.Categoria !== categoria) return false;
    if (minTotal && s.Total < parseFloat(minTotal)) return false;
    if (maxTotal && s.Total > parseFloat(maxTotal)) return false;
    return true;
  });

  const clearFilters = () => {
    setVendedor("");
    setCategoria("");
    setMinTotal("");
    setMaxTotal("");
  };

  const hasFilters = vendedor || categoria || minTotal || maxTotal;

  const totalFiltrado = filteredData.reduce((acc, curr) => acc + curr.Total, 0);
  const custoFiltrado = filteredData.reduce(
    (acc, curr) => acc + (curr.Custo ?? 0) * curr.Quantidade,
    0,
  );
  const lucroFiltrado = totalFiltrado - custoFiltrado;

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const exportAsImage = async () => {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Relatório de Vendas", 14, 20);

    // Summary
    doc.setFontSize(11);
    doc.text(`Registros: ${filteredData.length}`, 14, 30);
    doc.text(`Faturamento: ${formatCurrency(totalFiltrado)}`, 14, 36);
    doc.text(`Custo: ${formatCurrency(custoFiltrado)}`, 14, 42);
    doc.text(`Lucro: ${formatCurrency(lucroFiltrado)}`, 14, 48);

    autoTable(doc, {
      head: [
        [
          "Data",
          "Produto",
          "Categoria",
          "Vendedor",
          "Qtd",
          "Preço Unit.",
          "Custo",
          "Total",
        ],
      ],
      body: filteredData.map((s) => [
        formatDateBR(s.Data),
        s.Produto,
        s.Categoria,
        s.Vendedor,
        s.Quantidade,
        formatCurrency(s.PreçoUnitário),
        formatCurrency(s.Custo),
        formatCurrency(s.Total),
      ]),
      startY: 55,
      theme: "grid",
      headStyles: { fillColor: [56, 189, 248] }, // var(--accent-primary)
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio-vendas-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((s) => ({
        Data: formatDateBR(s.Data),
        Produto: s.Produto,
        Categoria: s.Categoria,
        Vendedor: s.Vendedor,
        Quantidade: s.Quantidade,
        "Preço Unitário": s.PreçoUnitário,
        Custo: s.Custo,
        "Total Bruto": s.Total,
        "Total Líquido": s.Total - (s.Custo ?? 0) * s.Quantidade,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(
      data,
      `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <main style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px",
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </Link>
          <h1
            className="gradient-text"
            style={{ fontSize: "36px", marginBottom: "8px" }}
          >
            Relatório Completo de Vendas
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
            {filteredData.length} registros encontrados
            {hasFilters ? " com os filtros aplicados" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={exportToExcel}
            className="premium-card"
            style={{
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "#22c55e",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              fontSize: "14px",
            }}
          >
            <TableIcon size={16} />
            Excel
          </button>

          <button
            onClick={exportToPDF}
            className="premium-card"
            style={{
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "#ef4444",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              fontSize: "14px",
            }}
          >
            <FileText size={16} />
            PDF
          </button>

          <button
            onClick={exportAsImage}
            disabled={exporting}
            className="premium-card"
            style={{
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: exporting ? "wait" : "pointer",
              background: "var(--accent-primary)",
              color: "#0f172a",
              fontWeight: "600",
              border: "none",
              opacity: exporting ? 0.7 : 1,
              fontSize: "14px",
            }}
          >
            <Download size={16} />
            {exporting ? "..." : "Imagem"}
          </button>
        </div>
      </header>

      {/* Filter Panel */}
      <div
        className="premium-card animate-fade-in"
        style={{ padding: "24px", marginBottom: "32px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Search size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Filtros</h2>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
              }}
            >
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Vendedor */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Vendedor
            </label>
            <select
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Total */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Total Mínimo (R$)
            </label>
            <input
              type="number"
              value={minTotal}
              onChange={(e) => setMinTotal(e.target.value)}
              placeholder="0"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Max Total */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Total Máximo (R$)
            </label>
            <input
              type="number"
              value={maxTotal}
              onChange={(e) => setMaxTotal(e.target.value)}
              placeholder="∞"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Total Bruto Filtrado",
            value: `R$ ${totalFiltrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "#38bdf8",
          },
          {
            label: "Custo Filtrado",
            value: `R$ ${custoFiltrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "#f87171",
          },
          {
            label: "Total Líquido Filtrado",
            value: `R$ ${lucroFiltrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "#4ade80",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="premium-card"
            style={{ padding: "20px" }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              {card.label}
            </p>
            <h3
              style={{ fontSize: "22px", fontWeight: "700", color: card.color }}
            >
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Table — this div gets captured for image export */}
      <div
        ref={tableRef}
        className="premium-card animate-fade-in"
        style={{ padding: "32px" }}
      >
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
            Carregando...
          </p>
        ) : (
          <>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "24px",
              }}
            >
              Dados de Vendas{" "}
              {hasFilters && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "400",
                    color: "var(--accent-primary)",
                  }}
                >
                  (filtrado)
                </span>
              )}
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--card-border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th style={{ padding: "14px" }}>Data</th>
                    <th style={{ padding: "14px" }}>Produto</th>
                    <th style={{ padding: "14px" }}>Categoria</th>
                    <th style={{ padding: "14px" }}>Vendedor</th>
                    <th style={{ padding: "14px", textAlign: "right" }}>Qtd</th>
                    <th style={{ padding: "14px", textAlign: "right" }}>
                      Preço Unit.
                    </th>
                    <th style={{ padding: "14px", textAlign: "right" }}>
                      Custo Unit.
                    </th>
                    <th style={{ padding: "14px", textAlign: "right" }}>
                      Total Bruto
                    </th>
                    <th style={{ padding: "14px", textAlign: "right" }}>
                      Total Líquido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        Nenhum registro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((sale, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid var(--card-border)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = "rgba(56,189,248,0.04)")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "14px" }}>
                          {formatDateBR(sale.Data)}
                        </td>
                        <td style={{ padding: "14px", fontWeight: "500" }}>
                          {sale.Produto}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              backgroundColor: "rgba(56, 189, 248, 0.1)",
                              color: "var(--accent-primary)",
                              fontSize: "13px",
                            }}
                          >
                            {sale.Categoria}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>{sale.Vendedor}</td>
                        <td style={{ padding: "14px", textAlign: "right" }}>
                          {sale.Quantidade}
                        </td>
                        <td style={{ padding: "14px", textAlign: "right" }}>
                          R${" "}
                          {(sale.PreçoUnitário ?? 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            textAlign: "right",
                            color: "#f87171",
                          }}
                        >
                          R${" "}
                          {(sale.Custo ?? 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            textAlign: "right",
                            fontWeight: "600",
                          }}
                        >
                          R${" "}
                          {sale.Total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#4ade80",
                          }}
                        >
                          R${" "}
                          {(
                            sale.Total -
                            (sale.Custo ?? 0) * sale.Quantidade
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
