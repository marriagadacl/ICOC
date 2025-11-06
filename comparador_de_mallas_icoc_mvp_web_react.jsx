import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Download, Upload, ArrowRightLeft, CheckCircle, RefreshCcw } from "lucide-react";

/**
 * Comparador de Mallas – MVP interactivo
 *
 * - Origen y Destino en paralelo, agrupados por semestre (nivel)
 * - Marcar aprobados en origen y aplicar equivalencias (1:1, N:1, 1:N, parciales)
 * - KPIs y avance por bloque (SCT)
 * - Import/Export JSON
 */

// ----------------------------- Tipos -----------------------------
type Modulo = {
  cod: string;
  nombre: string;
  bloque: "Básica" | "Disciplinar" | "Transversal" | string;
  sct: number;
  nivel: number; // semestre
};

type Regla = {
  id: string;
  tipo: "1:1" | "N:1" | "1:N" | "parcial" | "electivo";
  origen: string[];   // códigos plan antiguo
  destino: string[];  // códigos plan nuevo
  cobertura?: number; // 0..100 para parciales
  observaciones?: string;
};

type Plan = {
  id: string;
  nombre: string;
  malla: Modulo[];
};

// --------------------- Datos de ejemplo (mock) --------------------
const PLAN_ORIGEN: Plan = {
  id: "icoc-2016",
  nombre: "ICOC 2016 (RU-180-2024)",
  malla: [
    { cod: "MAT-INTRO", nombre: "Introducción a las Matemáticas", bloque: "Básica", sct: 6, nivel: 1 },
    { cod: "ALG-100", nombre: "Álgebra", bloque: "Básica", sct: 6, nivel: 1 },
    { cod: "COMP-INTRO", nombre: "Introducción a la Computación", bloque: "Básica", sct: 3, nivel: 1 },
    { cod: "GEOM-100", nombre: "Geometría Plana y del Espacio", bloque: "Básica", sct: 3, nivel: 1 },
    { cod: "ICC-INTRO", nombre: "Introducción Ingeniería Civil Obras Civiles", bloque: "Disciplinar", sct: 5, nivel: 1 },
    { cod: "CAL-101", nombre: "Cálculo I", bloque: "Básica", sct: 6, nivel: 2 },
    { cod: "LIN-200", nombre: "Álgebra Lineal", bloque: "Básica", sct: 6, nivel: 2 },
    { cod: "DIBUJO-CAD", nombre: "Dibujo para Construcción Asistido por Computador", bloque: "Disciplinar", sct: 4, nivel: 2 },
    { cod: "QUI-100", nombre: "Química", bloque: "Básica", sct: 6, nivel: 2 },
    { cod: "CAL-103", nombre: "Cálculo III", bloque: "Básica", sct: 6, nivel: 3 },
    { cod: "FIS-GRAL", nombre: "Física General", bloque: "Básica", sct: 6, nivel: 3 },
    { cod: "CUB-PLAN", nombre: "Cubicación e Interpretación de Planos", bloque: "Disciplinar", sct: 3, nivel: 3 },
    { cod: "TOPO-300", nombre: "Topografía", bloque: "Disciplinar", sct: 4, nivel: 3 },
    { cod: "EDI-1", nombre: "Edificación I", bloque: "Disciplinar", sct: 4, nivel: 3 },
    { cod: "EDIF-2", nombre: "Edificación II", bloque: "Disciplinar", sct: 4, nivel: 4 },
    { cod: "ECU-DIF", nombre: "Ecuaciones Diferenciales", bloque: "Básica", sct: 4, nivel: 4 },
    { cod: "MEC-GRAL", nombre: "Mecánica General", bloque: "Disciplinar", sct: 5, nivel: 4 },
    { cod: "TEC-MAT", nombre: "Tecnología y Materiales de Construcción", bloque: "Disciplinar", sct: 5, nivel: 4 },
    { cod: "ELEC-MAG", nombre: "Electricidad y Magnetismo", bloque: "Básica", sct: 5, nivel: 5 },
    { cod: "MEC-FLUI", nombre: "Mecánica de Fluidos", bloque: "Disciplinar", sct: 5, nivel: 5 },
    { cod: "RES-MAT", nombre: "Resistencia de Materiales", bloque: "Disciplinar", sct: 5, nivel: 5 },
    { cod: "EST-APLI", nombre: "Estática Aplicada", bloque: "Disciplinar", sct: 4, nivel: 5 },
    { cod: "PROB-EST", nombre: "Probabilidad y Estadística", bloque: "Básica", sct: 5, nivel: 5 },
    { cod: "MS-1", nombre: "Mecánica de Suelos I", bloque: "Disciplinar", sct: 4, nivel: 6 },
    { cod: "HIDR-400", nombre: "Hidráulica", bloque: "Disciplinar", sct: 5, nivel: 6 },
    { cod: "TEC-HORM", nombre: "Tecnología del Hormigón", bloque: "Disciplinar", sct: 4, nivel: 6 },
    { cod: "AN-EST", nombre: "Análisis de Estructuras", bloque: "Disciplinar", sct: 6, nivel: 6 },
    { cod: "TOP-APLI", nombre: "Tópicos Computacionales Aplicados a Ing. Civil", bloque: "Disciplinar", sct: 4, nivel: 6 },
    { cod: "DIN-EST", nombre: "Dinámica de Estructuras", bloque: "Disciplinar", sct: 5, nivel: 7 },
    { cod: "ING-SAN", nombre: "Ingeniería Sanitaria", bloque: "Disciplinar", sct: 5, nivel: 7 },
    { cod: "HA-1", nombre: "Hormigón Armado I", bloque: "Disciplinar", sct: 5, nivel: 7 },
    { cod: "MS-2", nombre: "Mecánica de Suelos II", bloque: "Disciplinar", sct: 5, nivel: 7 },
    { cod: "TRANS-700", nombre: "Ingeniería de Transporte", bloque: "Disciplinar", sct: 4, nivel: 7 },
    { cod: "OBR-VIA", nombre: "Obras Viales", bloque: "Disciplinar", sct: 5, nivel: 8 },
    { cod: "FUND-800", nombre: "Fundaciones", bloque: "Disciplinar", sct: 5, nivel: 8 },
    { cod: "ADM-FUND", nombre: "Fundamentos de Administración", bloque: "Disciplinar", sct: 5, nivel: 8 },
    { cod: "DIS-MAD", nombre: "Diseño en Madera", bloque: "Disciplinar", sct: 5, nivel: 8 },
    { cod: "HA-2", nombre: "Hormigón Armado II", bloque: "Disciplinar", sct: 5, nivel: 8 },
    { cod: "OBR-CIV", nombre: "Obras Civiles", bloque: "Disciplinar", sct: 5, nivel: 9 },
    { cod: "PCP-900", nombre: "Planificación y Control de Proyectos", bloque: "Disciplinar", sct: 5, nivel: 9 },
    { cod: "GRH-900", nombre: "Gestión de Recursos Humanos", bloque: "Disciplinar", sct: 4, nivel: 9 },
    { cod: "DSR-900", nombre: "Diseño Sismo Resistente", bloque: "Disciplinar", sct: 6, nivel: 9 },
    { cod: "DAC-900", nombre: "Diseño en Acero", bloque: "Disciplinar", sct: 4, nivel: 9 },
    { cod: "IEEP-1000", nombre: "Ingeniería Económica y Evaluación de Proyectos", bloque: "Disciplinar", sct: 6, nivel: 10 },
    { cod: "TALL-EST", nombre: "Taller de Proyectos de Estructuras", bloque: "Integración", sct: 6, nivel: 10 },
    { cod: "PT-1", nombre: "Proyecto de Titulación I", bloque: "Integración", sct: 5, nivel: 10 },
    { cod: "PT-2", nombre: "Proyecto de Titulación II", bloque: "Integración", sct: 9, nivel: 11 }
  ],
};

