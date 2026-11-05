import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Scale, Activity } from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';
import type { Consulta } from '@/types/dashboard';

interface WeightEvolutionChartProps {
  consultas: Consulta[];
}

export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({ consultas }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    data: string | Date;
    peso: number;
    diffFromInitial: number;
    diffFromPrevious: number;
    x: number;
    y: number;
  } | null>(null);

  // Ordena consultas cronologicamente crescente para o gráfico (mais antiga -> mais recente)
  const validConsultas = [...consultas]
    .filter((c) => c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso)))
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

  // Se não houver consultas ainda ou sem pesos registrados
  if (validConsultas.length === 0) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFDFB] border border-dashed border-[#EBDAD2] text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF1E4] text-[#999B84] flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#2C211E]">
            Nenhuma consulta registrada ainda
          </h4>
          <p className="text-xs text-[#7A6963] max-w-md mx-auto leading-relaxed">
            O gráfico de evolução de peso será construído automaticamente conforme as consultas e aferições forem registradas.
          </p>
        </div>
      </div>
    );
  }

  const pesos = validConsultas.map((c) => Number(c.peso));
  const minPeso = Math.min(...pesos);
  const maxPeso = Math.max(...pesos);
  const pesoInicial = pesos[0];
  const pesoAtual = pesos[pesos.length - 1];
  const variacaoTotal = pesoAtual - pesoInicial;

  // Dimensões do SVG viewBox
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Margem dinâmica para o gráfico não colar nas bordas
  const pesoRange = maxPeso - minPeso;
  const yBuffer = pesoRange === 0 ? 2 : Math.max(pesoRange * 0.25, 1);
  const yMin = Math.max(0, minPeso - yBuffer);
  const yMax = maxPeso + yBuffer;
  const totalYRange = yMax - yMin;

  // Coordenadas dos pontos
  const points = validConsultas.map((c, i) => {
    const peso = Number(c.peso);
    const x =
      validConsultas.length === 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (i / (validConsultas.length - 1)) * plotWidth;
    const y = paddingTop + ((yMax - peso) / totalYRange) * plotHeight;
    const prevPeso = i > 0 ? Number(validConsultas[i - 1].peso) : peso;
    return {
      x,
      y,
      peso,
      data: c.data_consulta,
      diffFromInitial: peso - pesoInicial,
      diffFromPrevious: peso - prevPeso,
    };
  });

  // Linha poligonal / curva do gráfico
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Área sombreada sob a curva
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${
          paddingTop + plotHeight
        } Z`
      : '';

  // 4 linhas horizontais de referência
  const gridLines = [0, 0.33, 0.66, 1].map((pct) => {
    const val = yMin + (1 - pct) * totalYRange;
    const yPos = paddingTop + pct * plotHeight;
    return { val: val.toFixed(1), yPos };
  });

  return (
    <div className="space-y-4">
      {/* Resumo Estatístico da Evolução */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2]">
          <span className="text-[10px] font-bold text-[#7A6963] uppercase tracking-wider block">
            Peso Inicial
          </span>
          <p className="text-sm sm:text-base font-extrabold text-[#2C211E] mt-0.5">
            {pesoInicial.toFixed(1)} kg
          </p>
          <span className="text-[10px] text-[#7A6963]">
            {formatDateBR(validConsultas[0].data_consulta)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2]">
          <span className="text-[10px] font-bold text-[#7A6963] uppercase tracking-wider block">
            Peso Atual
          </span>
          <p className="text-sm sm:text-base font-extrabold text-[#2C211E] mt-0.5">
            {pesoAtual.toFixed(1)} kg
          </p>
          <span className="text-[10px] text-[#7A6963]">
            {formatDateBR(validConsultas[validConsultas.length - 1].data_consulta)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2]">
          <span className="text-[10px] font-bold text-[#7A6963] uppercase tracking-wider block">
            Evolução Total
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {variacaoTotal < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : variacaoTotal > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Minus className="w-4 h-4 text-[#7A6963] shrink-0" />
            )}
            <p
              className={`text-sm sm:text-base font-extrabold ${
                variacaoTotal < 0
                  ? 'text-emerald-700'
                  : variacaoTotal > 0
                  ? 'text-amber-700'
                  : 'text-[#2C211E]'
              }`}
            >
              {variacaoTotal > 0 ? `+${variacaoTotal.toFixed(1)}` : variacaoTotal.toFixed(1)} kg
            </p>
          </div>
          <span className="text-[10px] text-[#7A6963]">
            {variacaoTotal < 0 ? 'Perda de peso' : variacaoTotal > 0 ? 'Ganho de peso' : 'Sem alteração'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2]">
          <span className="text-[10px] font-bold text-[#7A6963] uppercase tracking-wider block">
            Menor / Maior
          </span>
          <p className="text-xs sm:text-sm font-bold text-[#2C211E] mt-1">
            <span className="text-emerald-700">{minPeso.toFixed(1)}</span>
            <span className="text-[#7A6963] mx-1">/</span>
            <span className="text-amber-700">{maxPeso.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-[#7A6963] ml-1">kg</span>
          </p>
          <span className="text-[10px] text-[#7A6963]">Extremos aferidos</span>
        </div>
      </div>

      {/* Container do Gráfico SVG */}
      <div className="relative w-full rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] p-2 sm:p-4 overflow-hidden">
        {/* Tooltip Flutuante */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            }}
          >
            <div className="bg-[#2C211E] text-white text-[11px] py-1.5 px-3 rounded-xl shadow-lg border border-[#3E302B] whitespace-nowrap mb-2 animate-fade-in">
              <div className="font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#D7A49A]" />
                <span>{hoveredPoint.peso.toFixed(1)} kg</span>
              </div>
              <div className="text-[10px] text-[#D7A49A] mt-0.5">
                {formatDateBR(hoveredPoint.data)}
              </div>
              {hoveredPoint.diffFromPrevious !== 0 && (
                <div className="text-[9px] text-white/80 mt-0.5 border-t border-white/10 pt-0.5">
                  {hoveredPoint.diffFromPrevious > 0 ? '+' : ''}
                  {hoveredPoint.diffFromPrevious.toFixed(1)} kg vs. anterior
                </div>
              )}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-64 select-none"
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#999B84" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#999B84" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#999B84" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#999B84" />
              <stop offset="100%" stopColor="#858771" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade e Valores do Eixo Y */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={line.yPos}
                x2={svgWidth - paddingRight}
                y2={line.yPos}
                stroke="#EBDAD2"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <text
                x={paddingLeft - 8}
                y={line.yPos + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#7A6963"
                fontWeight="500"
              >
                {line.val}
              </text>
            </g>
          ))}

          {/* Área com Gradiente */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#weightAreaGrad)"
            />
          )}

          {/* Linha Principal de Peso */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#weightLineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de Cada Consulta */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx;
            return (
              <g key={idx} className="cursor-pointer">
                {/* Alvo invisível maior para facilitar hover no mobile e desktop */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      index: idx,
                      data: pt.data,
                      peso: pt.peso,
                      diffFromInitial: pt.diffFromInitial,
                      diffFromPrevious: pt.diffFromPrevious,
                      x: pt.x,
                      y: pt.y,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Ponto externo / glow */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '7' : '5'}
                  fill="#FFFFFF"
                  stroke="#999B84"
                  strokeWidth={isHovered ? '3.5' : '2.5'}
                  className="transition-all duration-150 shadow-sm"
                />
                {/* Label de data abaixo no eixo X */}
                <text
                  x={pt.x}
                  y={paddingTop + plotHeight + 18}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#7A6963"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {formatDateBR(pt.data).slice(0, 5)}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex items-center justify-between text-[10px] text-[#7A6963] px-2 pt-1 border-t border-[#F0E4DC]">
          <span>Evolução cronológica de peso aferido em cada consulta</span>
          <span>Unidade: kg</span>
        </div>
      </div>
    </div>
  );
};

