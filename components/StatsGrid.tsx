import { TrendingUp, Package, DollarSign } from "lucide-react";
import { Sale } from "@/types/sales";

interface StatsProps {
  data: Sale[];
}

export const StatsGrid = ({ data }: StatsProps) => {
  const faturamentoTotal = data.reduce((acc, curr) => acc + curr.Total, 0);
  const custoTotal = data.reduce(
    (acc, curr) => acc + (curr.Custo ?? 0) * curr.Quantidade,
    0,
  );
  const lucroTotal = faturamentoTotal - custoTotal;
  const totalProducts = new Set(data.map((item) => item.Produto)).size;
  const ticketMedio = faturamentoTotal / (data.length || 1);

  const stats = [
    {
      label: "Total Bruto",
      value: `R$ ${faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "#38bdf8",
    },
    {
      label: "Total Líquido",
      value: `R$ ${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "#4ade80",
    },
    {
      label: "Ticket Médio",
      value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "#fbbf24",
    },
    {
      label: "Produtos",
      value: totalProducts.toString(),
      icon: Package,
      color: "#818cf8",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "24px",
        marginBottom: "40px",
      }}
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="premium-card animate-fade-in"
          style={{ padding: "24px", animationDelay: `${idx * 0.1}s` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                padding: "12px",
                borderRadius: "16px",
                backgroundColor: `${stat.color}20`,
                color: stat.color,
              }}
            >
              <stat.icon size={28} />
            </div>
            <div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700" }}>
                {stat.value}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
