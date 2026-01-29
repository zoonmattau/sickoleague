"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SerializedContract } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: SerializedContract[];
  salaryUsed: number;
  salaryCap: number;
};

export function SalaryDetailDialog({
  open,
  onOpenChange,
  contracts,
  salaryUsed,
  salaryCap,
}: Props) {
  const currentYear = new Date().getFullYear();
  const salaryRemaining = salaryCap - salaryUsed;

  // Build cap by year data for chart (next 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const chartData = years.map((year) => {
    const used = contracts.reduce((sum, c) => {
      const yearValue = c.yearBreakdown.find((y) => y.season === year)?.value ?? 0;
      return sum + yearValue;
    }, 0);
    return {
      year: year.toString(),
      used,
      remaining: Math.max(0, salaryCap - used),
      overCap: Math.max(0, used - salaryCap),
    };
  });

  // Sort contracts by current year value
  const sortedContracts = [...contracts].sort((a, b) => {
    const aValue = a.yearBreakdown.find((y) => y.season === currentYear)?.value ?? 0;
    const bValue = b.yearBreakdown.find((y) => y.season === currentYear)?.value ?? 0;
    return bValue - aValue;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Salary Cap Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">${(salaryUsed * 1000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Used ({currentYear})</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">${(salaryCap * 1000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Salary Cap</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className={`text-2xl font-bold ${salaryRemaining < 0 ? "text-red-500" : "text-green-500"}`}>
                ${(Math.abs(salaryRemaining) * 1000).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {salaryRemaining < 0 ? "Over Cap" : "Remaining"}
              </div>
            </div>
          </div>

          {/* Cap by Year Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Cap Projection</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => [`$${value}k`, ""]}
                  />
                  <ReferenceLine y={salaryCap} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                  <Bar dataKey="used" stackId="a" fill="hsl(var(--primary))" name="Used" />
                  <Bar dataKey="overCap" stackId="a" fill="hsl(var(--destructive))" name="Over Cap" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Used</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-destructive" />
                <span>Over Cap</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-destructive border-dashed" />
                <span>Cap Limit (${salaryCap}k)</span>
              </div>
            </div>
          </div>

          {/* Contracts Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Contracts Breakdown</h3>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Years</TableHead>
                    {years.slice(0, 3).map((year) => (
                      <TableHead key={year} className="text-right">{year}</TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName}
                          {contract.tradeBlock && (
                            <Badge variant="destructive" className="text-xs">TB</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{contract.contractType}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {contract.startSeason}-{contract.endSeason}
                      </TableCell>
                      {years.slice(0, 3).map((year) => {
                        const yearValue = contract.yearBreakdown.find((y) => y.season === year)?.value;
                        return (
                          <TableCell key={year} className="text-right">
                            {yearValue !== undefined ? (
                              <span className={year === currentYear ? "font-semibold" : ""}>
                                ${yearValue}k
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold">
                        ${contract.totalValue}k
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