const PLAN_DESTINO: Plan = {
  id: "icoc-2026",
  nombre: "ICOC 2026 – RU-818-2025",
  malla: [
    { cod: "MAT-INTRO", nombre: "Introducción a las Matemáticas", bloque: "FI/CB", sct: 7, nivel: 1 },
    { cod: "ICS-100", nombre: "Introducción a las Ciencias para Ingeniería", bloque: "FI/CB", sct: 6, nivel: 1 },
    { cod: "ICC-INTRO", nombre: "Introducción a la Ingeniería en Obras Civiles", bloque: "FD", sct: 6, nivel: 1 },
    { cod: "HDIG-ING", nombre: "Herramientas Digitales para la Ingeniería Civil", bloque: "FD/FT", sct: 7, nivel: 1 },
    { cod: "FIT-101", nombre: "Formación Inicial Transversal", bloque: "FI/FT", sct: 4, nivel: 1 },
    { cod: "CVI-200", nombre: "Cálculo en una Variable", bloque: "FB", sct: 6, nivel: 2 },
    { cod: "ALG-200", nombre: "Álgebra", bloque: "FB", sct: 6, nivel: 2 },
    { cod: "TALL-EDIF", nombre: "Taller de Edificación", bloque: "FD", sct: 7, nivel: 2 },
    { cod: "PROG-APL", nombre: "Programación Aplicada", bloque: "FD", sct: 6, nivel: 2 },
    { cod: "FCC-200", nombre: "Formación Cultural y Ciudadana", bloque: "FT", sct: 4, nivel: 2 },
    { cod: "CVV-300", nombre: "Cálculo en Varias Variables", bloque: "FB", sct: 6, nivel: 3 },
    { cod: "ALG-LIN", nombre: "Álgebra Lineal", bloque: "FB", sct: 6, nivel: 3 },
    { cod: "FIS-GRAL-2026", nombre: "Física General", bloque: "FB", sct: 6, nivel: 3 },
    { cod: "MAT-ING", nombre: "Materiales de Ingeniería Civil", bloque: "FD", sct: 6, nivel: 3 },
    { cod: "LE-PI1", nombre: "Lengua Extranjera Principiante I", bloque: "FI/LE", sct: 5, nivel: 3 },
    { cod: "FUND-ORG", nombre: "Fundamentos para la Gestión Organizacional", bloque: "FD/FT", sct: 6, nivel: 4 },
    { cod: "ECU-DIF-2026", nombre: "Ecuaciones Diferenciales", bloque: "FB", sct: 6, nivel: 4 },
    { cod: "FIS-APL", nombre: "Física Aplicada", bloque: "FB", sct: 6, nivel: 4 },
    { cod: "FUND-EST", nombre: "Fundamentos de Estructuras", bloque: "FD", sct: 7, nivel: 4 },
    { cod: "LE-PI2", nombre: "Lengua Extranjera Principiante II", bloque: "FI/LE", sct: 5, nivel: 4 },
    { cod: "EXPL-LID", nombre: "Exploración Profesional y Liderazgo Vinculado", bloque: "MI/FT", sct: 6, nivel: 5 },
    { cod: "PROB-EST-2026", nombre: "Probabilidad y Estadística", bloque: "FB", sct: 6, nivel: 5 },
    { cod: "MEC-SOL", nombre: "Mecánica de Sólidos", bloque: "FD", sct: 7, nivel: 5 },
    { cod: "MEC-FLUI-2026", nombre: "Mecánica de Fluidos", bloque: "FD", sct: 7, nivel: 5 },
    { cod: "LE-INT1", nombre: "Lengua Extranjera Intermedio I", bloque: "FI/LE", sct: 5, nivel: 5 },
    { cod: "INN-EMP", nombre: "Innovación y Emprendimiento", bloque: "FD/FT", sct: 6, nivel: 6 },
    { cod: "GEOM-2026", nombre: "Geomensura", bloque: "FD", sct: 6, nivel: 6 },
    { cod: "MEC-SUELOS", nombre: "Mecánica de Suelos", bloque: "FD", sct: 7, nivel: 6 },
    { cod: "HIDR-2026", nombre: "Hidráulica", bloque: "FD", sct: 6, nivel: 6 },
    { cod: "AN-EST-2026", nombre: "Análisis de Estructuras", bloque: "FD", sct: 6, nivel: 6 },
    { cod: "FORM-EVAL", nombre: "Formulación y Evaluación de Proyectos", bloque: "FD/FT", sct: 6, nivel: 7 },
    { cod: "DIS-FUND", nombre: "Diseño de Fundaciones", bloque: "FD", sct: 6, nivel: 7 },
    { cod: "ING-SISM", nombre: "Ingeniería Sísmica", bloque: "FD", sct: 7, nivel: 7 },
    { cod: "TEC-DIG", nombre: "Tecnologías Digitales Aplicadas", bloque: "FD/FT", sct: 5, nivel: 7 },
    { cod: "PLAN-OBR", nombre: "Planificación y Control de Obras", bloque: "FD", sct: 5, nivel: 7 },
    { cod: "GCOL-PROY", nombre: "Gestión Colaborativa de Proyectos", bloque: "MI/FT", sct: 7, nivel: 8 },
    { cod: "DIS-HA", nombre: "Diseño en Hormigón Armado", bloque: "FD", sct: 7, nivel: 8 },
    { cod: "DIS-ACERO", nombre: "Diseño en Acero", bloque: "FD", sct: 6, nivel: 8 },
    { cod: "ELEC-1", nombre: "Electivo 1", bloque: "FC/E", sct: 5, nivel: 8 },
    { cod: "FCS-800", nombre: "Formación Colaborativa y Social", bloque: "FT", sct: 6, nivel: 8 },
    { cod: "PPROF-2", nombre: "Práctica Profesional II (Estival)", bloque: "MI", sct: 8, nivel: 0 },
    { cod: "GPRO-INF", nombre: "Gestión de Proyectos de Infraestructura", bloque: "FD", sct: 8, nivel: 9 },
    { cod: "PINT-EST", nombre: "Proyecto Integrador de Estructuras", bloque: "MI/FT", sct: 8, nivel: 9 },
    { cod: "IMPACTO-AMB", nombre: "Impacto Ambiental en la Ingeniería Civil", bloque: "FD", sct: 5, nivel: 9 },
    { cod: "ELEC-2", nombre: "Electivo 2", bloque: "FC/E", sct: 5, nivel: 9 },
    { cod: "ELEC-3", nombre: "Electivo 3", bloque: "FC/E", sct: 5, nivel: 9 },
    { cod: "PROY-TIT", nombre: "Proyecto de Titulación", bloque: "MI/FT", sct: 15, nivel: 10 },
    { cod: "ELEC-4", nombre: "Electivo 4", bloque: "FC/E", sct: 5, nivel: 10 },
    { cod: "ELEC-5", nombre: "Electivo 5", bloque: "FC/E", sct: 5, nivel: 10 }
  ],
};

