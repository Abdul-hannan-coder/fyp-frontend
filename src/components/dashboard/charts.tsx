"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function RevenueAreaChart({
  data,
}: {
  data: { month: string; collected: number; pending: number }[];
}) {
  const config = {
    collected: { label: "Collected (₨M)", color: "var(--chart-1)" },
    pending: { label: "Pending (₨M)", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="collected"
          type="monotone"
          stroke="var(--chart-1)"
          fill="url(#fillCollected)"
          strokeWidth={2}
        />
        <Area
          dataKey="pending"
          type="monotone"
          stroke="var(--chart-2)"
          fill="url(#fillPending)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function OccupancyBarChart({
  data,
}: {
  data: { block: string; occupied: number; total: number }[];
}) {
  const config = {
    occupied: { label: "Occupied", color: "var(--chart-1)" },
    total: { label: "Capacity", color: "var(--muted)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="block" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--muted)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="occupied" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function FeeDonut({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  const config = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.fill }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function AttendanceLineChart({
  data,
}: {
  data: { week: string; rate: number }[];
}) {
  const config = {
    rate: { label: "Attendance %", color: "var(--chart-4)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis domain={[80, 100]} tickLine={false} axisLine={false} fontSize={12} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="rate"
          type="monotone"
          stroke="var(--chart-4)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--chart-4)" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
