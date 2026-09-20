import { ObjectiveItem } from '../types';

// Objetivos importados de la hoja "OBJETIVOS 2026".
export const INITIAL_OBJECTIVES: ObjectiveItem[] = [
  {
    id: 'objective-2026-08',
    month: '2026-08',
    label: 'Agosto',
    monthlyGoal: 'Facturar USD 3.000',
    quarterlyGoal:
      'Construir estabilidad con una facturación mensual sostenida entre USD 3.000 y USD 7.000.',
    revenueTarget: 3000,
    actualRevenue: 0,
    milestones: [
      { id: 'aug-1', text: 'Enviar todo para el concurso Pro Diseño', done: true },
      { id: 'aug-2', text: 'Completar 3 formaciones de empresas', done: false },
      { id: 'aug-3', text: 'Mejorar la estética, experiencia y funcionamiento de la web y las asesorías', done: true },
      { id: 'aug-4', text: 'Construir la estrategia de redes', done: true },
    ],
  },
  {
    id: 'objective-2026-09',
    month: '2026-09',
    label: 'Septiembre',
    monthlyGoal: 'Armar el MVP del servicio paquetizado y facturar USD 3.000',
    quarterlyGoal:
      'Construir estabilidad con una facturación mensual sostenida entre USD 3.000 y USD 7.000.',
    revenueTarget: 3000,
    actualRevenue: 0,
    milestones: [
      { id: 'sep-1', text: 'Llegar a 2.000 seguidores en Instagram', done: false },
      { id: 'sep-2', text: 'Armar la propuesta para Semilla ANDE', done: false },
      { id: 'sep-3', text: 'Completar 2 grupos de asesorías', done: false },
      { id: 'sep-4', text: 'Completar 2 formaciones de empresas', done: false },
      { id: 'sep-5', text: 'Inscribirse en RUPE y realizar la implementación para ANCAP', done: false },
    ],
  },
  {
    id: 'objective-2026-10',
    month: '2026-10',
    label: 'Octubre',
    monthlyGoal: 'Consolidar la expansión comercial y facturar USD 7.000',
    quarterlyGoal: 'Expansión a México.',
    revenueTarget: 7000,
    actualRevenue: 0,
    milestones: [
      { id: 'oct-1', text: 'Presentarse a Semilla ANDE', done: false },
      { id: 'oct-2', text: 'Completar 4 grupos de asesorías', done: false },
      { id: 'oct-3', text: 'Completar 4 formaciones de empresas', done: false },
      { id: 'oct-4', text: 'Ganar Pro Diseño', done: false },
    ],
  },
  {
    id: 'objective-2026-11',
    month: '2026-11',
    label: 'Noviembre',
    monthlyGoal: 'Sostener el crecimiento y facturar USD 3.000',
    quarterlyGoal: 'Expansión a México.',
    revenueTarget: 3000,
    actualRevenue: 0,
    milestones: [
      { id: 'nov-1', text: 'Completar 4 formaciones de empresas', done: false },
    ],
  },
  {
    id: 'objective-2026-12',
    month: '2026-12',
    label: 'Diciembre',
    monthlyGoal: 'Fortalecer el networking y facturar USD 1.000',
    quarterlyGoal: 'Expansión a México.',
    revenueTarget: 1000,
    actualRevenue: 0,
    milestones: [
      { id: 'dec-1', text: 'Llegar a 10.000 seguidores en Instagram', done: false },
    ],
  },
];