const REGLAS: Regla[] = [
  // Equivalencias 2016 → 2026 (tabla institucional + excepciones)
  { id: "R1", tipo: "1:1", origen: ["MAT-INTRO"], destino: ["MAT-INTRO"] },
  { id: "R2", tipo: "1:1", origen: ["ALG-100"], destino: ["ALG-200"] },
  { id: "R3", tipo: "1:1", origen: ["ICC-INTRO"], destino: ["ICC-INTRO"] },
  { id: "R4", tipo: "1:1", origen: ["LIN-200"], destino: ["ALG-LIN"] },
  { id: "R5", tipo: "1:1", origen: ["QUI-100"], destino: ["ICS-100"] },
  { id: "R6", tipo: "1:N", origen: ["DIBUJO-CAD"], destino: ["PROG-APL", "TEC-DIG"], observaciones: "Desdoblamiento hacia competencias digitales" },
  { id: "R7", tipo: "1:1", origen: ["CAL-103"], destino: ["CVV-300"], observaciones: "Cálculo III → Cálculo en Varias Variables" },
  { id: "R7b", tipo: "parcial", origen: ["CAL-103"], destino: ["CVI-200"], cobertura: 100, observaciones: "* Actividad complementaria (promoción cambio de plan)" },
  { id: "R8", tipo: "1:1", origen: ["FIS-GRAL"], destino: ["FIS-GRAL-2026"] },
  { id: "R9", tipo: "1:1", origen: ["TOPO-300"], destino: ["GEOM-2026"] },
  { id: "R10", tipo: "1:1", origen: ["ECU-DIF"], destino: ["ECU-DIF-2026"] },
  { id: "R11", tipo: "N:1", origen: ["RES-MAT", "EST-APLI"], destino: ["FUND-EST"], observaciones: "Resistencia + Estática → Fundamentos de Estructuras" },
  { id: "R12", tipo: "1:1", origen: ["PROB-EST"], destino: ["PROB-EST-2026"] },
  { id: "R13", tipo: "1:1", origen: ["MEC-FLUI"], destino: ["MEC-FLUI-2026"] },
  { id: "R14", tipo: "1:1", origen: ["HIDR-400"], destino: ["HIDR-2026"] },
  { id: "R15", tipo: "1:1", origen: ["AN-EST"], destino: ["AN-EST-2026"] },
  { id: "R16", tipo: "1:1", origen: ["TEC-HORM"], destino: ["MAT-ING"] },
  { id: "R17", tipo: "1:1", origen: ["FUND-800"], destino: ["DIS-FUND"] },
  { id: "R18", tipo: "1:1", origen: ["DSR-900"], destino: ["ING-SISM"] },
  { id: "R19", tipo: "1:1", origen: ["DAC-900"], destino: ["DIS-ACERO"] },
  { id: "R20", tipo: "1:1", origen: ["TALL-EST"], destino: ["PINT-EST"] },
  { id: "R21", tipo: "1:1", origen: ["IEEP-1000"], destino: ["FORM-EVAL"] },
  { id: "R22", tipo: "1:1", origen: ["PCP-900"], destino: ["PLAN-OBR"] },
  { id: "R23", tipo: "1:1", origen: ["HA-2"], destino: ["DIS-HA"] },
  { id: "R24", tipo: "electivo", origen: ["DIS-MAD"], destino: ["ELEC-1"], observaciones: "Reconoce como electivo según oferta" },
  { id: "R25", tipo: "electivo", origen: ["ING-SAN"], destino: ["ELEC-5"], observaciones: "Tabla institucional mapea a Electivo 5" },
  { id: "R26", tipo: "parcial", origen: ["OBR-VIA"], destino: ["IMPACTO-AMB"], cobertura: 60, observaciones: "Reconocimiento parcial (enfoque ambiental)" },
  { id: "R27", tipo: "N:1", origen: ["PT-1", "PT-2"], destino: ["PROY-TIT"], observaciones: "PT I+II → Proyecto de Titulación (15 SCT)" },
  // Excepciones documentadas
  { id: "E1", tipo: "parcial", origen: ["CAL-101"], destino: ["CVI-200"], cobertura: 100, observaciones: "* Si aprobó Cálculo I → Actividad Complementaria" },
  { id: "E2", tipo: "parcial", origen: ["HIDR-400", "DIN-EST"], destino: ["FIS-APL"], cobertura: 100, observaciones: "** Hidráulica + Dinámica de Estructuras → Física Aplicada" }
];

