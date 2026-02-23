"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import { Sale } from "@/types/sales";

interface ChartProps {
  data: Sale[];
}

export const SalesTrendChart = ({ data }: ChartProps) => {
  // Aggregate totals by date and sort chronologically
  const aggregatedData = Object.values(
    data.reduce(
      (acc, curr) => {
        const date = curr.Data;
        if (!acc[date]) {
          acc[date] = { Data: date, Total: 0 };
        }
        acc[date].Total += curr.Total;
        return acc;
      },
      {} as Record<string, { Data: string; Total: number }>,
    ),
  ).sort((a, b) => a.Data.localeCompare(b.Data));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={aggregatedData}
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e293b"
          vertical={false}
        />
        <XAxis
          dataKey="Data"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => {
            const parts = value.split("-");
            if (parts.length === 3) {
              return `${parts[2]}/${parts[1]}`;
            }
            return value;
          }}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
          }
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "12px",
            color: "#f8fafc",
          }}
          itemStyle={{ color: "#38bdf8" }}
          labelFormatter={(label) => {
            const str = String(label ?? "");
            const parts = str.split("-");
            if (parts.length === 3 && parts[0].length === 4)
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return str;
          }}
          formatter={(value: number | undefined) => [
            `R$ ${(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Total Bruto",
          ]}
        />
        <Line
          type="monotone"
          dataKey="Total"
          stroke="url(#lineGradient)"
          strokeWidth={4}
          dot={{ fill: "#38bdf8", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 8, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const COLORS = ["#38bdf8", "#818cf8", "#4ade80", "#fbbf24", "#f87171"];

interface PieSliceProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: { name: string };
  percent?: number;
  value?: number;
  index?: number;
}

// Custom active shape for hover effect (replaces deprecated Cell)
const renderActiveShape = (props: PieSliceProps) => {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#38bdf8",
    payload,
    percent = 0,
    value = 0,
  } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={-4}
        textAnchor="middle"
        fill={fill}
        fontSize={14}
        fontWeight={600}
      >
        {payload?.name}
      </text>
      <text
        x={cx}
        y={cy}
        dy={16}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={12}
      >
        {`R$ ${value.toLocaleString("pt-BR")}`}
      </text>
      <text
        x={cx}
        y={cy}
        dy={34}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={11}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const renderSlice = (props: PieSliceProps) => {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    index = 0,
  } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={COLORS[index % COLORS.length]}
    />
  );
};

export const CategoryPieChart = ({ data }: ChartProps) => {
  const aggregated = data.reduce(
    (acc: { name: string; value: number }[], curr) => {
      const existing = acc.find((item) => item.name === curr.Categoria);
      if (existing) {
        existing.value += curr.Total;
      } else {
        acc.push({ name: curr.Categoria, value: curr.Total });
      }
      return acc;
    },
    [],
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={aggregated}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          activeShape={renderActiveShape}
          shape={renderSlice}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "12px",
            color: "#f8fafc",
          }}
          itemStyle={{ color: "#38bdf8" }}
          formatter={(value: number | undefined) =>
            `R$ ${value?.toLocaleString("pt-BR") ?? "0"}`
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
