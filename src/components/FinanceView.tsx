import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Landmark,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { FINANCE_SNAPSHOT } from '../data/finance';

const formatMoney = (value: number, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));

export const FinanceView: React.FC = () => {
  const data = FINANCE_SNAPSHOT;
  const projectedDifference = data.projectedMonthEnd - data.currentCash;
  const cumulativeResult = data.actualIncome - data.actualExpenses;
  const largestExpense = Math.max(...data.expenses.map((expense) => expense.amount));

  return (
    <section className="overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-sm backdrop-blur-md">
      <header className="border-b border-zinc-100 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Cómo está la empresa</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Una lectura corta de la caja real, el cierre proyectado y en qué se viene gastando.
            </p>
          </div>
          <p className="text-xs text-zinc-400">{data.updatedAt}</p>
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-12">
          <article className="rounded-xl bg-zinc-950 p-5 text-white lg:col-span-7 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <WalletCards className="h-4 w-4 text-emerald-400" />
              Plata disponible hoy
            </div>
            <p className="mt-3 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
              ${formatMoney(data.currentCash)}
              <span className="ml-2 text-base font-normal text-zinc-400">USD</span>
            </p>

            <div className="my-6 h-px bg-white/10" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-400">Si se cumple la proyección de septiembre</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  ${formatMoney(data.projectedMonthEnd)} <span className="text-sm font-normal text-zinc-400">USD</span>
                </p>
              </div>
              <ArrowRight className="hidden h-5 w-5 text-zinc-600 sm:block" />
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5">
                <p className="text-[11px] text-emerald-200">Por concretar este mes</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-300">
                  +${formatMoney(projectedDifference)} USD
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <TrendingUp className="h-4 w-4" />
                Este mes, hasta ahora
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="font-mono text-lg font-semibold text-zinc-950">${formatMoney(data.currentMonth.income)}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">entró</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-zinc-950">${formatMoney(data.currentMonth.expenses)}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">salió</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-emerald-700">+${formatMoney(data.currentMonth.net)}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">quedó</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                <Landmark className="h-4 w-4 text-blue-600" />
                Acumulado registrado
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Ingresos</p>
                  <p className="font-mono text-base font-semibold text-zinc-900">${formatMoney(data.actualIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Gastos</p>
                  <p className="font-mono text-base font-semibold text-zinc-900">${formatMoney(data.actualExpenses)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Diferencia</p>
                  <p className="font-mono text-base font-semibold text-emerald-700">+${formatMoney(cumulativeResult)}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-zinc-900">Caja proyectada</h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Saldo esperado al cierre de cada mes.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">Proyección</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {data.forecast.map((item) => {
                const isNegative = item.balance < 0;
                return (
                  <div
                    key={item.month}
                    className={`rounded-lg border p-3 ${
                      isNegative ? 'border-amber-200 bg-amber-50' : 'border-zinc-200 bg-zinc-50'
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-500">{item.month}</p>
                    <p className={`mt-2 font-mono text-sm font-semibold ${isNegative ? 'text-amber-800' : 'text-zinc-900'}`}>
                      {isNegative ? '−' : ''}${formatMoney(item.balance)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed">
                <strong>Atención:</strong> el plan actual proyecta caja negativa en enero y febrero. Conviene revisar ingresos o retiros antes de llegar a esos meses.
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-zinc-900">En qué se fue la plata</h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Principales gastos acumulados, en USD.</p>

            <div className="mt-5 space-y-3.5">
              {data.expenses.slice(0, 5).map((expense) => (
                <div key={expense.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-zinc-700">{expense.label}</span>
                    <span className="font-mono font-semibold text-zinc-900">${formatMoney(expense.amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(expense.amount / largestExpense) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Los retiros de socios son el mayor destino; después vienen marketing y herramientas digitales.
            </p>
          </article>
        </div>

        <footer className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
          <p className="text-xs leading-relaxed text-zinc-500">
            Los números reales y las proyecciones se muestran separados para no confundir plata disponible con dinero esperado.
          </p>
        </footer>
      </div>
    </section>
  );
};