// ------------------------- Utilidades ---------------------------
const porBloque = (malla: Modulo[]) => {
  return malla.reduce<Record<string, number>>((acc, m) => {
    acc[m.bloque] = (acc[m.bloque] ?? 0) + m.sct;
    return acc;
  }, {});
};

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ------------------------- Componente ---------------------------
export default function App() {
  const [planOrigen, setPlanOrigen] = useState<Plan>(PLAN_ORIGEN);
  const [planDestino, setPlanDestino] = useState<Plan>(PLAN_DESTINO);
  const [reglas, setReglas] = useState<Regla[]>(REGLAS);
  const [aprobados, setAprobados] = useState<string[]>([]);

  // Motor simple: aplica reglas en orden 1:1 → N:1 → 1:N → parcial
  const resultado = useMemo(() => {
    const origenHechos = new Set(aprobados);
    const reconocidosDestino = new Set<string>();
    const parciales: { destino: string; cobertura: number; detalle: string }[] = [];

    const consumir = (cods: string[]) => cods.every(c => origenHechos.has(c));

    // 1:1
    reglas.filter(r => r.tipo === "1:1").forEach(r => {
      if (consumir(r.origen)) r.destino.forEach(d => reconocidosDestino.add(d));
    });
    // N:1
    reglas.filter(r => r.tipo === "N:1").forEach(r => {
      if (consumir(r.origen)) r.destino.forEach(d => reconocidosDestino.add(d));
    });
    // 1:N
    reglas.filter(r => r.tipo === "1:N").forEach(r => {
      if (consumir(r.origen)) r.destino.forEach(d => reconocidosDestino.add(d));
    });
    // parciales
    reglas.filter(r => r.tipo === "parcial").forEach(r => {
      if (consumir(r.origen)) {
        const cov = Math.max(0, Math.min(100, r.cobertura ?? 0));
        r.destino.forEach(d => parciales.push({ destino: d, cobertura: cov, detalle: r.observaciones || "" }));
        if (cov === 100) r.destino.forEach(d => reconocidosDestino.add(d));
      }
    });

    // Calcular SCT reconocidos/pendientes
    const mDestino = planDestino.malla;
    const sctReconocidos = mDestino.filter(m => reconocidosDestino.has(m.cod)).reduce((a, m) => a + m.sct, 0);
    const pendientes = mDestino.filter(m => !reconocidosDestino.has(m.cod)).map(m => m.cod);

    // Avances por bloque
    const totBloque = porBloque(mDestino);
    const recBloque = mDestino.reduce<Record<string, number>>((acc, m) => {
      if (reconocidosDestino.has(m.cod)) acc[m.bloque] = (acc[m.bloque] ?? 0) + m.sct;
      return acc;
    }, {});

    return { reconocidosDestino, parciales, sctReconocidos, pendientes, totBloque, recBloque };
  }, [aprobados, planDestino, reglas]);

  const toggleAprobado = (cod: string) => {
    setAprobados(prev => prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]);
  };

  const reset = () => setAprobados([]);

  // Export/Import JSON
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ planOrigen, planDestino, reglas, aprobados }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mallas_icoc_snapshot.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        if (obj.planOrigen) setPlanOrigen(obj.planOrigen);
        if (obj.planDestino) setPlanDestino(obj.planDestino);
        if (obj.reglas) setReglas(obj.reglas);
        if (obj.aprobados) setAprobados(obj.aprobados);
      } catch (err) { alert("Archivo inválido"); }
    };
    reader.readAsText(f);
  };

  const bloquesDestino = Array.from(new Set(planDestino.malla.map(m => m.bloque)));

  // Agrupar por semestre (nivel)
  const origenPorNivel = useMemo(() => {
    const map = new Map<number, Modulo[]>();
    planOrigen.malla.forEach(m => { const arr = map.get(m.nivel) || []; arr.push(m); map.set(m.nivel, arr); });
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([nivel, modulos]) => ({ nivel, modulos }));
  }, [planOrigen]);

  const destinoPorNivel = useMemo(() => {
    const map = new Map<number, Modulo[]>();
    planDestino.malla.forEach(m => { const arr = map.get(m.nivel) || []; arr.push(m); map.set(m.nivel, arr); });
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([nivel, modulos]) => ({ nivel, modulos }));
  }, [planDestino]);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-neutral-50">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">Comparador de Mallas ICOC – MVP</h1>
          <div className="flex gap-2">
            <Button onClick={exportar} className="rounded-2xl shadow"><Download className="w-4 h-4 mr-1"/>Exportar</Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow cursor-pointer border">
              <Upload className="w-4 h-4"/>
              <span>Importar</span>
              <Input type="file" accept="application/json" className="hidden" onChange={importar}/>
            </label>
            <Button variant="secondary" onClick={reset} className="rounded-2xl"><RefreshCcw className="w-4 h-4 mr-1"/>Limpiar</Button>
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          {/* Origen */}
          <Card className="rounded-2xl shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-neutral-500">Plan de Origen</div>
                  <div className="font-semibold">{planOrigen.nombre}</div>
                </div>
                <div className="text-xs text-neutral-500">Marque ramos aprobados</div>
              </div>
              <div className="space-y-4">
                {origenPorNivel.map(({ nivel, modulos }) => (
                  <div key={nivel}>
                    <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Semestre {nivel}</div>
                    <div className="rounded-xl border bg-white">
                      {modulos.map((m) => (
                        <div key={m.cod} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={aprobados.includes(m.cod)} onCheckedChange={() => toggleAprobado(m.cod)} />
                            <span className="text-sm">{m.nombre} <span className="text-xs text-neutral-500">({m.bloque})</span></span>
                          </div>
                          <div className="text-sm font-semibold">{m.sct} SCT</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Destino + Resultados */}
          <Card className="rounded-2xl shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-neutral-500">Plan de Destino</div>
                  <div className="font-semibold">{planDestino.nombre}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4"/>
                  <span className="text-sm">Equivalencias aplicadas</span>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white border">
                  <div className="text-xs text-neutral-500">SCT reconocidos</div>
                  <div className="text-xl font-semibold">{resultado.sctReconocidos}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border">
                  <div className="text-xs text-neutral-500">Módulos destino reconocidos</div>
                  <div className="text-xl font-semibold">{resultado.reconocidosDestino.size}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border">
                  <div className="text-xs text-neutral-500">Pendientes</div>
                  <div className="text-xl font-semibold">{resultado.pendientes.length}</div>
                </div>
              </div>

              {/* Avance por bloque */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Avance por bloque</div>
                <div className="grid grid-cols-3 gap-2">
                  {bloquesDestino.map(b => {
                    const total = resultado.totBloque[b] ?? 0;
                    const rec = resultado.recBloque[b] ?? 0;
                    const pct = total ? Math.round((rec / total) * 100) : 0;
                    return (
                      <div key={b} className="p-3 rounded-xl bg-white border">
                        <div className="text-xs text-neutral-500">{b}</div>
                        <div className="text-sm font-semibold">{rec}/{total} SCT</div>
                        <div className="h-2 mt-1 bg-neutral-200 rounded">
                          <div className="h-2 rounded bg-neutral-900" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabla destino */}
              <div className="space-y-4">
                {destinoPorNivel.map(({ nivel, modulos }) => (
                  <div key={nivel}>
                    <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Semestre {nivel}</div>
                    <div className="rounded-xl border bg-white">
                      {modulos.map((m) => {
                        const ok = resultado.reconocidosDestino.has(m.cod);
                        return (
                          <div key={m.cod} className={classNames("flex items-center justify-between px-3 py-2 border-b last:border-b-0", ok && "bg-green-50") }>
                            <div className="flex items-center gap-2">
                              {ok ? <CheckCircle className="w-4 h-4"/> : <span className="w-4 h-4"/>}
                              <span className="text-sm">{m.nombre} <span className="text-xs text-neutral-500">({m.bloque})</span></span>
                            </div>
                            <div className="text-sm font-semibold">{m.sct} SCT</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Parciales */}
              {resultado.parciales.length > 0 && (
                <div className="mt-4 p-3 rounded-xl border bg-amber-50">
                  <div className="text-sm font-semibold mb-1">Reconocimientos parciales</div>
                  <ul className="text-sm list-disc ml-5">
                    {resultado.parciales.map((p, i) => (
                      <li key={i}><strong>{p.destino}</strong>: cobertura {p.cobertura}% {p.detalle && `– ${p.detalle}`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Pie – Selectores / Mock planes */}
        <footer className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">Plan origen:</span>
            <Select defaultValue={planOrigen.id}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="icoc-2016">ICOC 2016</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-neutral-600">Plan destino:</span>
            <Select defaultValue={planDestino.id}>
              <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="icoc-2026">ICOC 2026 – RU-818-2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-neutral-500">MVP – Datos de ejemplo. Soporta Import/Export JSON para pruebas con datos reales.</div>
        </footer>
      </div>
    </div>
  );
}
