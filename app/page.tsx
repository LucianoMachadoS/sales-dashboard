"use client";

import { useEffect, useState } from "react";
import { StatsGrid } from "@/components/StatsGrid";
import { SalesTrendChart, CategoryPieChart } from "@/components/Charts";
import { RefreshCw, FileText, Upload } from "lucide-react";
import { Sale } from "@/types/sales";
import Link from "next/link";

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "-";
  // Handles YYYY-MM-DD or DD/MM/YYYY or similar formats
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function Dashboard() {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales");
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchImport = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to import excel");
      }
    } catch (err) {
      console.error(err);
      alert("Error importing file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      fetchImport(e.target.files[0]);
    }
  };

  const triggerFileUpload = () => {
    document.getElementById("excel-upload")?.click();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RefreshCw
          className="animate-spin"
          size={48}
          color="var(--accent-primary)"
        />
      </div>
    );
  }

  // Show only the last 10 records in the preview table
  const previewData = data.slice(0, 10);

  return (
    <main style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <input
        id="excel-upload"
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px",
        }}
      >
        <div>
          <h1
            className="gradient-text"
            style={{ fontSize: "40px", marginBottom: "8px" }}
          >
            Portal de Vendas Insumos
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "18px" }}>
            Dashboard Analítico • Performance do Trimestre
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={triggerFileUpload}
            className="premium-card"
            style={{
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "transparent",
              color: "var(--text-primary)",
              fontWeight: "600",
              border: "1px solid var(--card-border)",
            }}
          >
            <Upload size={18} /> Importar Excel
          </button>
          <button
            onClick={fetchData}
            className="premium-card"
            style={{
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "transparent",
              color: "var(--text-primary)",
              fontWeight: "600",
              border: "1px solid var(--card-border)",
            }}
          >
            <RefreshCw size={18} /> Atualizar
          </button>
          <Link
            href="/relatorio"
            className="premium-card"
            style={{
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              background: "var(--accent-primary)",
              color: "#0f172a",
              fontWeight: "600",
              border: "none",
              textDecoration: "none",
            }}
          >
            <FileText size={18} /> Ver Relatório Completo
          </Link>
        </div>
      </header>

      <StatsGrid data={data} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        <div
          className="premium-card animate-fade-in"
          style={{ padding: "32px", animationDelay: "0.4s" }}
        >
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "24px",
              fontWeight: "600",
            }}
          >
            Evolução de Faturamento
          </h2>
          <SalesTrendChart data={data} />
        </div>
        <div
          className="premium-card animate-fade-in"
          style={{ padding: "32px", animationDelay: "0.5s" }}
        >
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "24px",
              fontWeight: "600",
            }}
          >
            Distribuição por Categoria
          </h2>
          <CategoryPieChart data={data} />
        </div>
      </div>

      <div
        className="premium-card animate-fade-in"
        style={{ padding: "32px", animationDelay: "0.6s" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
            Últimas 10 Vendas
          </h2>
          <Link
            href="/relatorio"
            style={{
              color: "var(--accent-primary)",
              fontSize: "14px",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Ver todos →
          </Link>
        </div>
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
                <th style={{ padding: "16px" }}>Data</th>
                <th style={{ padding: "16px" }}>Produto</th>
                <th style={{ padding: "16px" }}>Categoria</th>
                <th style={{ padding: "16px" }}>Vendedor</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Qtd</th>
                <th style={{ padding: "16px", textAlign: "right" }}>
                  Preço Unit.
                </th>
                <th style={{ padding: "16px", textAlign: "right" }}>
                  Custo Unit.
                </th>
                <th style={{ padding: "16px", textAlign: "right" }}>
                  Total Bruto
                </th>
                <th style={{ padding: "16px", textAlign: "right" }}>
                  Total Líquido
                </th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((sale, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--card-border)" }}
                >
                  <td style={{ padding: "16px" }}>{formatDateBR(sale.Data)}</td>
                  <td style={{ padding: "16px", fontWeight: "500" }}>
                    {sale.Produto}
                  </td>
                  <td style={{ padding: "16px" }}>
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
                  <td style={{ padding: "16px" }}>{sale.Vendedor}</td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    {sale.Quantidade}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    R${" "}
                    {(sale.PreçoUnitário ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      textAlign: "right",
                      color: "#f87171",
                      fontWeight: "500",
                    }}
                  >
                    R${" "}
                    {(sale.Custo ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      padding: "16px",
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
                      padding: "16px",
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
