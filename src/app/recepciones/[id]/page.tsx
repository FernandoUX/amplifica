"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import {
  IconChevronLeft, IconChevronRight, IconTrash, IconScan, IconBarcode, IconPhotoOff, IconPhoto,
  IconClock, IconUser, IconPlayerPlay, IconPlayerStop, IconEye,
  IconChevronDown, IconChevronUp, IconDots, IconPackage,
  IconX, IconCheck, IconUpload, IconSearch, IconHelpCircle, IconFileText,
  IconBell, IconCirclePlus, IconCalendarEvent, IconCircleCheck, IconShield,
  IconDownload, IconCamera, IconMessage, IconBuildingWarehouse,
  IconPlus, IconClipboardCheck, IconLockOpen, IconAlertTriangle,
} from "@tabler/icons-react";
import {
  QuarantineRecord, QuarantineStatus, QuarantineResolution, QuarantineCategory,
  QR_STORAGE_KEY, SEED_QUARANTINE, ORDENES_SEED,
} from "../_data";
import FormField from "@/components/ui/FormField";
import ProductsModal, { type AddProduct } from "@/components/recepciones/ProductsModal";
import QrDisplaySection from "@/components/recepciones/QrDisplaySection";
import QrScannerModal from "@/components/recepciones/QrScannerModal";
import StatusBadge, { type Status } from "@/components/recepciones/StatusBadge";
import { playScanSuccessSound, playScanErrorSound } from "@/lib/scan-sounds";
import Button from "@/components/ui/Button";
import AlertModal from "@/components/ui/AlertModal";
import { type Role, getRole, can } from "@/lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductConteo = {
  id: string;
  sku: string;
  nombre: string;
  barcode: string;
  imagen?: string;
  esperadas: number;
  contadasSesion: number;
};

type SesionItem = {
  pid: string;
  sku: string;
  nombre: string;
  cantidad: number;
};

type Sesion = {
  id: string;
  operador: string;
  inicio: string;
  fin: string;
  items: SesionItem[];
};

type OrdenData = {
  id: string;
  seller: string;
  sucursal: string;
  fechaAgendada: string;
  estado?: string;           // original status from list page (e.g. "Creado", "Programado")
  pallets?: number;
  bultos?: number;
  comentarios?: string;
  comentarioRecepcion?: string;
  products: ProductConteo[];
};

type IncidenciaTagKey =
  | "sin-codigo-barra" | "codigo-incorrecto" | "codigo-ilegible"
  | "sin-nutricional"  | "sin-vencimiento"
  | "danio-parcial"    | "danio-total"
  | "no-en-sistema";

type IncidenciaRow = {
  rowId: string;
  skuId: string;
  tag: IncidenciaTagKey | "";
  cantidad: number;
  imagenes: File[];
  imageUrls?: string[];   // seed image URLs (alternative to File objects)
  nota: string;
  descripcion: string;    // only for "no-en-sistema"
};

type NewProductForm = {
  nombre: string;
  sku: string;
  barcode: string;
  cantidad: string;
  imagen: File | null;
  comentarios: string;
  categoria: string;
};

type AuditEvent = {
  id: string;
  tipo: string;
  titulo: string;
  timestamp: string;
  usuario: string;
  rol: string;
  detalle?: string;
  estadoAnterior?: string;
  estadoPosterior?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDENES: Record<string, OrdenData> = {
  "RO-BARRA-180": {
    id: "RO-BARRA-180",
    seller: "Le Vice",
    sucursal: "Santiago Centro",
    fechaAgendada: "20/02/2026 16:30",
    pallets: 2,
    bultos: 4,
    comentarios: "Mercancía frágil, manipular con cuidado. Entregar en andén 3.",
    comentarioRecepcion: "Recibido en andén 3. 2 pallets en buen estado, 4 bultos verificados. Sin novedades.",
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", imagen: "/products/extra-life-tropical-delight.png", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     barcode: "8500942860625", imagen: "/products/extra-life-variety-pack.png",      esperadas: 150, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-184": {
    id: "RO-BARRA-184",
    seller: "Extra Life",
    sucursal: "Quilicura",
    fechaAgendada: "19/02/2026 10:00",
    pallets: 3,
    bultos: 6,
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", imagen: "/products/extra-life-tropical-delight.png", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     barcode: "8500942860625", imagen: "/products/extra-life-variety-pack.png",      esperadas: 150, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-179": {
    id: "RO-BARRA-179",
    seller: "Gohard",
    sucursal: "La Reina",
    fechaAgendada: "18/02/2026 09:00",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 80,  contadasSesion: 0 },
      { id: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",   barcode: "7891234560002", esperadas: 60,  contadasSesion: 0 },
    ],
  },
  "RO-BARRA-185": {
    id: "RO-BARRA-185",
    seller: "Gohard",
    sucursal: "Lo Barnechea",
    fechaAgendada: "17/02/2026 14:00",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 60,  contadasSesion: 0 },
      { id: "p2", sku: "GH-003", nombre: "Gohard Pre-Workout Energy 300g",       barcode: "7891234560003", esperadas: 45,  contadasSesion: 0 },
    ],
  },
  // ─── Completada ─────────────────────────────────────────────────────────────
  "RO-BARRA-189": {
    id: "RO-BARRA-189",
    seller: "Le Vice",
    sucursal: "Santiago Centro",
    fechaAgendada: "13/02/2026 15:30",
    pallets: 2,
    bultos: 6,
    products: [
      { id: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",  barcode: "7891234560201", esperadas: 400, contadasSesion: 0 },
      { id: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps", barcode: "7891234560202", esperadas: 350, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-200": {
    id: "RO-BARRA-200",
    seller: "BioNature",
    sucursal: "Quilicura",
    fechaAgendada: "04/03/2026 15:00",
    pallets: 4,
    bultos: 10,
    products: [
      { id: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g",  barcode: "7891234560301", esperadas: 500, contadasSesion: 0 },
      { id: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",       barcode: "7891234560302", esperadas: 300, contadasSesion: 0 },
    ],
  },
  // ─── Nuevas ORs Programadas ─────────────────────────────────────────────────
  "RO-BARRA-226": {
    id: "RO-BARRA-226",
    seller: "Gohard",
    sucursal: "Las Condes",
    fechaAgendada: "14/03/2026 09:00",
    pallets: 3,
    bultos: 10,
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 390, contadasSesion: 0 },
      { id: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",   barcode: "7891234560002", esperadas: 390, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-227": {
    id: "RO-BARRA-227",
    seller: "Le Vice",
    sucursal: "Providencia",
    fechaAgendada: "15/03/2026 08:30",
    pallets: 5,
    bultos: 16,
    comentarios: "Carga incluye productos de temporada, priorizar descarga.",
    products: [
      { id: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",     barcode: "7891234560201", esperadas: 820, contadasSesion: 0 },
      { id: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps",  barcode: "7891234560202", esperadas: 820, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-228": {
    id: "RO-BARRA-228",
    seller: "VitaFit",
    sucursal: "Quilicura",
    fechaAgendada: "15/03/2026 14:00",
    pallets: 8,
    bultos: 24,
    products: [
      { id: "p1", sku: "VF-101", nombre: "VitaFit Proteína Vegana 1kg Vainilla",   barcode: "7801234560101", esperadas: 1050, contadasSesion: 0 },
      { id: "p2", sku: "VF-102", nombre: "VitaFit Omega-3 Cápsulas 120 uds",       barcode: "7801234560102", esperadas: 1050, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-229": {
    id: "RO-BARRA-229",
    seller: "NutriPro",
    sucursal: "Lo Barnechea",
    fechaAgendada: "16/03/2026 10:00",
    pallets: 2,
    bultos: 8,
    comentarios: "Segundo envío del mes, verificar contra OC anterior.",
    products: [
      { id: "p1", sku: "NP-001", nombre: "NutriPro Whey Protein Isolate 900g",  barcode: "7801234560401", esperadas: 270, contadasSesion: 0 },
      { id: "p2", sku: "NP-002", nombre: "NutriPro BCAA 300g Sandía",           barcode: "7801234560402", esperadas: 270, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-230": {
    id: "RO-BARRA-230",
    seller: "Extra Life",
    sucursal: "La Reina",
    fechaAgendada: "17/03/2026 11:30",
    pallets: 4,
    bultos: 14,
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", imagen: "/products/extra-life-tropical-delight.png", esperadas: 600, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     barcode: "8500942860625", imagen: "/products/extra-life-variety-pack.png",      esperadas: 600, contadasSesion: 0 },
    ],
  },
  // ─── Pendiente de aprobación ──────────────────────────────────────────────
  "RO-BARRA-187": {
    id: "RO-BARRA-187",
    seller: "Le Vice",
    sucursal: "La Reina",
    fechaAgendada: "14/02/2026 13:00",
    products: [
      { id: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",     barcode: "7891234560201", esperadas: 1200, contadasSesion: 0 },
      { id: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps",  barcode: "7891234560202", esperadas: 850,  contadasSesion: 0 },
      { id: "p3", sku: "LV-003", nombre: "Le Vice Omega-3 120 Cápsulas",          barcode: "7891234560203", esperadas: 500,  contadasSesion: 0 },
    ],
  },
  "RO-BARRA-199": {
    id: "RO-BARRA-199",
    seller: "NutriPro",
    sucursal: "Las Condes",
    fechaAgendada: "06/03/2026 10:00",
    products: [
      { id: "p1", sku: "NP-001", nombre: "NutriPro Whey Protein Isolate 900g", barcode: "7801234560401", esperadas: 380, contadasSesion: 0 },
      { id: "p2", sku: "NP-002", nombre: "NutriPro BCAA 300g Sandía",          barcode: "7801234560402", esperadas: 400, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-212": {
    id: "RO-BARRA-212",
    seller: "Gohard",
    sucursal: "Providencia",
    fechaAgendada: "10/03/2026 09:30",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 640, contadasSesion: 0 },
      { id: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",   barcode: "7891234560002", esperadas: 700, contadasSesion: 0 },
    ],
  },
  // ─── En proceso de conteo ─────────────────────────────────────────────────
  "RO-BARRA-198": {
    id: "RO-BARRA-198",
    seller: "VitaFit",
    sucursal: "Santiago Centro",
    fechaAgendada: "07/03/2026 08:30",
    products: [
      { id: "p1", sku: "VF-101", nombre: "VitaFit Proteína Vegana 1kg Vainilla", barcode: "7801234560101", esperadas: 560, contadasSesion: 0 },
      { id: "p2", sku: "VF-102", nombre: "VitaFit Omega-3 Cápsulas 120 uds",     barcode: "7801234560102", esperadas: 560, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-219": {
    id: "RO-BARRA-219",
    seller: "NutriPro",
    sucursal: "Quilicura",
    fechaAgendada: "03/03/2026 10:30",
    comentarios: "Conteo parcial, faltan 8 SKUs por verificar.",
    products: [
      { id: "p1", sku: "NP-001", nombre: "NutriPro Whey Protein Isolate 900g", barcode: "7801234560401", esperadas: 1420, contadasSesion: 0 },
      { id: "p2", sku: "NP-002", nombre: "NutriPro BCAA 300g Sandía",          barcode: "7801234560402", esperadas: 1420, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-220": {
    id: "RO-BARRA-220",
    seller: "BioNature",
    sucursal: "La Reina",
    fechaAgendada: "02/03/2026 09:00",
    products: [
      { id: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g", barcode: "7891234560301", esperadas: 310, contadasSesion: 0 },
      { id: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",      barcode: "7891234560302", esperadas: 300, contadasSesion: 0 },
    ],
  },
  // ─── Completada (con conteo finalizado) ───────────────────────────────────
  "RO-BARRA-223": {
    id: "RO-BARRA-223",
    seller: "Extra Life",
    sucursal: "Las Condes",
    fechaAgendada: "25/02/2026 16:00",
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", imagen: "/products/extra-life-tropical-delight.png", esperadas: 680, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     barcode: "8500942860625", imagen: "/products/extra-life-variety-pack.png",      esperadas: 680, contadasSesion: 0 },
    ],
  },
  "RO-BARRA-215": {
    id: "RO-BARRA-215",
    seller: "Gohard",
    sucursal: "Las Condes",
    fechaAgendada: "26/02/2026 08:30",
    products: [
      { id: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate",  barcode: "7891234560001", esperadas: 1050, contadasSesion: 0 },
      { id: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",   barcode: "7891234560002", esperadas: 1050, contadasSesion: 0 },
    ],
  },
};

// ─── Seed sessions for ORs already "En proceso de conteo" ─────────────────────
const SEED_SESIONES: Record<string, Sesion[]> = {
  "RO-BARRA-184": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-19T10:05:00", fin: "2026-02-19T10:48:00",
      items: [
        { pid: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 4 Sachets Tropical Delight", cantidad: 58 },
        { pid: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     cantidad: 72 },
      ],
    },
  ],
  "RO-BARRA-179": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-02-18T09:05:00", fin: "2026-02-18T09:52:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 40 },
        { pid: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",  cantidad: 25 },
      ],
    },
  ],
  "RO-BARRA-185": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-02-17T14:05:00", fin: "2026-02-17T14:58:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 30 },
        { pid: "p2", sku: "GH-003", nombre: "Gohard Pre-Workout Energy 300g",      cantidad: 18 },
      ],
    },
  ],
  // ─── Completada ─────────────────────────────────────────────────────────────
  "RO-BARRA-189": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-13T15:35:00", fin: "2026-02-13T16:40:00",
      items: [
        { pid: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",     cantidad: 400 },
        { pid: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps",  cantidad: 350 },
      ],
    },
  ],
  "RO-BARRA-200": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-04T15:10:00", fin: "2026-03-04T16:15:00",
      items: [
        { pid: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g", cantidad: 500 },
        { pid: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",      cantidad: 300 },
      ],
    },
  ],
  // ─── Pendiente de aprobación ──────────────────────────────────────────────
  "RO-BARRA-187": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-14T13:10:00", fin: "2026-02-14T14:45:00",
      items: [
        { pid: "p1", sku: "LV-001", nombre: "Le Vice Colágeno Hidrolizado 500g",    cantidad: 1200 },
        { pid: "p2", sku: "LV-002", nombre: "Le Vice Vitamina C Liposomal 60 caps", cantidad: 850 },
        { pid: "p3", sku: "LV-003", nombre: "Le Vice Omega-3 120 Cápsulas",         cantidad: 500 },
      ],
    },
  ],
  "RO-BARRA-199": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-06T10:15:00", fin: "2026-03-06T11:20:00",
      items: [
        { pid: "p1", sku: "NP-001", nombre: "NutriPro Whey Protein Isolate 900g", cantidad: 380 },
        { pid: "p2", sku: "NP-002", nombre: "NutriPro BCAA 300g Sandía",          cantidad: 400 },
      ],
    },
  ],
  "RO-BARRA-212": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-03-10T09:40:00", fin: "2026-03-10T10:50:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 640 },
        { pid: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",  cantidad: 700 },
      ],
    },
  ],
  // ─── En proceso de conteo ─────────────────────────────────────────────────
  "RO-BARRA-198": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-03-07T08:40:00", fin: "2026-03-07T09:10:00",
      items: [
        { pid: "p1", sku: "VF-101", nombre: "VitaFit Proteína Vegana 1kg Vainilla", cantidad: 85 },
      ],
    },
  ],
  "RO-BARRA-219": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-03T10:40:00", fin: "2026-03-03T11:55:00",
      items: [
        { pid: "p1", sku: "NP-001", nombre: "NutriPro Whey Protein Isolate 900g", cantidad: 150 },
        { pid: "p2", sku: "NP-002", nombre: "NutriPro BCAA 300g Sandía",          cantidad: 150 },
      ],
    },
  ],
  "RO-BARRA-220": [
    {
      id: "SES-001", operador: "Catalina Mora",
      inicio: "2026-03-02T09:10:00", fin: "2026-03-02T10:05:00",
      items: [
        { pid: "p1", sku: "BN-001", nombre: "BioNature Spirulina Orgánica 300g", cantidad: 310 },
        { pid: "p2", sku: "BN-002", nombre: "BioNature Chlorella 200 Tabs",      cantidad: 300 },
      ],
    },
  ],
  // ─── Completada (con conteo finalizado) ───────────────────────────────────
  "RO-BARRA-223": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-25T16:10:00", fin: "2026-02-25T17:20:00",
      items: [
        { pid: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", cantidad: 680 },
        { pid: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",     cantidad: 680 },
      ],
    },
  ],
  "RO-BARRA-215": [
    {
      id: "SES-001", operador: "Fernando Roblero",
      inicio: "2026-02-26T08:40:00", fin: "2026-02-26T10:00:00",
      items: [
        { pid: "p1", sku: "GH-001", nombre: "Gohard Proteína Whey 1kg Chocolate", cantidad: 1050 },
        { pid: "p2", sku: "GH-002", nombre: "Gohard Creatina Monohidratada 300g",  cantidad: 1050 },
      ],
    },
  ],
};

// ─── Seed incidencias for pre-closed ORs (with image URLs) ───────────────────
const SEED_INCIDENCIAS: Record<string, IncidenciaRow[]> = {
  // RO-BARRA-187 — Le Vice (Pendiente de aprobación): 3 incidencias across 2 products
  "RO-BARRA-187": [
    {
      rowId: "inc-187-1", skuId: "p1", tag: "danio-parcial", cantidad: 45,
      imagenes: [], imageUrls: ["/products/extra-life-tropical-delight.png"],
      nota: "Cajas aplastadas en la parte inferior del pallet, producto interno intacto",
      descripcion: "",
    },
    {
      rowId: "inc-187-2", skuId: "p2", tag: "sin-codigo-barra", cantidad: 30,
      imagenes: [], imageUrls: ["/products/extra-life-variety-pack.png"],
      nota: "Lote sin etiqueta de código de barras, requiere re-etiquetado",
      descripcion: "",
    },
    {
      rowId: "inc-187-3", skuId: "p3", tag: "sin-vencimiento", cantidad: 12,
      imagenes: [], imageUrls: ["/products/extra-life-tropical-delight.png"],
      nota: "Unidades sin fecha de vencimiento visible en el envase",
      descripcion: "",
    },
  ],
  // RO-BARRA-199 — NutriPro (Pendiente de aprobación): 2 incidencias
  "RO-BARRA-199": [
    {
      rowId: "inc-199-1", skuId: "p1", tag: "danio-total", cantidad: 20,
      imagenes: [], imageUrls: ["/products/extra-life-variety-pack.png"],
      nota: "Bolsas rotas con producto derramado, no apto para venta",
      descripcion: "",
    },
    {
      rowId: "inc-199-2", skuId: "p2", tag: "codigo-incorrecto", cantidad: 15,
      imagenes: [], imageUrls: ["/products/extra-life-tropical-delight.png"],
      nota: "Código de barras no corresponde al SKU declarado",
      descripcion: "",
    },
  ],
  // RO-BARRA-212 — Gohard (Pendiente de aprobación): 1 incidencia
  "RO-BARRA-212": [
    {
      rowId: "inc-212-1", skuId: "p1", tag: "sin-nutricional", cantidad: 50,
      imagenes: [], imageUrls: ["/products/extra-life-variety-pack.png"],
      nota: "Lote sin tabla nutricional impresa, regulación sanitaria exige devolución",
      descripcion: "",
    },
  ],
  // RO-BARRA-220 — BioNature (Pendiente de aprobación): 2 incidencias
  "RO-BARRA-220": [
    {
      rowId: "inc-220-1", skuId: "p1", tag: "danio-parcial", cantidad: 25,
      imagenes: [], imageUrls: ["/products/extra-life-tropical-delight.png"],
      nota: "Envases con abolladuras en la tapa, contenido ok",
      descripcion: "",
    },
    {
      rowId: "inc-220-2", skuId: "p2", tag: "codigo-ilegible", cantidad: 18,
      imagenes: [], imageUrls: ["/products/extra-life-variety-pack.png"],
      nota: "Códigos de barra impresos borrosos, escáner no los lee",
      descripcion: "",
    },
  ],
};

// ─── Quarantine helpers ────────────────────────────────────────────────────────
function categoryFromTag(tag: IncidenciaTagKey): QuarantineCategory {
  if (tag === "sin-nutricional" || tag === "sin-vencimiento") return "devolucion_seller";
  if (tag === "danio-parcial"   || tag === "danio-total")     return "decision_seller";
  return "interna";
}

function loadAllQuarantine(): QuarantineRecord[] {
  try {
    const s = localStorage.getItem(QR_STORAGE_KEY);
    return s ? JSON.parse(s) : SEED_QUARANTINE;
  } catch { return SEED_QUARANTINE; }
}

function saveAllQuarantine(records: QuarantineRecord[]) {
  try { localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

function buildQuarantineRecords(
  orId: string, seller: string, sucursal: string,
  products: ProductConteo[], incidencias: Record<string, IncidenciaRow[]>,
): QuarantineRecord[] {
  return products.flatMap(p =>
    (incidencias[p.id] ?? [])
      .filter(r => r.tag !== "")
      .map(r => ({
        id:          `QR-${orId}-${p.id}-${r.rowId.slice(-6)}`,
        orId, seller, sucursal,
        sku:         p.sku,
        skuId:       p.id,
        productName: p.nombre,
        cantidad:    r.cantidad,
        tag:         r.tag as string,
        categoria:   categoryFromTag(r.tag as IncidenciaTagKey),
        estado:      "pendiente" as QuarantineStatus,
        resolucion:  null,
        creadoEn:    new Date().toISOString(),
        notas:       r.nota || undefined,
      }))
  );
}

function getFallbackOrden(id: string): OrdenData {
  // Try to get seller/sucursal/estado from ORDENES_SEED for consistency with list page
  const seed = ORDENES_SEED.find(o => o.id === id);
  return {
    id,
    seller: seed?.seller ?? "Extra Life",
    sucursal: seed?.sucursal ?? "Quilicura",
    fechaAgendada: seed?.fechaAgendada ?? "—",
    estado: seed?.estado,
    pallets: seed?.pallets,
    bultos: seed?.bultos,
    comentarios: seed?.comentarios,
    comentarioRecepcion: seed?.comentarioRecepcion,
    products: [
      { id: "p1", sku: "300034", nombre: "Extra Life Boost De Hidratación 20 Sachets Tropical Delight", barcode: "8500942860946", imagen: "/products/extra-life-tropical-delight.png", esperadas: 100, contadasSesion: 0 },
      { id: "p2", sku: "300052", nombre: "Boost De Hidratación Extra Life 20 Sachets Variety Pack",      barcode: "8500942860625", imagen: "/products/extra-life-variety-pack.png",      esperadas: 100, contadasSesion: 0 },
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ProductStatus = "completo" | "diferencia" | "exceso" | "pendiente";

function getProductStatus(total: number, esperadas: number): ProductStatus {
  if (total === 0 && esperadas > 0) return "pendiente";
  if (esperadas === 0 && total > 0)  return "exceso";
  if (total === esperadas)            return "completo";
  return "diferencia";
}

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function sesionId(n: number) { return `SES-${String(n).padStart(3, "0")}`; }

// ─── Audit log seed data ──────────────────────────────────────────────────────
const SEED_AUDIT: Record<string, AuditEvent[]> = {
  "RO-BARRA-183": [
    { id: "b3", tipo: "QR_GENERADO", titulo: "QR generado para la OR", timestamp: "2026-02-16T17:00:00Z", usuario: "Sistema", rol: "Sistema" },
    { id: "b2", tipo: "OR_AGENDADA", titulo: "OR agendada", timestamp: "2026-02-16T16:30:00Z", usuario: "Seller Extra Life", rol: "Seller", detalle: "Slot: 20/02/2026 16:30 · Sucursal: Quilicura · 2.550 uds. · 5 SKUs", estadoAnterior: "Creado", estadoPosterior: "Programado" },
    { id: "b1", tipo: "OR_CREADA", titulo: "OR creada", timestamp: "2026-02-16T14:00:00Z", usuario: "Seller Extra Life", rol: "Seller", detalle: "2.550 uds. teóricas · 5 SKUs", estadoPosterior: "Creado" },
  ],
  // Pendiente de aprobación — RO-BARRA-187 (Le Vice)
  "RO-BARRA-187": [
    { id: "a7", tipo: "INCIDENCIA_REGISTRADA", titulo: "3 incidencias registradas", timestamp: "2026-02-14T14:40:00Z", usuario: "Fernando Roblero", rol: "Operador", detalle: "Daño parcial (45 uds), Sin código barra (30 uds), Sin fecha vencimiento (12 uds)" },
    { id: "a6", tipo: "SESION_FINALIZADA", titulo: "Sesión de conteo finalizada", timestamp: "2026-02-14T14:45:00Z", usuario: "Fernando Roblero", rol: "Operador", detalle: "SES-001 · 2.550 uds. contadas", estadoAnterior: "En proceso de conteo", estadoPosterior: "Pendiente de aprobación" },
    { id: "a5", tipo: "SESION_INICIADA", titulo: "Sesión de conteo iniciada", timestamp: "2026-02-14T13:10:00Z", usuario: "Fernando Roblero", rol: "Operador", detalle: "SES-001", estadoAnterior: "Recepcionado en bodega", estadoPosterior: "En proceso de conteo" },
    { id: "a4", tipo: "QR_ESCANEADO", titulo: "QR escaneado en andén", timestamp: "2026-02-14T13:05:00Z", usuario: "Fernando Roblero", rol: "Operador" },
    { id: "a3", tipo: "OR_RECEPCIONADA", titulo: "OR recepcionada en bodega", timestamp: "2026-02-14T13:02:00Z", usuario: "Fernando Roblero", rol: "Operador", estadoAnterior: "Programado", estadoPosterior: "Recepcionado en bodega" },
    { id: "a2", tipo: "OR_AGENDADA", titulo: "OR agendada", timestamp: "2026-02-12T10:00:00Z", usuario: "Le Vice", rol: "Seller", detalle: "Slot: 14/02/2026 13:00 · Sucursal: La Reina · 2.550 uds. · 3 SKUs", estadoAnterior: "Creado", estadoPosterior: "Programado" },
    { id: "a1", tipo: "OR_CREADA", titulo: "OR creada", timestamp: "2026-02-12T09:30:00Z", usuario: "Le Vice", rol: "Seller", detalle: "2.550 uds. teóricas · 3 SKUs", estadoPosterior: "Creado" },
  ],
  // Pendiente de aprobación — RO-BARRA-199 (NutriPro)
  "RO-BARRA-199": [
    { id: "c5", tipo: "INCIDENCIA_REGISTRADA", titulo: "2 incidencias registradas", timestamp: "2026-03-06T11:15:00Z", usuario: "Catalina Mora", rol: "Operador", detalle: "Daño total (20 uds), Código incorrecto (15 uds)" },
    { id: "c4", tipo: "SESION_FINALIZADA", titulo: "Sesión de conteo finalizada", timestamp: "2026-03-06T11:20:00Z", usuario: "Catalina Mora", rol: "Operador", detalle: "SES-001 · 780 uds. contadas", estadoAnterior: "En proceso de conteo", estadoPosterior: "Pendiente de aprobación" },
    { id: "c3", tipo: "SESION_INICIADA", titulo: "Sesión de conteo iniciada", timestamp: "2026-03-06T10:15:00Z", usuario: "Catalina Mora", rol: "Operador", estadoAnterior: "Recepcionado en bodega", estadoPosterior: "En proceso de conteo" },
    { id: "c2", tipo: "OR_AGENDADA", titulo: "OR agendada", timestamp: "2026-03-04T14:00:00Z", usuario: "NutriPro", rol: "Seller", detalle: "Slot: 06/03/2026 10:00 · Sucursal: Las Condes", estadoAnterior: "Creado", estadoPosterior: "Programado" },
    { id: "c1", tipo: "OR_CREADA", titulo: "OR creada", timestamp: "2026-03-04T13:45:00Z", usuario: "NutriPro", rol: "Seller", detalle: "780 uds. teóricas · 2 SKUs", estadoPosterior: "Creado" },
  ],
  // En proceso de conteo — RO-BARRA-198 (VitaFit)
  "RO-BARRA-198": [
    { id: "d3", tipo: "SESION_INICIADA", titulo: "Sesión de conteo iniciada", timestamp: "2026-03-07T08:40:00Z", usuario: "Fernando Roblero", rol: "Operador", estadoAnterior: "Recepcionado en bodega", estadoPosterior: "En proceso de conteo" },
    { id: "d2", tipo: "OR_AGENDADA", titulo: "OR agendada", timestamp: "2026-03-05T09:00:00Z", usuario: "VitaFit", rol: "Seller", detalle: "Slot: 07/03/2026 08:30 · Sucursal: Santiago Centro", estadoAnterior: "Creado", estadoPosterior: "Programado" },
    { id: "d1", tipo: "OR_CREADA", titulo: "OR creada", timestamp: "2026-03-05T08:30:00Z", usuario: "VitaFit", rol: "Seller", detalle: "1.120 uds. teóricas · 2 SKUs", estadoPosterior: "Creado" },
  ],
  // Completada — RO-BARRA-223 (Extra Life)
  "RO-BARRA-223": [
    { id: "e4", tipo: "OR_CERRADA", titulo: "OR completada", timestamp: "2026-02-25T17:25:00Z", usuario: "Fernando Roblero", rol: "Supervisor", detalle: "1.360 uds. recibidas de 1.360 esperadas · Sin incidencias", estadoAnterior: "En proceso de conteo", estadoPosterior: "Completada" },
    { id: "e3", tipo: "SESION_FINALIZADA", titulo: "Sesión de conteo finalizada", timestamp: "2026-02-25T17:20:00Z", usuario: "Fernando Roblero", rol: "Operador", detalle: "SES-001 · 1.360 uds. contadas" },
    { id: "e2", tipo: "OR_AGENDADA", titulo: "OR agendada", timestamp: "2026-02-23T10:00:00Z", usuario: "Extra Life", rol: "Seller", detalle: "Slot: 25/02/2026 16:00 · Sucursal: Las Condes", estadoAnterior: "Creado", estadoPosterior: "Programado" },
    { id: "e1", tipo: "OR_CREADA", titulo: "OR creada", timestamp: "2026-02-23T09:30:00Z", usuario: "Extra Life", rol: "Seller", detalle: "1.360 uds. teóricas · 2 SKUs", estadoPosterior: "Creado" },
  ],
};

function getAuditIcon(tipo: string) {
  switch (tipo) {
    case "OR_CREADA": return "bg-neutral-100 text-neutral-600";
    case "OR_AGENDADA": case "OR_REAGENDADA": return "bg-sky-100 text-sky-600";
    case "OR_RECEPCIONADA": return "bg-indigo-100 text-indigo-600";
    case "SESION_INICIADA": return "bg-primary-100 text-primary-600";
    case "SESION_FINALIZADA": return "bg-green-100 text-green-600";
    case "INCIDENCIA_REGISTRADA": return "bg-amber-100 text-amber-600";
    case "OR_CERRADA": case "OR_APROBADA": case "OR_AUTO_APROBADA": return "bg-green-100 text-green-700";
    case "OR_CANCELADA": return "bg-red-100 text-red-600";
    case "QR_GENERADO": case "QR_ESCANEADO": return "bg-violet-100 text-violet-600";
    case "CUARENTENA_INGRESO": case "CUARENTENA_EN_GESTION": case "CUARENTENA_SALIDA": return "bg-orange-100 text-orange-600";
    default: return "bg-neutral-100 text-neutral-500";
  }
}

function getAuditIconElement(tipo: string) {
  switch (tipo) {
    case "OR_CREADA": return <IconCirclePlus className="w-3.5 h-3.5" />;
    case "OR_AGENDADA": case "OR_REAGENDADA": return <IconCalendarEvent className="w-3.5 h-3.5" />;
    case "OR_RECEPCIONADA": return <IconPackage className="w-3.5 h-3.5" />;
    case "SESION_INICIADA": return <IconPlayerPlay className="w-3.5 h-3.5" />;
    case "SESION_FINALIZADA": return <IconCircleCheck className="w-3.5 h-3.5" />;
    case "INCIDENCIA_REGISTRADA": return <IconAlertTriangle className="w-3.5 h-3.5" />;
    case "OR_CERRADA": case "OR_APROBADA": return <IconShield className="w-3.5 h-3.5" />;
    case "OR_CANCELADA": return <IconX className="w-3.5 h-3.5" />;
    case "QR_GENERADO": case "QR_ESCANEADO": return <IconScan className="w-3.5 h-3.5" />;
    default: return <IconClock className="w-3.5 h-3.5" />;
  }
}

// ─── Incidencia tags ──────────────────────────────────────────────────────────
const INCIDENCIA_TAGS: {
  key: IncidenciaTagKey;
  label: string;
  color: "amber" | "red" | "orange" | "purple";
  resuelve: string;
  tooltip: string;
}[] = [
  { key: "sin-codigo-barra",  label: "Sin código de barra",        color: "amber",  resuelve: "Amplifica — re-etiquetado", tooltip: "El producto no tiene código de barra impreso. Resolución: re-etiquetado por Amplifica." },
  { key: "codigo-incorrecto", label: "Código de barra incorrecto", color: "amber",  resuelve: "Amplifica — re-etiquetado", tooltip: "El código de barra no coincide con el registrado. Resolución: re-etiquetado por Amplifica." },
  { key: "codigo-ilegible",   label: "Código de barra ilegible",   color: "amber",  resuelve: "Amplifica — re-etiquetado", tooltip: "El código de barra está dañado o no se puede escanear. Resolución: re-etiquetado por Amplifica." },
  { key: "sin-nutricional",   label: "Sin etiqueta nutricional",   color: "red",    resuelve: "Seller — devolución obligatoria", tooltip: "El producto no tiene tabla nutricional. Resolución: devolución obligatoria al seller." },
  { key: "sin-vencimiento",   label: "Sin fecha de vencimiento",   color: "red",    resuelve: "Seller — devolución obligatoria", tooltip: "El producto no tiene fecha de vencimiento visible. Resolución: devolución obligatoria al seller." },
  { key: "danio-parcial",     label: "Daño parcial",               color: "orange", resuelve: "Seller decide (KAM consulta)", tooltip: "Parte del producto presenta daño. Resolución: el seller decide vía KAM." },
  { key: "danio-total",       label: "Daño total",                 color: "red",    resuelve: "Seller decide (KAM consulta)", tooltip: "El producto está completamente dañado. Resolución: el seller decide vía KAM." },
  { key: "no-en-sistema",     label: "No creado en sistema",       color: "purple", resuelve: "Amplifica — creación de SKU", tooltip: "El producto no existe en el sistema. Resolución: Amplifica crea el SKU." },
];

/** Tag color by resolution category: blue=interna, red=devolución, amber=decisión seller */
function tagColorCls(tag: IncidenciaTagKey) {
  if (tag === "sin-codigo-barra" || tag === "codigo-incorrecto" || tag === "codigo-ilegible" || tag === "no-en-sistema")
    return "bg-primary-50 text-primary-700 border-primary-200";   // resolución interna
  if (tag === "sin-nutricional" || tag === "sin-vencimiento")
    return "bg-red-50 text-red-700 border-red-200";               // devolución obligatoria
  return "bg-amber-50 text-amber-700 border-amber-200";           // decisión del seller
}

// ─── Categorizar button (per-SKU, opens IncidenciasSKUModal) ─────────────────
function CategorizarBtn({ incidencias, onOpen, disabled }: {
  incidencias: IncidenciaRow[];
  onOpen: () => void;
  disabled?: boolean;
}) {
  const count = incidencias.length;
  return (
    <Button
      variant="secondary"
      size="md"
      className="w-full sm:w-auto"
      onClick={disabled ? undefined : onOpen}
      disabled={disabled}
      title={disabled ? "Inicia una sesión de conteo para registrar incidencias" : undefined}
      iconLeft={!count ? <IconPlus className="w-4 h-4" /> : undefined}
      iconRight={
        count > 0 && !disabled ? (
          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold leading-none">{count}</span>
        ) : undefined
      }
    >
      {count > 0 ? `Reportar incidencia${count > 1 ? "s" : ""}` : "Reportar incidencia"}
    </Button>
  );
}

// ─── Confirm Remove Modal ─────────────────────────────────────────────────────
function ConfirmRemoveModal({ nombre, onCancel, onConfirm }: {
  nombre: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <AlertModal
      open
      onClose={onCancel}
      icon={IconTrash}
      variant="danger"
      title="Eliminar producto"
      subtitle="Esta acción no puede deshacerse"
      confirm={{ label: "Sí, eliminar", onClick: onConfirm }}
    >
      <p>
        ¿Confirmas que deseas eliminar{" "}
        <span className="font-bold text-neutral-900">{nombre}</span>{" "}
        de esta orden?
      </p>
    </AlertModal>
  );
}

// ─── Confirm Close Modal ──────────────────────────────────────────────────────
type OrOutcome = "Completada" | "Pendiente de aprobación";

function ConfirmCloseModal({ id, sesiones, totalContadas, totalEsperadas, hasIncidencias, onCancel, onConfirm }: {
  id: string; sesiones: Sesion[]; totalContadas: number; totalEsperadas: number; hasIncidencias: boolean;
  onCancel: () => void; onConfirm: (outcome: OrOutcome) => void;
}) {
  const outcome: OrOutcome = hasIncidencias ? "Pendiente de aprobación" : "Completada";

  return (
    <AlertModal
      open
      onClose={onCancel}
      icon={IconClipboardCheck}
      variant={hasIncidencias ? "warning" : "primary"}
      title={hasIncidencias ? "Enviar a aprobación" : "Completar OR"}
      subtitle="Esta acción es definitiva y no puede deshacerse"
      confirm={{ label: hasIncidencias ? "Sí, enviar a aprobación" : "Sí, completar", icon: <IconCheck className="w-4 h-4" />, onClick: () => onConfirm(outcome) }}
    >
      <p>
        ¿Confirmas {hasIncidencias ? "enviar a aprobación" : "completar"} la orden{" "}
        <span className="font-bold text-neutral-900">{id}</span>?{" "}
        Se registrarán{" "}
        <span className="font-bold text-neutral-900">
          {totalContadas.toLocaleString("es-CL")} Unidades
        </span>{" "}
        en{" "}
        <span className="font-bold text-neutral-900">
          {sesiones.length} Sesión{sesiones.length !== 1 ? "es" : ""}
        </span>
      </p>
      {hasIncidencias && (
        <p className="mt-2 text-amber-700 text-sm">
          Se detectaron incidencias. La OR quedará pendiente de revisión y aprobación por el Super Admin, KAM o Seller antes de cerrarse definitivamente.
        </p>
      )}
    </AlertModal>
  );
}

// ─── ProductCard (memoized — only re-renders when its own props change) ───────
type ProductCardProps = {
  product: ProductConteo;
  acumulado: number;
  sesionActiva: boolean;
  onChange: (id: string, val: number) => void;
  onRemove: (id: string) => void;
  incidencias: IncidenciaRow[];
  onCategorizar: () => void;
  isJustScanned?: boolean;
};
/** Placeholder visual cuando no hay imagen del producto */
function NoImagePlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-300">
      <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Box / package icon */}
        <rect x="8" y="16" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 22h32" stroke="currentColor" strokeWidth="2" />
        <path d="M20 16v-4a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 22v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
      <span className="text-[8px] sm:text-[9px] font-medium mt-1 uppercase tracking-wider">Sin imagen</span>
    </div>
  );
}

const ProductCard = memo(function ProductCard({ product, acumulado, sesionActiva, onChange, onRemove, incidencias, onCategorizar, isJustScanned }: ProductCardProps) {
  const incidenciasTotal = incidencias.reduce((s, r) => s + r.cantidad, 0);
  const total  = acumulado + product.contadasSesion + incidenciasTotal;
  const status = getProductStatus(total, product.esperadas);
  const pct    = product.esperadas > 0 ? Math.min(100, (total / product.esperadas) * 100) : 0;

  const barColor =
    status === "completo"   ? "bg-green-500" :
    status === "diferencia" ? "bg-amber-400" :
    status === "exceso"     ? "bg-red-400"   : "bg-neutral-200";

  // Display: editing active session counts; or accumulated total when idle
  const displayVal = sesionActiva ? product.contadasSesion : total;

  // ── Image lightbox + broken image fallback ──
  const [showLightbox, setShowLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasValidImage = !!product.imagen && !imgError;

  // ── Manual count justification modal ──
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const [manualJustificacion, setManualJustificacion] = useState("");
  const [manualFoto, setManualFoto] = useState<File | null>(null);
  const [manualFotoPreview, setManualFotoPreview] = useState<string | null>(null);
  const manualFileRef = useRef<HTMLInputElement>(null);

  const openManualModal = () => {
    if (!sesionActiva) return;
    setManualVal("");
    setManualJustificacion("");
    setManualFoto(null);
    setManualFotoPreview(null);
    setShowManualModal(true);
  };

  const handleManualFoto = (file: File) => {
    setManualFoto(file);
    const url = URL.createObjectURL(file);
    setManualFotoPreview(url);
  };

  const handleManualSubmit = () => {
    const parsed = Math.max(0, Math.min(10000, parseInt(manualVal) || 0));
    onChange(product.id, parsed);
    setShowManualModal(false);
    if (manualFotoPreview) URL.revokeObjectURL(manualFotoPreview);
  };

  const canSubmitManual = manualFoto !== null && manualVal.trim() !== "";

  return (
    <div id={`pcard-${product.id}`} className={`relative m-1 p-3 sm:p-4 rounded-xl transition-all duration-700 ${isJustScanned ? "bg-neutral-50 animate-[scanPulse_0.6s_ease-out]" : ""}`}>
      <div className="flex items-start gap-3 sm:gap-4">

        {/* Image wrapper — overflow-visible so +1 can float out */}
        <div className={`relative flex-shrink-0 w-16 h-16 sm:w-[120px] sm:h-[120px] ${isJustScanned ? "animate-[imgBounceIn_0.5s_ease-out]" : ""}`}>
          {/* Floating +1 animation — plays once on mount, forwards keeps it invisible at end */}
          {isJustScanned && (
            <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[24px] font-bold text-green-500 pointer-events-none animate-[floatPlusOne_0.8s_ease-out_forwards] z-20">
              +1
            </span>
          )}
          <div
            className="w-full h-full bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden cursor-pointer group/img"
            onClick={() => setShowLightbox(true)}
          >
          {hasValidImage
            ? <>
                <img src={product.imagen!} alt={product.nombre} loading="lazy" onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <IconEye className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 drop-shadow" />
                </div>
              </>
            : <NoImagePlaceholder />}
          </div>
        </div>

        {/* Info header */}
        <div className="flex-1 min-w-0">

          {/* Name + trash */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold text-neutral-900 leading-tight">{product.nombre}</p>
            <button
              onClick={() => { if (window.confirm(`¿Eliminar "${product.nombre}" de esta OR?`)) onRemove(product.id); }}
              title="Eliminar producto de esta OR"
              className="p-1.5 text-neutral-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors duration-300 flex-shrink-0"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + barcode */}
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600 truncate">
            <span><span className="font-semibold text-neutral-500">SKU:</span> <span className="font-sans">{product.sku}</span></span>
            <span className="hidden sm:inline text-neutral-200">|</span>
            <span className="hidden sm:inline"><span className="font-semibold text-neutral-500">C. DE BARRA:</span> <span className="font-sans">{product.barcode}</span></span>
          </div>

          {/* Desktop: counter row inline */}
          <div className="hidden sm:flex items-center gap-3 mt-3">
            <button
              onClick={openManualModal}
              disabled={!sesionActiva}
              className={`w-16 border border-neutral-200 rounded-lg text-center text-sm font-semibold py-1.5 tabular-nums transition-colors duration-300
                ${sesionActiva ? "text-neutral-800 bg-white hover:border-primary-300 cursor-pointer" : "text-neutral-600 bg-neutral-50 cursor-default"}`}
            >
              {displayVal}
            </button>

            <span className="flex items-center gap-1.5 text-sm text-neutral-500">
              <IconPackage className="w-4 h-4 text-neutral-600" />
              <span className="tabular-nums font-medium text-neutral-700">
                {total.toLocaleString("es-CL")}/{product.esperadas.toLocaleString("es-CL")}
              </span>
              <span className="text-neutral-600">esperadas</span>
            </span>

            <div className="ml-auto">
              <CategorizarBtn incidencias={incidencias} onOpen={onCategorizar} disabled={!sesionActiva} />
            </div>
          </div>

          {/* Desktop: progress bar */}
          {product.esperadas > 0 && (
            <div className="hidden sm:block mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile-only: counter + progress ── */}
      <div className="sm:hidden mt-3 space-y-3">
        {/* Progress bar + counts */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] text-neutral-500">
              <span className="tabular-nums font-semibold text-neutral-700 font-sans">{total.toLocaleString("es-CL")}</span>/{product.esperadas.toLocaleString("es-CL")} esperadas
            </span>
            {product.esperadas > 0 && (
              <span className="text-[13px] font-medium tabular-nums text-neutral-600 font-sans">{Math.round(pct)}%</span>
            )}
          </div>
          {product.esperadas > 0 && (
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {/* Counter input + Reportar incidencia — row 1/3 + 2/3 */}
        <div className="flex gap-2 items-start">
          <div className="w-1/3 relative">
            <div className={`${!sesionActiva ? "opacity-30 pointer-events-none" : ""}`}>
              <button
                onClick={openManualModal}
                disabled={!sesionActiva}
                className={`w-full h-9 border border-neutral-200 rounded-lg text-center text-sm font-bold tabular-nums font-sans transition-colors duration-300
                  ${sesionActiva ? "text-neutral-800 bg-white hover:border-primary-300 cursor-pointer" : "text-neutral-600 bg-neutral-50 cursor-default"}`}
              >
                {displayVal}
              </button>
            </div>
            {!sesionActiva && (
              <p className="text-center text-[11px] text-neutral-600 mt-1">Inicia sesión para contar</p>
            )}
          </div>
          <div className="w-2/3 [&>button]:h-9">
            <CategorizarBtn incidencias={incidencias} onOpen={onCategorizar} disabled={!sesionActiva} />
          </div>
        </div>
      </div>

      {/* ── Modal: Justificación de conteo manual ── */}
      {/* ── Lightbox de imagen ── */}
      {showLightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" onClick={() => setShowLightbox(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-md w-full animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              <IconX className="w-4 h-4" />
            </button>
            {hasValidImage ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="w-full rounded-2xl shadow-2xl object-contain max-h-[70vh] bg-white"
              />
            ) : (
              <div className="w-full aspect-square max-h-[70vh] rounded-2xl shadow-2xl bg-white flex items-center justify-center">
                <NoImagePlaceholder />
              </div>
            )}
            <p className="text-center text-sm text-white/80 mt-3 line-clamp-2">{product.nombre}</p>
          </div>
        </div>
      )}

      {/* ── Modal: Justificación de conteo manual ── */}
      {showManualModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowManualModal(false)}>
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-neutral-900">Conteo manual</h1>
              <button onClick={() => setShowManualModal(false)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
                <IconX className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            {/* Product ref */}
            <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2 leading-snug">
              <span className="font-semibold text-neutral-700">{product.nombre}</span>
              <br />
              SKU: {product.sku}
            </p>

            {/* Cantidad */}
            <FormField
              label="Cantidad *"
              type="number"
              value={manualVal}
              onChange={v => {
                const n = parseInt(v);
                if (v === "" || v === "-") { setManualVal(""); return; }
                if (isNaN(n) || n < 0) { setManualVal("0"); return; }
                if (n > 10000) { setManualVal("10000"); return; }
                setManualVal(String(n));
              }}
              placeholder="Ingresa la cantidad"
              helperText="Mín. 0, máx. 10.000 unidades"
            />

            {/* Foto obligatoria */}
            <div>
              <p className="text-[11px] font-semibold text-neutral-600 mb-1.5 pl-0.5">Foto de evidencia *</p>
              <input
                ref={manualFileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={e => e.target.files?.[0] && handleManualFoto(e.target.files[0])}
              />
              {manualFotoPreview ? (
                <div className="relative">
                  <img src={manualFotoPreview} alt="Evidencia" className="w-full h-36 object-cover rounded-lg border border-neutral-200" />
                  <button
                    onClick={() => { setManualFoto(null); if (manualFotoPreview) URL.revokeObjectURL(manualFotoPreview); setManualFotoPreview(null); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-neutral-500 hover:text-red-500 shadow-sm"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => manualFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-neutral-200 rounded-lg py-6 flex flex-col items-center gap-1.5 text-neutral-600 hover:border-primary-300 hover:text-primary-500 transition-colors"
                >
                  <IconCamera className="w-6 h-6" />
                  <span className="text-xs font-medium">Tomar o subir foto</span>
                </button>
              )}
            </div>

            {/* Justificación */}
            <FormField
              as="textarea"
              label="Justificación *"
              value={manualJustificacion}
              onChange={setManualJustificacion}
              placeholder="Argumenta la decisión del conteo manual..."
              rows={3}
            />

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setShowManualModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!canSubmitManual}
                onClick={handleManualSubmit}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Session history row ──────────────────────────────────────────────────────
function SesionRow({ sesion, incidencias, products, acumulado }: {
  sesion: Sesion;
  incidencias: Record<string, IncidenciaRow[]>;
  products: ProductConteo[];
  acumulado: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  // Total uds = session counted + incidencias for this session's SKUs
  const totalUds = sesion.items.reduce((s, i) => {
    const incTotal = (incidencias[i.pid] ?? []).reduce((rs, r) => rs + r.cantidad, 0);
    return s + i.cantidad + incTotal;
  }, 0);

  return (
    <div className="border-b border-neutral-100 last:border-0">
      {/* Mobile session header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 hover:bg-neutral-50 transition-colors duration-300 text-left sm:hidden">
        {/* Line 1: SES-ID · Operador | 130 uds ▾ */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-bold text-primary-500 flex-shrink-0">{sesion.id}</span>
            <IconUser className="w-3 h-3 text-neutral-600 flex-shrink-0" />
            <span className="text-[13px] text-neutral-600 truncate">{sesion.operador}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[13px] font-bold text-neutral-800 tabular-nums">{totalUds.toLocaleString("es-CL")} uds.</span>
            {open ? <IconChevronUp className="w-4 h-4 text-neutral-600" />
                   : <IconChevronDown className="w-4 h-4 text-neutral-600" />}
          </div>
        </div>
        {/* Line 2: 🕐 inicio → fin · N SKUs */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-600">
          <div className="flex items-center gap-1.5">
            <IconClock className="w-3 h-3 flex-shrink-0" />
            <span className="tabular-nums">{fmtDT(sesion.inicio)} → {fmtDT(sesion.fin)}</span>
          </div>
          <span className="tabular-nums flex-shrink-0">{sesion.items.length} SKU{sesion.items.length !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {/* Desktop session header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full hidden sm:flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors duration-300 text-left">
        <span className="text-sm font-bold text-primary-500 w-20 flex-shrink-0">{sesion.id}</span>
        <span className="flex items-center gap-1.5 text-sm text-neutral-600 flex-shrink-0">
          <IconUser className="w-3.5 h-3.5 text-neutral-600" />
          {sesion.operador}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-neutral-600 flex-1 min-w-0 truncate">
          <IconClock className="w-3.5 h-3.5 flex-shrink-0" />
          {fmtDT(sesion.inicio)}
          <span className="text-neutral-300 mx-0.5">→</span>
          {fmtDT(sesion.fin)}
        </span>
        <span className="text-sm text-neutral-500 flex-shrink-0">
          {sesion.items.length} SKU{sesion.items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-neutral-800 tabular-nums w-20 text-right flex-shrink-0 whitespace-nowrap">
          {totalUds.toLocaleString("es-CL")} uds
        </span>
        {open ? <IconChevronUp className="w-4 h-4 text-neutral-600 flex-shrink-0" />
               : <IconChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />}
      </button>

      {open && sesion.items.length > 0 && (
        <div className="px-4 pb-3 bg-neutral-50/50">
          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-neutral-100">
            {sesion.items.map(item => {
              const rows      = incidencias[item.pid] ?? [];
              const incTotal  = rows.reduce((s, r) => s + r.cantidad, 0);
              const esperadas = products.find(p => p.id === item.pid)?.esperadas ?? 0;
              const overallTotal = (acumulado[item.pid] ?? 0) + incTotal;
              const status = getProductStatus(overallTotal, esperadas);
              return (
                <div key={item.pid} className="py-3">
                  {/* Row 1: SKU + badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-neutral-800 leading-snug">{item.nombre}</p>
                      <p className="font-mono text-[11px] text-neutral-600 mt-0.5">{item.sku}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap flex-shrink-0 ${
                      status === "completo"   ? "bg-green-50  text-green-700  border-green-200"  :
                      status === "diferencia" ? "bg-amber-50  text-amber-700  border-amber-200"  :
                      status === "exceso"     ? "bg-red-50    text-red-600    border-red-200"    :
                                                "bg-neutral-100  text-neutral-500   border-neutral-200"
                    }`}>
                      {status === "completo" ? "Completo" : status === "diferencia" ? "Diferencias" : status === "exceso" ? "Exceso" : "Pendiente"}
                    </span>
                  </div>
                  {/* Row 2: Numbers */}
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-neutral-500">Contadas: <span className="font-bold text-neutral-800 tabular-nums">{(item.cantidad + incTotal).toLocaleString("es-CL")}</span></span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-500 tabular-nums">{overallTotal}/{esperadas}</span>
                  </div>
                  {/* Row 3: Incidencias */}
                  {rows.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rows.map(r => {
                        const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                        if (!tag) return null;
                        return (
                          <span key={r.rowId} title={tag.tooltip} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-xs sm:text-[10px] font-medium leading-none border cursor-help ${tagColorCls(r.tag as IncidenciaTagKey)}`}>
                            {tag.label}
                            <span className="opacity-60 font-normal">· {r.cantidad}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: full table */}
          <div className="hidden sm:block overflow-x-auto table-scroll">
            <table className="text-sm border-collapse font-sans" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500 text-left">Producto</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500 text-left">Incidencias</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500 text-left">Estado</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500 text-right">Contadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {sesion.items.map(item => {
                  const rows      = incidencias[item.pid] ?? [];
                  const incTotal  = rows.reduce((s, r) => s + r.cantidad, 0);
                  const esperadas = products.find(p => p.id === item.pid)?.esperadas ?? 0;
                  const overallTotal = (acumulado[item.pid] ?? 0) + incTotal;
                  const status = getProductStatus(overallTotal, esperadas);
                  return (
                    <tr key={item.pid} className="hover:bg-neutral-50/60 transition-colors duration-300">
                      <td className="py-3 px-4 align-top max-w-[240px]">
                        <p className="text-[13px] text-neutral-800 leading-snug font-medium">{item.nombre}</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5 font-mono">{item.sku}</p>
                      </td>
                      <td className="py-3 px-4 align-top">
                        {rows.length === 0 ? (
                          <span className="text-[13px] text-neutral-300">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {rows.map(r => {
                              const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                              if (!tag) return null;
                              return (
                                <span key={r.rowId} title={tag.tooltip} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[12px] font-medium leading-none border cursor-help ${tagColorCls(r.tag as IncidenciaTagKey)}`}>
                                  {tag.label}
                                  <span className="opacity-60 font-normal">· {r.cantidad} uds.</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium border whitespace-nowrap ${
                          status === "completo"   ? "bg-green-50  text-green-700  border-green-200"  :
                          status === "diferencia" ? "bg-amber-50  text-amber-700  border-amber-200"  :
                          status === "exceso"     ? "bg-red-50    text-red-600    border-red-200"    :
                                                    "bg-neutral-100  text-neutral-500   border-neutral-200"
                        }`}>
                          {status === "completo"   ? "Completo"          :
                           status === "diferencia" ? "Con diferencias"   :
                           status === "exceso"     ? "Exceso"            : "Pendiente"}
                          <span className="ml-1 font-normal opacity-70 tabular-nums">
                            {overallTotal}/{esperadas}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[13px] font-semibold text-neutral-800 tabular-nums align-top">
                        {(item.cantidad + incTotal).toLocaleString("es-CL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IncidenciaRowCard ────────────────────────────────────────────────────────
function IncidenciaRowCard({ row, index, product, onUpdate, onRemove, onAddImages, onRemoveImage, defaultCollapsed = false }: {
  row: IncidenciaRow;
  index: number;
  product: ProductConteo;
  onUpdate: (rowId: string, update: Partial<IncidenciaRow>) => void;
  onRemove: (rowId: string) => void;
  onAddImages: (rowId: string, files: FileList) => void;
  onRemoveImage: (rowId: string, idx: number) => void;
  defaultCollapsed?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const tag = INCIDENCIA_TAGS.find(t => t.key === row.tag);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const summary = tag ? tag.label : "Sin tipo";

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/50">
      {/* Row header — clickable to collapse */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCollapsed(c => !c)}
        onKeyDown={e => e.key === "Enter" && setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-100/50 transition-colors duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {collapsed ? <IconChevronRight className="w-3.5 h-3.5 text-neutral-600" /> : <IconChevronDown className="w-3.5 h-3.5 text-neutral-600" />}
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Incidencia #{index + 1}</span>
          {collapsed && <span className="text-xs text-neutral-600">· {summary} · {row.cantidad} uds. · {row.imagenes.length} img</span>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(row.rowId); }}
          className="p-1 text-neutral-300 hover:text-red-400 transition-colors duration-300 rounded"
        >
          <IconTrash className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Tag + Cantidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              as="select"
              label="Tipo de incidencia *"
              value={row.tag}
              onChange={v => onUpdate(row.rowId, { tag: v as IncidenciaTagKey | "" })}
            >
              <option value="">Seleccione</option>
              {INCIDENCIA_TAGS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </FormField>
            <FormField
              label="Cantidad afectada *"
              type="number"
              value={String(row.cantidad)}
              onChange={v => onUpdate(row.rowId, { cantidad: Math.max(1, Math.min(10000, parseInt(v) || 1)) })}
              helperText="Mín. 1, máx. 10.000"
            />
          </div>

          {/* Description — only for "no-en-sistema" */}
          {row.tag === "no-en-sistema" && (
            <FormField
              as="textarea"
              label="Descripción del producto *"
              value={row.descripcion}
              onChange={v => onUpdate(row.rowId, { descripcion: v })}
              placeholder="Nombre, código visible, descripción del producto no identificado..."
              rows={2}
            />
          )}

          {/* Image upload */}
          <div>
            <label className="block text-xs text-neutral-600 font-semibold mb-1.5">Imágenes *</label>

            {/* Hidden file inputs */}
            <input
              ref={fileRef} type="file" className="hidden"
              accept="image/jpeg,image/png" multiple
              onChange={e => { e.target.files && onAddImages(row.rowId, e.target.files); e.target.value = ""; }}
            />
            <input
              ref={cameraRef} type="file" className="hidden"
              accept="image/jpeg,image/png" capture="environment"
              onChange={e => { e.target.files && onAddImages(row.rowId, e.target.files); e.target.value = ""; }}
            />

            {/* Image previews */}
            {row.imagenes.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {row.imagenes.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 flex-shrink-0">
                    <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded-lg border border-neutral-200" />
                    <button
                      onClick={() => onRemoveImage(row.rowId, i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                    >
                      <IconX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone — tomar foto como acción principal */}
            {row.imagenes.length < 5 && (
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 px-4 py-6 bg-neutral-50 border border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 hover:bg-neutral-100/60 transition-colors duration-200"
              >
                <span className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-neutral-200 shadow-sm">
                  <IconCamera className="w-5 h-5 text-neutral-600" />
                </span>
                <div className="text-center">
                  <p className="text-sm text-neutral-500">
                    <span className="font-semibold text-primary-500">Tomar foto</span> o capturar evidencia
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    JPG o PNG · 5 MB máx
                  </p>
                </div>
              </button>
            )}

            {/* Subir imagen link */}
            {row.imagenes.length < 5 && (
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  <IconUpload className="w-3.5 h-3.5" />
                  Subir imagen
                </button>
                <p className="text-xs text-neutral-500">
                  {row.imagenes.length}/5 imágenes
                </p>
              </div>
            )}

            {/* Validation message */}
            {row.imagenes.length === 0 && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <IconAlertTriangle className="w-3 h-3" /> Requerida al menos 1 imagen
              </p>
            )}
          </div>

          {/* Nota */}
          <FormField
            as="textarea"
            label="Nota adicional"
            value={row.nota}
            onChange={v => onUpdate(row.rowId, { nota: v })}
            placeholder="Observaciones adicionales..."
            rows={2}
            helperText="Opcional"
          />

          {/* Tag resolution badge */}
          {tag && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium leading-none border ${tagColorCls(row.tag as IncidenciaTagKey)}`}>
              Resuelve: <span className="font-semibold">{tag.resuelve}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── IncidenciasSKUModal — per-SKU incidencias form ───────────────────────────
function IncidenciasSKUModal({ product, initialRows, onClose, onSave, onLiveUpdate }: {
  product: ProductConteo;
  initialRows: IncidenciaRow[];
  onClose: () => void;
  onSave: (rows: IncidenciaRow[]) => void;
  onLiveUpdate?: (rows: IncidenciaRow[]) => void;
}) {
  const [rows, setRows] = useState<IncidenciaRow[]>(initialRows);
  const initialRowIds = useRef(new Set(initialRows.map(r => r.rowId)));

  // Propagate live changes to parent so progress bars update in real-time
  useEffect(() => {
    onLiveUpdate?.(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const addRow = () =>
    setRows(prev => [...prev, {
      rowId: Math.random().toString(36).slice(2),
      skuId: product.id,
      tag: "", cantidad: 1, imagenes: [], nota: "", descripcion: "",
    }]);

  const updateRow = (rowId: string, update: Partial<IncidenciaRow>) =>
    setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, ...update } : r));

  const removeRow = (rowId: string) =>
    setRows(prev => prev.filter(r => r.rowId !== rowId));

  const addImages = (rowId: string, files: FileList) => {
    const row = rows.find(r => r.rowId === rowId);
    if (!row) return;
    const toAdd = Array.from(files)
      .slice(0, 5 - row.imagenes.length)
      .filter(f => (f.type === "image/jpeg" || f.type === "image/png") && f.size <= 5 * 1024 * 1024);
    updateRow(rowId, { imagenes: [...row.imagenes, ...toAdd] });
  };

  const removeImage = (rowId: string, idx: number) => {
    const row = rows.find(r => r.rowId === rowId);
    if (!row) return;
    updateRow(rowId, { imagenes: row.imagenes.filter((_, i) => i !== idx) });
  };

  const saveEnabled = rows.length === 0 || rows.every(r =>
    r.tag !== "" && r.cantidad >= 1 && r.imagenes.length >= 1 &&
    (r.tag !== "no-en-sistema" || r.descripcion.trim() !== "")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-neutral-100 flex-shrink-0">
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {product.imagen
              ? <img src={product.imagen} alt="" className="w-full h-full object-cover rounded-lg" />
              : <IconPhotoOff className="w-5 h-5 text-neutral-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-neutral-900 truncate">{product.nombre}</h1>
            <p className="text-xs text-neutral-600 mt-0.5">SKU: {product.sku} · {product.esperadas} uds. declaradas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300 flex-shrink-0">
            <IconX className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                <IconClipboardCheck className="w-6 h-6 text-neutral-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Sin incidencias registradas</p>
                <p className="text-xs text-neutral-600 mt-0.5">Agrega una incidencia si este SKU presenta algún problema.</p>
              </div>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-colors duration-300 mt-1"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Agregar incidencia
              </button>
            </div>
          ) : (
            <div>
              {rows.map((row, idx) => (
                <IncidenciaRowCard
                  key={row.rowId}
                  row={row} index={idx} product={product}
                  onUpdate={updateRow} onRemove={removeRow}
                  onAddImages={addImages} onRemoveImage={removeImage}
                  defaultCollapsed={initialRowIds.current.has(row.rowId)}
                />
              ))}
              <div className="px-4 py-3 border-t border-dashed border-neutral-200">
                <Button variant={rows.length > 0 ? "secondary" : "primary"} size="md" iconLeft={<IconPlus className="w-3.5 h-3.5" />} onClick={addRow} className="w-full">
                  Agregar otra incidencia
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA (design system pattern) */}
        <div className="border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5 flex-shrink-0 space-y-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => saveEnabled && onSave(rows)}
            disabled={!saveEnabled}
            className="w-full"
            iconLeft={<IconCheck className="w-4 h-4" />}
          >
            Guardar
          </Button>
          <Button variant="tertiary" size="md" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>

      </div>
    </div>
  );
}

// ─── AddProductModal ──────────────────────────────────────────────────────────
const CATEGORIAS = ["Sin diferencias", "Con diferencias", "No pickeable", "Exceso", "No creado en el sistema"];

function AddProductModal({ onCancel, onConfirm, defaultCategoria }: {
  onCancel: () => void;
  onConfirm: (product: ProductConteo) => void;
  defaultCategoria?: string;
}) {
  const [form, setForm] = useState<NewProductForm>({
    nombre: "", sku: "", barcode: "", cantidad: "1",
    imagen: null, comentarios: "", categoria: defaultCategoria ?? "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const canConfirm = form.nombre.trim() !== "" && (parseInt(form.cantidad) || 0) >= 1 && form.imagen !== null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      id: `custom-${Date.now()}`,
      sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      nombre: form.nombre.trim(),
      barcode: form.barcode.trim() || `${Date.now()}`,
      imagen: form.imagen ? URL.createObjectURL(form.imagen) : undefined,
      esperadas: parseInt(form.cantidad) || 1,
      contadasSesion: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-neutral-900">Añadir producto</h1>
          <button onClick={onCancel} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
            <IconX className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Nombre */}
          <FormField
            label="Nombre del producto"
            value={form.nombre}
            onChange={v => setForm(f => ({ ...f, nombre: v }))}
            placeholder="Ej: Tropical Delight 20 Sachets"
          />

          {/* SKU + Código de barras */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="SKU"
              value={form.sku}
              onChange={v => setForm(f => ({ ...f, sku: v }))}
              placeholder="300034"
              helperText="Opcional"
            />
            <FormField
              label="Código de barras"
              value={form.barcode}
              onChange={v => setForm(f => ({ ...f, barcode: v }))}
              placeholder="8500942860946"
              helperText="Opcional"
            />
          </div>

          {/* Cantidad + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              type="number"
              label="Cantidad"
              value={form.cantidad}
              onChange={v => {
                const n = parseInt(v);
                if (v === "") { setForm(f => ({ ...f, cantidad: "" })); return; }
                if (isNaN(n) || n < 0) { setForm(f => ({ ...f, cantidad: "0" })); return; }
                if (n > 10000) { setForm(f => ({ ...f, cantidad: "10000" })); return; }
                setForm(f => ({ ...f, cantidad: String(n) }));
              }}
              helperText="Máx. 10.000"
            />
            <FormField
              as="select"
              label="Categoría"
              value={form.categoria}
              onChange={v => setForm(f => ({ ...f, categoria: v }))}
              helperText="Opcional"
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </FormField>
          </div>

          {/* Foto */}
          <div>
            <p className="text-[11px] font-semibold text-neutral-600 mb-1.5">Foto <span className="text-red-400 font-normal">(obligatoria · JPG o PNG · 5 MB máx)</span></p>
            <input
              ref={fileRef} type="file" className="hidden"
              accept="image/jpeg,image/png" capture="environment"
              onChange={e => e.target.files?.[0] && setForm(f => ({ ...f, imagen: e.target.files![0] }))}
            />
            {form.imagen ? (
              <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl p-3">
                <img src={URL.createObjectURL(form.imagen)} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{form.imagen.name}</p>
                  <p className="text-xs text-neutral-600">{(form.imagen.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, imagen: null }))} className="text-neutral-600 hover:text-red-400 p-1">
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-200 rounded-xl text-sm text-neutral-600 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/40 transition-colors duration-300"
              >
                <IconUpload className="w-4 h-4" />
                Subir o tomar foto
              </button>
            )}
          </div>

          {/* Comentarios */}
          <FormField
            as="textarea"
            label="Comentarios"
            value={form.comentarios}
            onChange={v => setForm(f => ({ ...f, comentarios: v }))}
            placeholder="Observaciones sobre el producto..."
            helperText="Opcional"
          />

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pt-3 pb-8 sm:pb-5 border-t border-neutral-100 flex-shrink-0">
          <Button variant="secondary" size="lg" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" onClick={handleConfirm} disabled={!canConfirm} iconLeft={<IconPlus className="w-4 h-4" />}>
            Añadir producto
          </Button>
        </div>

      </div>
    </div>
  );
}

// ─── AddProductChoiceModal ────────────────────────────────────────────────────
function AddProductChoiceModal({ onRecognized, onUnrecognized, onCancel }: {
  onRecognized: () => void;
  onUnrecognized: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Añadir producto</h1>
          <button onClick={onCancel} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
            <IconX className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Question */}
        <p className="text-sm text-neutral-600">¿Puedes reconocer el producto?</p>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={onRecognized}
            className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/40 transition-colors duration-300 text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors duration-300">
              <IconSearch className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Sí, lo reconozco</p>
              <p className="text-xs text-neutral-600 mt-0.5">Buscar en el catálogo de productos</p>
            </div>
          </button>

          <button
            onClick={onUnrecognized}
            className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/40 transition-colors duration-300 text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors duration-300">
              <IconHelpCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">No, no lo reconozco</p>
              <p className="text-xs text-neutral-600 mt-0.5">Ingresar datos manualmente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GestionCuarentena ───────────────────────────────────────────────────────
function GestionCuarentena({ records, onUpdate, incidencias }: {
  records:  QuarantineRecord[];
  onUpdate: (id: string, patch: Partial<QuarantineRecord>) => void;
  incidencias: Record<string, IncidenciaRow[]>;
}) {
  const [catCModal,    setCatCModal]    = useState<QuarantineRecord | null>(null);
  const [decisionMode, setDecisionMode] = useState<"stock" | "merma" | "mixto">("stock");
  const [stockQty,     setStockQty]     = useState(0);
  const [mermaQty,     setMermaQty]     = useState(0);
  const [decisionNota, setDecisionNota] = useState("");
  const [slideIdx,     setSlideIdx]     = useState(0);

  function openCatC(rec: QuarantineRecord) {
    setCatCModal(rec);
    setDecisionMode("stock");
    setStockQty(rec.cantidad);
    setMermaQty(0);
    setDecisionNota("");
    setSlideIdx(0);
  }

  function confirmCatC() {
    if (!catCModal) return;
    const res: QuarantineResolution =
      decisionMode === "merma" ? "merma" : "stock_disponible";
    onUpdate(catCModal.id, {
      estado:         "resuelto",
      resolucion:     res,
      stockCantidad:  decisionMode === "stock" ? catCModal.cantidad : decisionMode === "mixto" ? stockQty : 0,
      mermaCantidad:  decisionMode === "merma" ? catCModal.cantidad : decisionMode === "mixto" ? mermaQty : 0,
      decisionSeller: decisionNota || undefined,
      resueltoen:     new Date().toISOString(),
    });
    setCatCModal(null);
  }

  function catBadge(cat: QuarantineCategory) {
    if (cat === "interna")           return { label: "Resolución interna Amplifica",   cls: "bg-primary-50 text-primary-600 border-primary-200" };
    if (cat === "devolucion_seller") return { label: "Devolución obligatoria a seller", cls: "bg-red-50 text-red-700 border-red-200" };
    return                                  { label: "Decisión del seller",             cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }

  function estadoBadge(estado: QuarantineStatus) {
    if (estado === "pendiente")  return { label: "Pendiente",  cls: "bg-neutral-100  text-neutral-600  border-neutral-200"  };
    if (estado === "en_gestion") return { label: "En gestión", cls: "bg-blue-50   text-blue-700  border-blue-200"  };
    return                              { label: "Resuelto",   cls: "bg-green-50  text-green-700 border-green-200" };
  }

  function resolucionLabel(r: QuarantineResolution, rec: QuarantineRecord) {
    if (!r) return "—";
    if (r === "stock_disponible") {
      if (rec.stockCantidad && rec.mermaCantidad)
        return `Stock (${rec.stockCantidad}) + Merma (${rec.mermaCantidad})`;
      return "Stock disponible";
    }
    if (r === "merma")    return "Merma";
    return "Devolución";
  }

  const pendientes = records.filter(r => r.estado !== "resuelto").length;

  return (
    <>
      {/* ── Cat C decision modal ── */}
      {catCModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100 flex-shrink-0">
              <h1 className="text-xl font-bold text-neutral-900">Registrar decisión del seller</h1>
              <button onClick={() => setCatCModal(null)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
                <IconX className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
            {/* Two-column grid: gallery left, form right */}
            {(() => {
              const matchingInc = (incidencias[catCModal.skuId] ?? []).find(r => r.tag === catCModal.tag);
              const tagInfo = INCIDENCIA_TAGS.find(t => t.key === catCModal.tag);
              const realImages = matchingInc?.imagenes ?? [];
              // Demo images by incidence tag — retail products with context-specific details
              const demoImagesByTag: Record<string, string[]> = {
                "sin-codigo-barra": [
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                ],
                "codigo-incorrecto": [
                  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                ],
                "codigo-ilegible": [
                  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                ],
                "sin-nutricional": [
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
                ],
                "sin-vencimiento": [
                  "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
                ],
                "danio-parcial": [
                  "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=480&h=360&fit=crop",
                ],
                "danio-total": [
                  "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=480&h=360&fit=crop",
                ],
                "no-en-sistema": [
                  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
                ],
              };
              const fallbackImgs = [
                "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
                "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
              ];
              const imgUrls: string[] = realImages.length > 0
                ? realImages.map(f => URL.createObjectURL(f))
                : (demoImagesByTag[catCModal.tag] ?? fallbackImgs);
              const total = imgUrls.length;
              const safeIdx = Math.min(slideIdx, total - 1);
              const operatorNote = matchingInc?.nota || catCModal.notas || "";

              return (
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* ── Left column: image gallery ── */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-1 min-h-[260px]">
                      <img
                        src={imgUrls[safeIdx]}
                        alt={`Evidencia ${safeIdx + 1}`}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      {total > 1 && (
                        <button
                          onClick={() => setSlideIdx(i => (i - 1 + total) % total)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors"
                        >
                          <IconChevronRight className="w-4 h-4 text-neutral-700 rotate-180" />
                        </button>
                      )}
                      {total > 1 && (
                        <button
                          onClick={() => setSlideIdx(i => (i + 1) % total)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors"
                        >
                          <IconChevronRight className="w-4 h-4 text-neutral-700" />
                        </button>
                      )}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-black/50 rounded-full px-2.5 py-0.5 tabular-nums">
                        {safeIdx + 1}/{total}
                      </span>
                    </div>
                    {/* Thumbnails strip */}
                    {total > 1 && (
                      <div className="flex gap-1.5 justify-center">
                        {imgUrls.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSlideIdx(i)}
                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                              i === safeIdx ? "border-primary-400 ring-1 ring-primary-200" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Right column: info + form ── */}
                  <div className="flex flex-col gap-4">
                    {/* Product info */}
                    <div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {catCModal.productName}
                        <span className="font-sans ml-1 text-neutral-600">· {catCModal.sku}</span>
                        <span className="ml-1 text-neutral-600">· {catCModal.cantidad} uds.</span>
                      </p>
                    </div>

                    {/* Tag badge + operator note */}
                    {tagInfo && (
                      <div className="space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-500">Incidencia:</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            tagInfo.color === "amber"  ? "bg-amber-50  text-amber-700  border-amber-200"  :
                            tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                         "bg-red-50    text-red-700    border-red-200"
                          }`}>{tagInfo.label}</span>
                        </div>
                        {operatorNote && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Comentario del operador</p>
                            <p className="text-sm text-neutral-700 bg-white rounded-md px-3 py-2 border border-neutral-100">
                              {operatorNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Decision options */}
                    <div className="space-y-2">
                      {(["stock", "merma", "mixto"] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            setDecisionMode(mode);
                            if (mode === "stock") { setStockQty(catCModal.cantidad); setMermaQty(0); }
                            if (mode === "merma") { setStockQty(0); setMermaQty(catCModal.cantidad); }
                            if (mode === "mixto") {
                              const half = Math.floor(catCModal.cantidad / 2);
                              setStockQty(half);
                              setMermaQty(catCModal.cantidad - half);
                            }
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors duration-300 ${
                            decisionMode === mode
                              ? "border-primary-300 bg-primary-50 text-primary-600 font-medium"
                              : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          {mode === "stock" ? "Ingresar a stock (tal como está)" :
                           mode === "merma" ? "Mermar (dar de baja)" :
                                             "Dividir lote — parcial stock + parcial merma"}
                        </button>
                      ))}
                    </div>

                    {/* Mixto split inputs */}
                    {decisionMode === "mixto" && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          label="Uds. a stock disponible"
                          type="number"
                          value={String(stockQty)}
                          onChange={v => {
                            const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0));
                            setStockQty(n); setMermaQty(catCModal.cantidad - n);
                          }}
                        />
                        <FormField
                          label="Uds. a mermar"
                          type="number"
                          value={String(mermaQty)}
                          onChange={v => {
                            const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0));
                            setMermaQty(n); setStockQty(catCModal.cantidad - n);
                          }}
                        />
                        <p className={`col-span-2 text-xs font-medium ${
                          stockQty + mermaQty === catCModal.cantidad ? "text-green-600" : "text-red-500"
                        }`}>
                          Total asignado: {(stockQty + mermaQty).toLocaleString("es-CL")} / {catCModal.cantidad.toLocaleString("es-CL")} uds
                        </p>
                      </div>
                    )}

                    {/* Nota seller */}
                    <FormField
                      as="textarea"
                      label="Nota / decisión del seller (opcional)"
                      value={decisionNota}
                      onChange={setDecisionNota}
                      rows={2}
                      placeholder="Ej: Seller acepta daño cosmético, autoriza venta con descuento"
                    />

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-auto">
                      <Button variant="secondary" size="lg" onClick={() => setCatCModal(null)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={confirmCatC}
                        disabled={decisionMode === "mixto" && stockQty + mermaQty !== catCModal.cantidad}
                        className="flex-1"
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-neutral-900">Gestión de cuarentena</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {pendientes} registro{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} de resolución
            </p>
          </div>
          <span className={`whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full border ${
            pendientes === 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {pendientes === 0 ? "Todo resuelto" : `${pendientes} en cuarentena`}
          </span>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden flex flex-col divide-y divide-neutral-100">
          {records.map(rec => {
            const cat     = catBadge(rec.categoria);
            const est     = estadoBadge(rec.estado);
            const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
            return (
              <div key={rec.id} className="px-4 py-3.5">
                {/* Row 1: SKU + Estado */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-sans text-xs text-neutral-500">{rec.sku}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap ${est.cls}`}>
                    {est.label}
                  </span>
                </div>
                {/* Row 2: Product name + tag */}
                <p className="text-sm text-neutral-800 font-medium leading-snug">{rec.productName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {tagInfo && (
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border ${
                      tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                      tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                      tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                   "bg-red-50 text-red-700 border-red-200"
                    }`}>{tagInfo.label}</span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap ${cat.cls}`}>
                    {cat.label}
                  </span>
                </div>
                {/* Row 3: Cantidad + Resolución */}
                <div className="flex items-center gap-4 mt-2.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600">Cant.</span>
                    <span className="text-neutral-800 font-semibold tabular-nums">{rec.cantidad}</span>
                  </div>
                  {rec.resolucion && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-600">Resolución</span>
                      <span className="text-neutral-700 font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                    </div>
                  )}
                </div>
                {rec.decisionSeller && (
                  <p className="text-[10px] text-neutral-600 italic mt-1">&quot;{rec.decisionSeller}&quot;</p>
                )}
                {/* Actions */}
                <div className="mt-3">
                  {rec.estado === "pendiente" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "en_gestion" })}
                      className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300"
                    >
                      Iniciar gestión
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                      className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-300"
                    >
                      Confirmar re-etiquetado
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                    <button
                      onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                      className="w-full text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-300"
                    >
                      Confirmar retiro seller
                    </button>
                  )}
                  {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                    <button
                      onClick={() => openCatC(rec)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300"
                    >
                      Registrar decisión
                    </button>
                  )}
                  {rec.estado === "resuelto" && (
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                      <IconCheck className="w-3 h-3 text-green-500" /> Resuelto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50/60 border-b border-neutral-100">
                {["SKU", "Producto / Tag", "Cant.", "Categoría", "Estado", "Resolución", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[13px] font-semibold text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {records.map(rec => {
                const cat     = catBadge(rec.categoria);
                const est     = estadoBadge(rec.estado);
                const tagInfo = INCIDENCIA_TAGS.find(t => t.key === rec.tag);
                return (
                  <tr key={rec.id} className="hover:bg-neutral-50/40 transition-colors duration-300">
                    <td className="px-4 py-3 font-sans text-xs text-neutral-500 whitespace-nowrap align-top">{rec.sku}</td>
                    <td className="px-4 py-3 align-top max-w-[180px]">
                      <p className="text-xs text-neutral-700 leading-snug">{rec.productName}</p>
                      {tagInfo && (
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1 ${
                          tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200"  :
                          tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200":
                          tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200":
                                                       "bg-red-50 text-red-700 border-red-200"
                        }`}>{tagInfo.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-neutral-800 align-top">{rec.cantidad}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap ${cat.cls}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap ${est.cls}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 align-top">
                      {rec.resolucion
                        ? <span className="font-medium">{resolucionLabel(rec.resolucion, rec)}</span>
                        : <span className="text-neutral-300">—</span>}
                      {rec.decisionSeller && (
                        <p className="text-[10px] text-neutral-600 italic mt-0.5">&quot;{rec.decisionSeller}&quot;</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {rec.estado === "pendiente" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "en_gestion" })}
                          className="text-xs font-semibold px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap"
                        >
                          Iniciar gestión
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "interna" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap"
                        >
                          Confirmar re-etiquetado
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "devolucion_seller" && (
                        <button
                          onClick={() => onUpdate(rec.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-300 whitespace-nowrap"
                        >
                          Confirmar retiro seller
                        </button>
                      )}
                      {rec.estado === "en_gestion" && rec.categoria === "decision_seller" && (
                        <button
                          onClick={() => openCatC(rec)}
                          className="text-xs font-semibold px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-300 whitespace-nowrap"
                        >
                          Registrar decisión
                        </button>
                      )}
                      {rec.estado === "resuelto" && (
                        <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                          <IconCheck className="w-3 h-3 text-green-500" /> Resuelto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── ResumenOR ────────────────────────────────────────────────────────────────
function ResumenOR({ id, baseData, orEstado, sesiones, products, incidencias, acumulado, OPERADOR, canApprove, quarantineRecs, onUpdateQuarantine }: {
  id: string; baseData: OrdenData; orEstado: OrOutcome | null;
  sesiones: Sesion[]; products: ProductConteo[];
  incidencias: Record<string, IncidenciaRow[]>;
  acumulado: Record<string, number>; OPERADOR: string; canApprove: boolean;
  quarantineRecs: QuarantineRecord[];
  onUpdateQuarantine: (qrId: string, patch: Partial<QuarantineRecord>) => void;
}) {
  const [viewMode, setViewMode] = useState<"consolidado" | "por-sesion">("consolidado");
  const [incFilter, setIncFilter] = useState<"all" | "A" | "B" | "C">("all");
  const [lightbox, setLightbox] = useState<File | null>(null);
  const [imageSlider, setImageSlider] = useState<{
    images: { file?: File; url?: string; sku: string; nombre: string; cantidad: number; tag: string; nota: string }[];
    index: number;
  } | null>(null);

  // ── Quarantine (Cat C decision modal) ──
  const [catCModal,    setCatCModal]    = useState<QuarantineRecord | null>(null);
  const [decisionMode, setDecisionMode] = useState<"stock" | "merma" | "mixto">("stock");
  const [stockQty,     setStockQty]     = useState(0);
  const [mermaQty,     setMermaQty]     = useState(0);
  const [decisionNota, setDecisionNota] = useState("");
  const [slideIdx,     setSlideIdx]     = useState(0);

  function openCatC(rec: QuarantineRecord) {
    setCatCModal(rec);
    setDecisionMode("stock");
    setStockQty(rec.cantidad);
    setMermaQty(0);
    setDecisionNota("");
    setSlideIdx(0);
  }
  function confirmCatC() {
    if (!catCModal) return;
    const res: QuarantineResolution =
      decisionMode === "merma" ? "merma" : "stock_disponible";
    onUpdateQuarantine(catCModal.id, {
      estado:         "resuelto",
      resolucion:     res,
      stockCantidad:  decisionMode === "stock" ? catCModal.cantidad : decisionMode === "mixto" ? stockQty : 0,
      mermaCantidad:  decisionMode === "merma" ? catCModal.cantidad : decisionMode === "mixto" ? mermaQty : 0,
      decisionSeller: decisionNota || undefined,
      resueltoen:     new Date().toISOString(),
    });
    setCatCModal(null);
  }
  function qEstadoBadge(estado: QuarantineStatus) {
    if (estado === "pendiente")  return { label: "Pendiente",  cls: "bg-neutral-100 text-neutral-600 border-neutral-200" };
    if (estado === "en_gestion") return { label: "En gestión", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    return                              { label: "Resuelto",   cls: "bg-green-50 text-green-700 border-green-200" };
  }
  function qResolucionLabel(r: QuarantineResolution, rec: QuarantineRecord) {
    if (!r) return "—";
    if (r === "stock_disponible") {
      if (rec.stockCantidad && rec.mermaCantidad)
        return `Stock (${rec.stockCantidad}) + Merma (${rec.mermaCantidad})`;
      return "Stock disponible";
    }
    if (r === "merma") return "Merma";
    return "Devolución";
  }
  function findQR(productId: string, row: IncidenciaRow): QuarantineRecord | undefined {
    return quarantineRecs.find(qr => qr.skuId === productId && qr.tag === row.tag);
  }
  const pendientesQ = quarantineRecs.filter(r => r.estado !== "resuelto").length;
  const hasQuarantine = quarantineRecs.length > 0;

  const skuRows = products.map(p => {
    const acc     = acumulado[p.id] ?? 0;
    const incRows = (incidencias[p.id] ?? []).filter(r => r.tag !== "");
    const incUds  = incRows.reduce((s, r) => s + r.cantidad, 0);
    const received = acc + incUds;
    const diff    = received - p.esperadas;
    const status  = incRows.length > 0 ? "Con incidencia" :
                    diff === 0 ? "Correcto" : diff > 0 ? "Exceso" : "Diferencia";
    return { p, received, diff, status, incRows };
  });

  const flatInc = products.flatMap(p =>
    (incidencias[p.id] ?? []).filter(r => r.tag !== "").map(r => ({ product: p, row: r }))
  );

  const catGroups = [
    {
      cat: "A", color: "primary" as const,
      label: "Resolución interna Amplifica",
      desc: "Re-etiquetado o creación de SKU en bodega",
      rows: flatInc.filter(({ row }) =>
        row.tag === "sin-codigo-barra" || row.tag === "codigo-incorrecto" ||
        row.tag === "codigo-ilegible"  || row.tag === "no-en-sistema"),
    },
    {
      cat: "B", color: "red" as const,
      label: "Devolución obligatoria al seller",
      desc: "El seller retira, corrige y reingresa como nueva OR",
      rows: flatInc.filter(({ row }) => row.tag === "sin-nutricional" || row.tag === "sin-vencimiento"),
    },
    {
      cat: "C", color: "amber" as const,
      label: "Decisión del seller",
      desc: "El KAM consulta al seller la disposición del producto",
      rows: flatInc.filter(({ row }) => row.tag === "danio-parcial" || row.tag === "danio-total"),
    },
  ].filter(g => g.rows.length > 0);

  // Build "Ver" handler for image slider (supports both File objects and seed URLs)
  const openImageSlider = (p: ProductConteo, incRows: IncidenciaRow[]) => {
    const images = incRows.flatMap(r => {
      const base = { sku: p.sku, nombre: p.nombre, cantidad: r.cantidad, tag: INCIDENCIA_TAGS.find(t => t.key === r.tag)?.label ?? r.tag, nota: r.nota };
      const fromFiles = r.imagenes.map(file => ({ ...base, file }));
      const fromUrls  = (r.imageUrls ?? []).map(url => ({ ...base, url }));
      return [...fromFiles, ...fromUrls];
    });
    if (images.length > 0) setImageSlider({ images, index: 0 });
  };

  // Helper: count all images (File + URL) for an incidencia row set
  const countAllImages = (rows: IncidenciaRow[]) =>
    rows.reduce((s, r) => s + r.imagenes.length + (r.imageUrls?.length ?? 0), 0);

  return (
    <>
      {/* ── Cat C decision modal (quarantine) ── */}
      {catCModal && (() => {
        const matchingInc = (incidencias[catCModal.skuId] ?? []).find(r => r.tag === catCModal.tag);
        const tagInfo = INCIDENCIA_TAGS.find(t => t.key === catCModal.tag);
        const realImages = matchingInc?.imagenes ?? [];
        const demoImagesByTag: Record<string, string[]> = {
          "sin-codigo-barra": [
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
          ],
          "codigo-incorrecto": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
          ],
          "codigo-ilegible": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
          ],
          "sin-nutricional": [
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
          ],
          "sin-vencimiento": [
            "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1625740650964-168e296f04cd?w=480&h=360&fit=crop",
          ],
          "danio-parcial": [
            "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=480&h=360&fit=crop",
          ],
          "danio-total": [
            "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=480&h=360&fit=crop",
          ],
          "no-en-sistema": [
            "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
          ],
        };
        const fallbackImgs = [
          "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=360&fit=crop",
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=480&h=360&fit=crop",
          "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=480&h=360&fit=crop",
        ];
        const imgUrls: string[] = realImages.length > 0
          ? realImages.map(f => URL.createObjectURL(f))
          : (demoImagesByTag[catCModal.tag] ?? fallbackImgs);
        const total = imgUrls.length;
        const safeIdx = Math.min(slideIdx, total - 1);
        const operatorNote = matchingInc?.nota || catCModal.notas || "";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left: image gallery */}
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-1 min-h-[260px]">
                    <img src={imgUrls[safeIdx]} alt={`Evidencia ${safeIdx + 1}`} className="w-full h-full object-cover absolute inset-0" />
                    {total > 1 && (
                      <button onClick={() => setSlideIdx(i => (i - 1 + total) % total)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors">
                        <IconChevronRight className="w-4 h-4 text-neutral-700 rotate-180" />
                      </button>
                    )}
                    {total > 1 && (
                      <button onClick={() => setSlideIdx(i => (i + 1) % total)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors">
                        <IconChevronRight className="w-4 h-4 text-neutral-700" />
                      </button>
                    )}
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-black/50 rounded-full px-2.5 py-0.5 tabular-nums">{safeIdx + 1}/{total}</span>
                  </div>
                  {total > 1 && (
                    <div className="flex gap-1.5 justify-center">
                      {imgUrls.map((url, i) => (
                        <button key={i} onClick={() => setSlideIdx(i)} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === safeIdx ? "border-primary-400 ring-1 ring-primary-200" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Right: info + form */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-base font-bold text-neutral-900">Registrar decisión del seller</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {catCModal.productName}
                      <span className="font-sans ml-1 text-neutral-600">· {catCModal.sku}</span>
                      <span className="ml-1 text-neutral-600">· {catCModal.cantidad} uds.</span>
                    </p>
                  </div>
                  {tagInfo && (
                    <div className="space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-500">Incidencia:</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-[6px] border ${
                          tagInfo.color === "amber"  ? "bg-amber-50 text-amber-700 border-amber-200" :
                          tagInfo.color === "orange" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          tagInfo.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                       "bg-red-50 text-red-700 border-red-200"
                        }`}>{tagInfo.label}</span>
                      </div>
                      {operatorNote && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Comentario del operador</p>
                          <p className="text-sm text-neutral-700 bg-white rounded-md px-3 py-2 border border-neutral-100">{operatorNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(["stock", "merma", "mixto"] as const).map(mode => (
                      <button key={mode} onClick={() => {
                        setDecisionMode(mode);
                        if (mode === "stock") { setStockQty(catCModal.cantidad); setMermaQty(0); }
                        if (mode === "merma") { setStockQty(0); setMermaQty(catCModal.cantidad); }
                        if (mode === "mixto") { const half = Math.floor(catCModal.cantidad / 2); setStockQty(half); setMermaQty(catCModal.cantidad - half); }
                      }} className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors duration-300 ${
                        decisionMode === mode ? "border-primary-300 bg-primary-50 text-primary-600 font-medium" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}>
                        {mode === "stock" ? "Ingresar a stock (tal como está)" : mode === "merma" ? "Mermar (dar de baja)" : "Dividir lote — parcial stock + parcial merma"}
                      </button>
                    ))}
                  </div>
                  {decisionMode === "mixto" && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Uds. a stock disponible" type="number" value={String(stockQty)} onChange={v => { const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0)); setStockQty(n); setMermaQty(catCModal.cantidad - n); }} />
                      <FormField label="Uds. a mermar" type="number" value={String(mermaQty)} onChange={v => { const n = Math.max(0, Math.min(catCModal.cantidad, parseInt(v) || 0)); setMermaQty(n); setStockQty(catCModal.cantidad - n); }} />
                      <p className={`col-span-2 text-xs font-medium ${stockQty + mermaQty === catCModal.cantidad ? "text-green-600" : "text-red-500"}`}>
                        Total asignado: {(stockQty + mermaQty).toLocaleString("es-CL")} / {catCModal.cantidad.toLocaleString("es-CL")} uds.
                      </p>
                    </div>
                  )}
                  <FormField as="textarea" label="Nota / decisión del seller (opcional)" value={decisionNota} onChange={setDecisionNota} rows={2} placeholder="Ej: Seller acepta daño cosmético, autoriza venta con descuento" />
                  <div className="flex gap-3 mt-auto">
                    <Button variant="secondary" size="lg" onClick={() => setCatCModal(null)} className="flex-1">Cancelar</Button>
                    <button onClick={confirmCatC} disabled={decisionMode === "mixto" && stockQty + mermaQty !== catCModal.cantidad} className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-100 disabled:text-neutral-600 text-white text-sm font-semibold rounded-lg transition-colors duration-300">Confirmar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image slider modal */}
      {imageSlider && (() => {
        const { images, index } = imageSlider;
        const current = images[index];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={() => setImageSlider(null)}>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-800">
                  Imagen {index + 1} de {images.length}
                </p>
                <button onClick={() => setImageSlider(null)} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                  <IconX className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Image */}
              <div className="relative bg-neutral-900 flex items-center justify-center" style={{ minHeight: 280, maxHeight: 400 }}>
                <img
                  src={current.url ?? (current.file ? URL.createObjectURL(current.file) : "")} alt=""
                  className="max-w-full max-h-[400px] object-contain"
                />
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageSlider({ images, index: (index - 1 + images.length) % images.length })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                      <IconChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImageSlider({ images, index: (index + 1) % images.length })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                      <IconChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{current.nombre}</span>
                  <span className="font-sans text-xs text-neutral-600">{current.sku}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-700 border border-amber-200 font-medium leading-none">
                    {current.tag}
                  </span>
                  <span className="text-xs text-neutral-500">
                    <span className="font-semibold tabular-nums">{current.cantidad.toLocaleString("es-CL")}</span> uds. afectadas
                  </span>
                </div>
                {current.nota && (
                  <div className="bg-neutral-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-0.5">Comentario del operador</p>
                    <p className="text-sm text-neutral-700 italic">"{current.nota}"</p>
                  </div>
                )}
              </div>

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-4">
                  {images.map((_, i) => (
                    <button
                      key={i} onClick={() => setImageSlider({ images, index: i })}
                      className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-primary-500" : "bg-neutral-200 hover:bg-neutral-300"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Legacy lightbox (for incidencia section thumbnails) */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
            onClick={e => { e.stopPropagation(); setLightbox(null); }}
          >
            <IconX className="w-5 h-5" />
          </button>
          <img
            src={URL.createObjectURL(lightbox)} alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden font-sans">

        {/* ── Header ── */}
        <div className="border-b border-neutral-100">
          <div className="px-5 pt-4 pb-3">
            <p className="text-base font-semibold text-neutral-900">Resumen de recepción</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""} · detalle por SKU
            </p>
          </div>
          {sesiones.length > 1 && (
            <div className="px-5 pb-3">
              <div className="flex items-center gap-0.5 bg-neutral-100 rounded-lg p-0.5 w-full">
                {(["consolidado", "por-sesion"] as const).map(m => (
                  <button
                    key={m} onClick={() => setViewMode(m)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors duration-300 ${
                      viewMode === m ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {m === "consolidado" ? "Consolidado" : "Por sesión"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats now shown in dark bar above ResumenOR */}

        {/* ── Consolidated view ── */}
        {viewMode === "consolidado" && (<>
          {/* Mobile: card layout — matches OR card UI */}
          <div className="sm:hidden flex flex-col gap-3 px-4 py-4">
            {skuRows.map(({ p, received, diff, status, incRows }) => {
              const allImgCount = countAllImages(incRows);
              return (
                <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
                  {/* Row 1: SKU + Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 leading-snug">{p.nombre}</p>
                      <p className="font-mono text-[11px] text-neutral-600 mt-0.5">{p.sku}{p.barcode ? ` · ${p.barcode}` : ""}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium leading-none border whitespace-nowrap flex-shrink-0 ${
                      status === "Correcto"       ? "bg-green-50 text-green-700 border-green-200" :
                      status === "Con incidencia" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      status === "Exceso"         ? "bg-blue-50  text-blue-700  border-blue-200"  :
                                                    "bg-red-50   text-red-600   border-red-200"
                    }`}>{status}</span>
                  </div>

                  {/* Row 2: Numbers */}
                  <div className="flex items-center gap-4 text-xs mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-600">Recibida</span>
                      <span className="text-neutral-800 font-bold font-sans tabular-nums">{received.toLocaleString("es-CL")}<span className="text-neutral-300 font-normal">/{p.esperadas.toLocaleString("es-CL")}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-600">Dif.</span>
                      <span className={`font-bold font-sans tabular-nums ${
                        diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"
                      }`}>
                        {diff === 0 ? "0" : diff > 0 ? `+${diff.toLocaleString("es-CL")}` : diff.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Tags (only when present) */}
                  {incRows.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {incRows.map(r => {
                        const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                        if (!tag) return null;
                        return (
                          <span key={r.rowId} title={tag.tooltip} className={`inline-flex px-1.5 py-0.5 rounded-[6px] text-xs font-medium leading-none border cursor-help ${tagColorCls(r.tag as IncidenciaTagKey)}`}>
                            {tag.label}
                          </span>
                        );
                      })}
                      <span className="text-xs font-semibold text-amber-700 tabular-nums ml-1">
                        ({incRows.reduce((s, r) => s + r.cantidad, 0).toLocaleString("es-CL")} uds.)
                      </span>
                    </div>
                  )}

                  {/* Actions footer */}
                  {allImgCount > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                      <button
                        onClick={() => openImageSlider(p, incRows)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                      >
                        <IconEye className="w-4 h-4" />
                        Ver evidencia
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: full table */}
          <div className="hidden sm:block overflow-x-auto table-scroll">
            <table className="text-sm border-collapse font-sans" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Producto", "Recibida", "Diferencia", "Estado", "Tag incidencia", "Uds. c/inc.", "Imágenes"].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-neutral-500 ${
                      ["Recibida","Diferencia","Uds. c/inc."].includes(h) ? "text-right" :
                      h === "Estado" ? "text-center" : "text-left"
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {skuRows.map(({ p, received, diff, status, incRows }) => {
                  const allImgCount = countAllImages(incRows);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors duration-300">
                      <td className="py-3 px-4 align-top max-w-[240px]">
                        <p className="text-[13px] text-neutral-800 leading-snug font-medium">{p.nombre}</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5 font-mono">{p.sku}{p.barcode ? ` · ${p.barcode}` : ""}</p>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums align-top whitespace-nowrap">
                        <span className="text-[13px] font-semibold text-neutral-800">{received.toLocaleString("es-CL")}</span>
                        <span className="text-[11px] text-neutral-600">/{p.esperadas.toLocaleString("es-CL")}</span>
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums text-[13px] font-bold align-top ${
                        diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"
                      }`}>
                        {diff === 0 ? "0" : diff > 0 ? `+${diff.toLocaleString("es-CL")}` : diff.toLocaleString("es-CL")}
                      </td>
                      <td className="py-3 px-4 text-center align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium leading-none border whitespace-nowrap ${
                          status === "Correcto"       ? "bg-green-50 text-green-700 border-green-200" :
                          status === "Con incidencia" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          status === "Exceso"         ? "bg-blue-50  text-blue-700  border-blue-200"  :
                                                        "bg-red-50   text-red-600   border-red-200"
                        }`}>{status}</span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        {incRows.length === 0
                          ? <span className="text-neutral-300 text-[13px]">—</span>
                          : <div className="flex flex-col gap-1">
                              {incRows.map(r => {
                                const tag = INCIDENCIA_TAGS.find(t => t.key === r.tag);
                                if (!tag) return null;
                                return (
                                  <span key={r.rowId} title={tag.tooltip} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[12px] font-medium leading-none border whitespace-nowrap cursor-help ${tagColorCls(r.tag as IncidenciaTagKey)}`}>
                                    {tag.label}
                                    <span className="opacity-60 font-normal">· {r.cantidad} uds.</span>
                                  </span>
                                );
                              })}
                            </div>
                        }
                      </td>
                      <td className="py-3 px-4 text-right align-top tabular-nums">
                        {incRows.length === 0
                          ? <span className="text-neutral-300 text-[13px]">—</span>
                          : <span className="text-[13px] font-semibold text-amber-700">
                              {incRows.reduce((s, r) => s + r.cantidad, 0).toLocaleString("es-CL")}
                            </span>
                        }
                      </td>
                      <td className="py-3 px-4 align-top">
                        {allImgCount === 0
                          ? <span className="text-neutral-300 text-xs">—</span>
                          : <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openImageSlider(p, incRows)}
                              iconLeft={<IconPhoto className="w-3.5 h-3.5" />}
                            >
                              Ver
                            </Button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ── Per-session view ── */}
        {viewMode === "por-sesion" && (
          <div className="divide-y divide-neutral-100">
            {sesiones.map(ses => (
              <div key={ses.id}>
                <div className="px-4 py-2.5 bg-primary-50/60 flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold text-primary-500">{ses.id}</span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <IconUser className="w-3 h-3" />{ses.operador}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <IconClock className="w-3 h-3" />
                    {fmtDT(ses.inicio)} <span className="text-neutral-300">→</span> {fmtDT(ses.fin)}
                  </span>
                  <span className="ml-auto text-xs font-bold text-primary-500 font-sans tabular-nums">
                    {ses.items.reduce((s, i) => s + i.cantidad, 0).toLocaleString("es-CL")} uds.
                  </span>
                </div>
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-600">Contadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {ses.items.map(item => (
                      <tr key={item.pid}>
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] text-neutral-800 leading-snug font-medium">{item.nombre}</p>
                          <p className="text-[11px] text-neutral-600 mt-0.5 font-mono">{item.sku}</p>
                        </td>
                        <td className="px-4 py-2.5 font-sans text-right text-[13px] font-semibold tabular-nums text-neutral-800">{item.cantidad.toLocaleString("es-CL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Incidencias por categoría (card independiente) ── */}
      {flatInc.length > 0 && (() => {
        const catTabs = catGroups.map(g => ({
          ...g,
          dotCls: g.color === "primary" ? "bg-primary-500" : g.color === "red" ? "bg-red-500" : "bg-amber-500",
          textCls: g.color === "primary" ? "text-primary-700" : g.color === "red" ? "text-red-700" : "text-amber-700",
          labelShort: g.color === "primary" ? "Interno" : g.color === "red" ? "Devolución" : "Revisión seller",
        }));

        const visibleGroups = incFilter === "all" ? catTabs : catTabs.filter(g => g.cat === incFilter);

        return (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">

            {/* Section title */}
            <div className="px-5 pt-4 pb-3 flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-neutral-900">Resolución de incidencias</p>
                <p className="text-xs text-neutral-600 mt-0.5">{flatInc.length} incidencia{flatInc.length !== 1 ? "s" : ""} registrada{flatInc.length !== 1 ? "s" : ""}</p>
              </div>
              {hasQuarantine && (
                <span className={`whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-[6px] border leading-none ${
                  pendientesQ === 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {pendientesQ === 0 ? "Todo resuelto" : `${pendientesQ} pendiente${pendientesQ !== 1 ? "s" : ""}`}
                </span>
              )}
            </div>

              {/* Filter: mobile select */}
              <div className="sm:hidden px-5 pb-4">
                <select
                  value={incFilter}
                  onChange={e => setIncFilter(e.target.value as "all" | "A" | "B" | "C")}
                  className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todas ({flatInc.length})</option>
                  {catTabs.map(g => (
                    <option key={g.cat} value={g.cat}>{g.labelShort} ({g.rows.length})</option>
                  ))}
                </select>
              </div>

              {/* Filter: desktop tabs */}
              <div className="hidden sm:flex items-center gap-0.5 mx-5 mb-4 overflow-x-auto p-1 bg-neutral-100 rounded-xl">
                <button
                  onClick={() => setIncFilter("all")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    incFilter === "all"
                      ? "bg-white text-neutral-900 font-medium shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Todas
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${incFilter === "all" ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>{flatInc.length}</span>
                </button>
                {catTabs.map(g => (
                  <button
                    key={g.cat}
                    onClick={() => setIncFilter(g.cat as "A" | "B" | "C")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                      incFilter === g.cat
                        ? "bg-white text-neutral-900 font-medium shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.dotCls}`} />
                    {g.labelShort}
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${incFilter === g.cat ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>{g.rows.length}</span>
                  </button>
                ))}
              </div>

              {/* Category groups */}
              <div className="px-5 pb-5 space-y-6">
                {visibleGroups.map(g => {
                  const resolLabel = g.color === "primary" ? "Resolución interna" : g.color === "red" ? "Devolución al seller" : "Decisión del seller";
                  return (
                    <div key={g.cat}>
                      {/* Category header with left bar */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-1 self-stretch rounded-full ${g.dotCls}`} />
                        <span className="text-sm font-bold text-neutral-800">{resolLabel}</span>
                      </div>

                      {/* Incident cards */}
                      <div className="space-y-3">
                        {g.rows.map(({ product, row }) => {
                          const tag = INCIDENCIA_TAGS.find(t => t.key === row.tag);
                          const allImgs = [...row.imagenes.map(f => ({ file: f })), ...(row.imageUrls ?? []).map(u => ({ url: u }))];
                          const qr = findQR(product.id, row);
                          const qrEstado = qr ? qEstadoBadge(qr.estado) : null;
                          const isResuelto = qr?.estado === "resuelto";

                          return (
                            <div key={row.rowId} className="rounded-xl border border-neutral-200 bg-white">
                              {/* Card header: tag + units + quarantine estado */}
                              <div className="px-4 pt-3.5 pb-3 border-b border-neutral-100 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide">{tag?.label ?? row.tag}</p>
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    <span className="font-semibold tabular-nums">{row.cantidad.toLocaleString("es-CL")}</span> uds. afectadas
                                  </p>
                                </div>
                                {qrEstado && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium border whitespace-nowrap leading-none ${qrEstado.cls}`}>
                                    {isResuelto && <IconCheck className="w-3 h-3 mr-1 flex-shrink-0" />}
                                    {qrEstado.label}
                                  </span>
                                )}
                              </div>

                              {/* Card body: product + comment + resolution info */}
                              <div className="px-4 py-3 space-y-2.5">
                                <div>
                                  <p className="text-sm font-semibold text-neutral-800">{product.nombre}</p>
                                  <p className="text-xs text-neutral-600 mt-0.5 font-sans">SKU: {product.sku}</p>
                                </div>

                                {row.nota && (
                                  <div className="flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                                    <IconMessage className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-neutral-600">{row.nota}</p>
                                  </div>
                                )}
                                {row.tag === "no-en-sistema" && row.descripcion && (
                                  <div className="flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                                    <IconMessage className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-neutral-600">{row.descripcion}</p>
                                  </div>
                                )}
                                {isResuelto && qr.resolucion && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="text-neutral-600">Resolución:</span>
                                    <span className="text-neutral-700 font-medium">{qResolucionLabel(qr.resolucion, qr)}</span>
                                  </div>
                                )}
                                {isResuelto && qr.decisionSeller && (
                                  <div className="flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                                    <IconMessage className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-neutral-600">{qr.decisionSeller}</p>
                                  </div>
                                )}
                              </div>

                              {/* Actions footer — quarantine-aware */}
                              <div className="flex items-center gap-2 px-4 pb-3.5 pt-1">
                                {qr && !isResuelto ? (
                                  // ── Quarantine action buttons ──
                                  qr.estado === "pendiente" ? (
                                    <button
                                      onClick={() => onUpdateQuarantine(qr.id, { estado: "en_gestion" })}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
                                    >
                                      Iniciar gestión
                                    </button>
                                  ) : qr.estado === "en_gestion" && qr.categoria === "interna" ? (
                                    <button
                                      onClick={() => onUpdateQuarantine(qr.id, { estado: "resuelto", resolucion: "stock_disponible", resueltoen: new Date().toISOString() })}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                                    >
                                      Confirmar re-etiquetado
                                    </button>
                                  ) : qr.estado === "en_gestion" && qr.categoria === "devolucion_seller" ? (
                                    <button
                                      onClick={() => onUpdateQuarantine(qr.id, { estado: "resuelto", resolucion: "devolucion", resueltoen: new Date().toISOString() })}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                                    >
                                      Confirmar retiro seller
                                    </button>
                                  ) : qr.estado === "en_gestion" && qr.categoria === "decision_seller" ? (
                                    <button
                                      onClick={() => openCatC(qr)}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
                                    >
                                      Registrar decisión
                                    </button>
                                  ) : <div className="flex-1" />
                                ) : !qr ? (
                                  // ── No quarantine yet (pre-completion) — show info actions ──
                                  (row.tag === "danio-total" || row.tag === "danio-parcial") && allImgs.length === 0 ? (
                                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200">
                                      <IconCamera className="w-4 h-4" /> Adjuntar evidencia
                                    </button>
                                  ) : <div className="flex-1" />
                                ) : (
                                  // ── Resuelto — just spacer ──
                                  <div className="flex-1" />
                                )}
                                <button
                                  onClick={() => openImageSlider(product, [row])}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                                >
                                  <IconEye className="w-4 h-4" />
                                  Ver detalle
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        );
      })()}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConteoORPage() {
  const params   = useParams();
  const router   = useRouter();
  const rawId    = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const id       = decodeURIComponent(rawId);
  const baseData = MOCK_ORDENES[id] ?? getFallbackOrden(id);

  // Original estado: check localStorage override first (synced from list actions), then seed data
  const originalEstado = (() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`amplifica_or_${id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as { estado?: string };
          if (parsed.estado) return parsed.estado;
        }
      } catch { /* ignore */ }
    }
    return baseData.estado ?? ORDENES_SEED.find(o => o.id === id)?.estado ?? "Programado";
  })();

  // ── State ──────────────────────────────────────────────────────────────────
  const [products,      setProducts]      = useState<ProductConteo[]>(baseData.products);
  const [sesiones,      setSesiones]      = useState<Sesion[]>(() => SEED_SESIONES[id] ?? []);
  const [sesionActiva,  setSesionActiva]  = useState(false);
  const [sesionInicio,  setSesionInicio]  = useState("");
  const [scanner,       setScanner]       = useState("");
  const [confirmClose,      setConfirmClose]      = useState(false);
  const [confirmLiberar,    setConfirmLiberar]    = useState(false);
  const [confirmFinalizar,  setConfirmFinalizar]  = useState(false);
  const [noUnitsAlert,   setNoUnitsAlert]   = useState(false);
  const [pendingRemove,  setPendingRemove]  = useState<string | null>(null);
  const [showDotsMenu,   setShowDotsMenu]   = useState(false);
  const [showStickyMenu, setShowStickyMenu] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [showProductTable, setShowProductTable] = useState(false);
  const [orEstado,       setOrEstado]       = useState<OrOutcome | null>(null);
  const [incidencias,      setIncidencias]      = useState<Record<string, IncidenciaRow[]>>({});
  const [incidenciaTarget, setIncidenciaTarget] = useState<string | null>(null);
  // Snapshot of incidencias[target] at the moment the modal opens (to revert on cancel)
  const incidenciaSnapshotRef = useRef<IncidenciaRow[]>([]);
  const [addProductFlow, setAddProductFlow] = useState<"closed" | "choice" | "catalog" | "manual">("closed");
  const [quarantineRecs,   setQuarantineRecs]   = useState<QuarantineRecord[]>([]);
  const [guiaModal,        setGuiaModal]        = useState(false);
  const [approveModal,     setApproveModal]     = useState(false);
  const [qrScannerOpen,    setQrScannerOpen]    = useState(false);
  const [lastScannedId,    setLastScannedId]    = useState<string | null>(null);
  const [scanError,        setScanError]        = useState(false);
  const [scanSuccess,      setScanSuccess]      = useState(false);
  const scanFlashTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanErrorTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Role (initialise with SSR-safe default, sync from localStorage on mount) ──
  const [currentRole, setCurrentRole] = useState<Role>("Super Admin");
  useEffect(() => {
    setCurrentRole(getRole());
    const sync = () => setCurrentRole(getRole());
    window.addEventListener("amplifica-role-change", sync);
    return () => window.removeEventListener("amplifica-role-change", sync);
  }, []);

  const canComplete    = can(currentRole, "or:complete");
  const canStartSesion = can(currentRole, "session:start");
  const canFinSesion   = can(currentRole, "session:finalize");
  const canRelSesion   = can(currentRole, "session:release");
  const canScanPallet  = can(currentRole, "scan:pallet_bulto");

  // Capture snapshot of incidencias for a SKU when the modal opens (to revert on cancel)
  useEffect(() => {
    if (incidenciaTarget !== null) {
      incidenciaSnapshotRef.current = incidencias[incidenciaTarget] ?? [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidenciaTarget]); // intentionally only re-run when target changes, not incidencias

  // Restore closed state from localStorage OR from seed data (completed/pendiente ORs)
  useEffect(() => {
    let isClosed = false;
    try {
      const stored = localStorage.getItem(`amplifica_or_${id}`);
      if (stored) {
        const { estado } = JSON.parse(stored) as { estado: OrOutcome };
        if (estado === "Completada" || estado === "Pendiente de aprobación") {
          setOrEstado(estado);
          isClosed = true;
        }
      }
    } catch { /* ignore */ }
    if (!isClosed) {
      // Fallback: check seed data for ORs that are already completed or pending approval
      const seedEntry = ORDENES_SEED.find(o => o.id === id);
      if (seedEntry) {
        if (seedEntry.estado === "Completada" || seedEntry.estado === "Pendiente de aprobación") {
          setOrEstado(seedEntry.estado as OrOutcome);
          isClosed = true;
        }
      }
    }
    // Always load seed incidencias for closed ORs (regardless of localStorage vs seed)
    if (isClosed && SEED_INCIDENCIAS[id]) {
      const grouped: Record<string, IncidenciaRow[]> = {};
      for (const inc of SEED_INCIDENCIAS[id]) {
        if (!grouped[inc.skuId]) grouped[inc.skuId] = [];
        grouped[inc.skuId].push(inc);
      }
      setIncidencias(grouped);
    }
  }, [id]);

  // Load quarantine records when OR is closed
  useEffect(() => {
    if (!orEstado) return;
    const all = loadAllQuarantine();
    setQuarantineRecs(all.filter(r => r.orId === id));
  }, [orEstado, id]);

  // Update a quarantine record (local state + persist to localStorage)
  const updateQuarantineRecord = (qrId: string, patch: Partial<QuarantineRecord>) => {
    setQuarantineRecs(prev => {
      const next = prev.map(r => r.id === qrId ? { ...r, ...patch } : r);
      // Persist: replace all records for this OR in global quarantine store
      const all     = loadAllQuarantine();
      const others  = all.filter(r => r.orId !== id);
      saveAllQuarantine([...others, ...next]);
      return next;
    });
  };

  // Convert ProductsModal output (AddProduct[]) → ProductConteo[] and merge
  const handleCatalogAdd = (incoming: AddProduct[]) => {
    setProducts(prev => {
      const updated = [...prev];
      incoming.forEach(p => {
        const idx = updated.findIndex(e => e.sku === p.sku);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], esperadas: updated[idx].esperadas + p.qty };
        } else {
          updated.push({
            id: `catalog-${p.sku}-${Date.now()}`,
            sku: p.sku,
            nombre: p.nombre,
            barcode: p.barcode,
            esperadas: p.qty,
            contadasSesion: 0,
          });
        }
      });
      return updated;
    });
    setAddProductFlow("closed");
  };

  const dotsRef = useRef<HTMLDivElement>(null);
  const OPERADOR = "Fernando Roblero";

  // Close dots menu on outside click
  useEffect(() => {
    function oc(e: MouseEvent) {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) setShowDotsMenu(false);
    }
    document.addEventListener("mousedown", oc);
    return () => document.removeEventListener("mousedown", oc);
  }, []);

  // ── Accumulated from closed sessions ─────────────────────────────────────
  const acumulado = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const ses of sesiones)
      for (const item of ses.items)
        map[item.pid] = (map[item.pid] ?? 0) + item.cantidad;
    return map;
  }, [sesiones]);

  const totalPP = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const incTotal = (incidencias[p.id] ?? []).reduce((s, r) => s + r.cantidad, 0);
      map[p.id] = (acumulado[p.id] ?? 0) + p.contadasSesion + incTotal;
    }
    return map;
  }, [products, acumulado, incidencias]);

  // ── Stats (single-pass over products instead of 3x .filter()) ────────────
  const stats = useMemo(() => {
    let totalEsperadas = 0, totalSesionAct = 0, sinDiferencias = 0, conDiferencias = 0, pendientes = 0;
    for (const p of products) {
      totalEsperadas += p.esperadas;
      totalSesionAct += p.contadasSesion;
      const s = getProductStatus(totalPP[p.id] ?? 0, p.esperadas);
      if (s === "completo") sinDiferencias++;
      else if (s === "diferencia" || s === "exceso") conDiferencias++;
      else if (s === "pendiente") pendientes++;
    }
    const totalAcum = Object.values(acumulado).reduce((s, v) => s + v, 0);
    const totalIncidencias = Object.values(incidencias).reduce(
      (s, rows) => s + rows.reduce((rs, r) => rs + r.cantidad, 0), 0
    );
    const totalContadas = totalAcum + totalSesionAct + totalIncidencias;
    const pct = totalEsperadas > 0 ? Math.round((totalContadas / totalEsperadas) * 100) : 0;
    return { totalEsperadas, totalContadas, totalSesionAct, pct, sinDiferencias, conDiferencias, pendientes };
  }, [products, acumulado, totalPP, incidencias]);

  // ── Incidencias breakdown by tag (for progress bar chips) ───────────────
  const incidenciasPorTag = useMemo(() => {
    const map: Partial<Record<IncidenciaTagKey, number>> = {};
    for (const rows of Object.values(incidencias)) {
      for (const row of rows) {
        if (row.tag) map[row.tag] = (map[row.tag] ?? 0) + row.cantidad;
      }
    }
    return map;
  }, [incidencias]);

  // ── Approval helpers ─────────────────────────────────────────────────────
  const approvalData = useMemo(() => {
    const totalEsperadas = products.reduce((s, p) => s + p.esperadas, 0);
    const totalRecibidas = products.reduce((s, p) => {
      const acc = acumulado[p.id] ?? 0;
      const inc = (incidencias[p.id] ?? []).filter(r => r.tag !== "").reduce((rs, r) => rs + r.cantidad, 0);
      return s + acc + inc;
    }, 0);
    const diffNeta = totalRecibidas - totalEsperadas;
    const totalInc = products.reduce((s, p) => (incidencias[p.id] ?? []).filter(r => r.tag !== "").length + s, 0);
    const pendientesQR = quarantineRecs.filter(r => r.estado !== "resuelto").length;
    const allResolved = quarantineRecs.length > 0 && pendientesQR === 0;
    const canApprove = quarantineRecs.length === 0 || allResolved;
    return { totalEsperadas, totalRecibidas, diffNeta, totalInc, pendientesQR, canApprove };
  }, [products, acumulado, incidencias, quarantineRecs]);

  const handleApproveOR = () => {
    setApproveModal(false);
    setOrEstado("Completada");
    try {
      localStorage.setItem(`amplifica_or_${id}`, JSON.stringify({ estado: "Completada" }));
      localStorage.setItem(`amplifica_or_${id}_approved`, "true");
    } catch { /* ignore */ }
  };

  // ── QR Scanner helpers ──────────────────────────────────────────────────
  const getOrInfo = useCallback((orId: string) => {
    if (orId !== id) return undefined;
    return {
      id,
      seller: baseData.seller,
      sucursal: baseData.sucursal,
      fechaAgendada: baseData.fechaAgendada,
      estado: originalEstado,
      skus: products.length,
      uTotales: products.reduce((s, p) => s + p.esperadas, 0).toLocaleString("es-CL"),
      pallets: baseData.pallets,
      bultos: baseData.bultos,
    };
  }, [id, baseData, originalEstado, products]);

  const handleQrConfirm = useCallback((orId: string, _labelCount: number, _labelType: "pallets" | "bultos") => {
    try {
      localStorage.setItem(`amplifica_or_${orId}`, JSON.stringify({ estado: "Recepcionado en bodega" }));
    } catch { /* ignore */ }
    window.location.reload();
  }, []);

  // ── Session actions ──────────────────────────────────────────────────────
  const iniciarSesion = () => {
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
    setSesionInicio(new Date().toISOString());
    setSesionActiva(true);
  };

  const finalizarSesion = () => {
    if (!sesionActiva) return;
    const fin   = new Date().toISOString();
    const items = products
      .filter(p => p.contadasSesion > 0)
      .map(p => ({ pid: p.id, sku: p.sku, nombre: p.nombre, cantidad: p.contadasSesion }));
    setSesiones(prev => [
      ...prev,
      { id: sesionId(prev.length + 1), operador: OPERADOR, inicio: sesionInicio, fin, items },
    ]);
    setSesionActiva(false);
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
    // Reflect "En proceso de conteo" in the recepciones list (≥1 session completed)
    try {
      localStorage.setItem(`amplifica_or_${id}`, JSON.stringify({ estado: "En proceso de conteo" }));
    } catch { /* ignore */ }
  };

  // Liberar: discard current session without saving
  const liberarSesion = () => {
    setSesionActiva(false);
    setProducts(ps => ps.map(p => ({ ...p, contadasSesion: 0 })));
  };

  const updateContadas = useCallback((pid: string, val: number) =>
    setProducts(ps => ps.map(p => p.id === pid ? { ...p, contadasSesion: val } : p)), []);

  const removeProduct = useCallback((pid: string) => {
    setProducts(ps => ps.filter(p => p.id !== pid));
    setPendingRemove(null);
  }, []);

  // O(1) lookup map: barcode/sku → product id (rebuilt only when products change)
  const scanLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.barcode) map.set(p.barcode, p.id);
      if (p.sku) map.set(p.sku, p.id);
    }
    return map;
  }, [products]);

  // Sound aliases — shared module (see src/lib/scan-sounds.ts)
  const playScanSound = playScanSuccessSound;
  const playErrorSound = playScanErrorSound;

  const handleScan = () => {
    const code = scanner.trim();
    if (!code || !sesionActiva) return;
    const matchId = scanLookup.get(code);
    if (!matchId) {
      // Error: código no encontrado
      playErrorSound();
      setScanError(true);
      if (scanErrorTimerRef.current) clearTimeout(scanErrorTimerRef.current);
      scanErrorTimerRef.current = setTimeout(() => setScanError(false), 1500);
      setScanner("");
      return;
    }
    // Single setProducts: increment + move to top in one pass
    setProducts(ps => {
      const idx = ps.findIndex(p => p.id === matchId);
      if (idx === -1) return ps;
      const updated = { ...ps[idx], contadasSesion: ps[idx].contadasSesion + 1 };
      if (idx === 0) return [updated, ...ps.slice(1)];
      return [updated, ...ps.slice(0, idx), ...ps.slice(idx + 1)];
    });
    setScanner("");
    // Flash animation
    if (scanFlashTimerRef.current) clearTimeout(scanFlashTimerRef.current);
    setLastScannedId(matchId);
    scanFlashTimerRef.current = setTimeout(() => setLastScannedId(null), 1200);
    // Success border flash on input
    if (scanSuccessTimerRef.current) clearTimeout(scanSuccessTimerRef.current);
    setScanSuccess(true);
    scanSuccessTimerRef.current = setTimeout(() => setScanSuccess(false), 1000);
    // Auto-scroll to the scanned card so animation is visible
    requestAnimationFrame(() => {
      const el = document.getElementById(`pcard-${matchId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    // Sound
    playScanSound();
  };

  const sesionNumActual  = sesiones.length + 1;
  const totalAcumUds     = sesiones.reduce((s, ses) => s + ses.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const pendingProduct   = products.find(p => p.id === pendingRemove);

  // Completar OR button
  const orCerrada        = orEstado !== null;
  const terminarDisabled = sesionActiva || orCerrada || sesiones.length === 0;
  const terminarVariant  = sesiones.length > 0 ? "secondary" as const : "primary" as const;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* ── Modals ── */}
      {incidenciaTarget !== null && (() => {
        const prod = products.find(p => p.id === incidenciaTarget);
        return prod ? (
          <IncidenciasSKUModal
            product={prod}
            initialRows={incidenciaSnapshotRef.current}
            onClose={() => {
              // Revert live changes on cancel
              setIncidencias(prev => ({
                ...prev,
                [incidenciaTarget]: incidenciaSnapshotRef.current,
              }));
              setIncidenciaTarget(null);
            }}
            onSave={(rows) => {
              setIncidencias(prev => ({ ...prev, [incidenciaTarget]: rows }));
              setIncidenciaTarget(null);
            }}
            onLiveUpdate={(rows) => {
              setIncidencias(prev => ({ ...prev, [incidenciaTarget]: rows }));
            }}
          />
        ) : null;
      })()}

      {addProductFlow === "choice" && (
        <AddProductChoiceModal
          onRecognized={() => setAddProductFlow("catalog")}
          onUnrecognized={() => setAddProductFlow("manual")}
          onCancel={() => setAddProductFlow("closed")}
        />
      )}

      {addProductFlow === "catalog" && (
        <ProductsModal
          onClose={() => setAddProductFlow("closed")}
          onAdd={handleCatalogAdd}
        />
      )}

      {addProductFlow === "manual" && (
        <AddProductModal
          onCancel={() => setAddProductFlow("closed")}
          onConfirm={(product) => { setProducts(ps => [...ps, product]); setAddProductFlow("closed"); }}
          defaultCategoria="No creado en el sistema"
        />
      )}

      {confirmClose && (
        <ConfirmCloseModal
          id={id} sesiones={sesiones}
          totalContadas={stats.totalContadas}
          totalEsperadas={stats.totalEsperadas}
          hasIncidencias={Object.values(incidencias).some(rows => rows.some(r => r.tag !== ""))}
          onCancel={() => setConfirmClose(false)}
          onConfirm={(outcome) => {
            setOrEstado(outcome);
            // Build and persist quarantine records for all incidencias
            const qrRecords = buildQuarantineRecords(
              id, baseData.seller, baseData.sucursal, products, incidencias,
            );
            if (qrRecords.length > 0) {
              const all      = loadAllQuarantine();
              const filtered = all.filter(r => r.orId !== id);
              saveAllQuarantine([...filtered, ...qrRecords]);
              setQuarantineRecs(qrRecords);
            }
            const isPendiente = outcome === "Pendiente de aprobación";
            try {
              localStorage.setItem(`amplifica_or_${id}`, JSON.stringify({ estado: outcome }));
              localStorage.setItem("amplifica_pending_toast", JSON.stringify({
                title: isPendiente ? "OR enviada a aprobación" : "Recepción completada",
                subtitle: isPendiente ? `${id} requiere revisión de incidencias` : `${id} fue cerrada correctamente`,
              }));
            } catch { /* ignore */ }
            setConfirmClose(false);
            router.push("/recepciones");
          }}
        />
      )}

      {/* ── Confirm Liberar modal ── */}
      <AlertModal
        open={confirmLiberar}
        onClose={() => setConfirmLiberar(false)}
        icon={IconLockOpen}
        variant="danger"
        title="¿Liberar sesión activa?"
        subtitle="Esta acción no se puede deshacer"
        confirm={{
          label: "Liberar y descartar",
          icon: <IconLockOpen className="w-4 h-4" />,
          onClick: () => { liberarSesion(); setConfirmLiberar(false); },
        }}
      >
        <p>
          Se descartarán todas las unidades escaneadas en esta sesión{" "}
          (<span className="font-bold text-neutral-900">{stats.totalSesionAct} uds.</span>).
        </p>
      </AlertModal>

      {/* ── Confirmar finalización de sesión ── */}
      <AlertModal
        open={confirmFinalizar}
        onClose={() => setConfirmFinalizar(false)}
        icon={IconPlayerStop}
        variant="warning"
        title="Finalizar sesión"
        subtitle="Esta acción finalizará la sesión activa"
        confirm={{
          label: "Sí, finalizar",
          icon: <IconPlayerStop className="w-4 h-4" />,
          onClick: () => { setConfirmFinalizar(false); finalizarSesion(); },
        }}
      >
        <p>
          ¿Confirmas finalizar la sesión de conteo con{" "}
          <span className="font-bold text-neutral-900">{stats.totalSesionAct} unidades escaneadas</span>{" "}
          de{" "}
          <span className="font-bold text-neutral-900">{stats.totalEsperadas.toLocaleString("es-CL")} esperadas</span>?
        </p>
      </AlertModal>

      {pendingProduct && (
        <ConfirmRemoveModal
          nombre={pendingProduct.nombre}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => removeProduct(pendingProduct.id)}
        />
      )}

      {/* ── Guía de Despacho modal ── */}
      {guiaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4" onClick={() => setGuiaModal(false)}>
          <div className="relative bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100 flex-shrink-0">
              <h1 className="text-xl font-bold text-neutral-900">Guía de despacho</h1>
              <button onClick={() => setGuiaModal(false)} className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors duration-300">
                <IconX className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center">
                <IconFileText className="w-10 h-10 text-neutral-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-800">GD-{id.replace("RO-", "")}-{baseData.seller.replace(/\s/g, "")}.pdf</p>
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                  PDF · 2.4 MB
                </span>
              </div>
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-6 flex flex-col items-center gap-2">
                <IconFileText className="w-8 h-8 text-neutral-300" />
                <p className="text-xs text-neutral-600 text-center">Vista previa no disponible en esta versión</p>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-3 pb-8 sm:pb-5">
              <Button variant="primary" size="lg" iconLeft={<IconDownload className="w-4 h-4" />} className="w-full">
                Descargar guía
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Scanner Modal (Recibir en bodega) ── */}
      <QrScannerModal
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onConfirm={handleQrConfirm}
        onStartConteo={() => {/* already on detail page */}}
        getOrInfo={getOrInfo}
      />

      {/* ── Breadcrumb ── */}
      <nav className="max-w-4xl mx-auto px-4 lg:px-6 pt-4 pb-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-neutral-500">
        <Link href="/recepciones" className="hover:text-primary-500 transition-colors duration-300">Recepciones</Link>
        <IconChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-700 font-medium">Orden de Recepción</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-3 pb-32 lg:pb-6 space-y-4 sm:space-y-5">

        {/* ── Title row ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
          <div className={`${sesionActiva ? "sm:text-left" : "text-center sm:text-left"}`}>
            <h1 className={`font-bold text-neutral-900 ${sesionActiva ? "text-sm sm:text-2xl" : "text-xl sm:text-2xl"}`}>
              {sesionActiva ? (
                <>
                  <span className="sm:hidden font-sans">{id}</span>
                  <span className="hidden sm:inline">Orden de Recepción</span>
                </>
              ) : (
                <>Orden de Recepción</>
              )}
            </h1>
            {!sesionActiva && (
              <p className="text-sm text-neutral-600 mt-0.5">
                {baseData.sucursal}{baseData.fechaAgendada && baseData.fechaAgendada !== "—" ? ` - ${baseData.fechaAgendada}` : ""}
              </p>
            )}
          </div>

          {/* Desktop-only session buttons / closed OR actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {orCerrada && orEstado === "Pendiente de aprobación" ? (
              <>
                {(currentRole === "Super Admin" || currentRole === "KAM" || currentRole === "Seller") && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setApproveModal(true)}
                    disabled={!approvalData.canApprove}
                    title={!approvalData.canApprove ? `Hay ${approvalData.pendientesQR} incidencia${approvalData.pendientesQR !== 1 ? "s" : ""} sin resolver` : undefined}
                    iconLeft={<IconCircleCheck className="w-4 h-4" />}
                  >
                    Aprobar OR
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setGuiaModal(true)}
                  iconLeft={<IconFileText className="w-4 h-4" />}
                  className="whitespace-nowrap"
                >
                  Ver Guía de despacho
                </Button>
              </>
            ) : orCerrada ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setGuiaModal(true)}
                iconLeft={<IconFileText className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                Ver Guía de despacho
              </Button>
            ) : originalEstado === "Creado" && canComplete ? (
              <Button
                variant="primary"
                size="lg"
                href={`/recepciones/crear?startStep=2&mode=completar&sucursal=${encodeURIComponent(baseData.sucursal)}&seller=${encodeURIComponent(baseData.seller)}&orId=${id}`}
                iconLeft={<IconCircleCheck className="w-4 h-4" />}
              >
                Completar
              </Button>
            ) : originalEstado === "Programado" && currentRole === "Super Admin" ? (
              <>
                <Button variant="secondary" size="lg" iconLeft={<IconCalendarEvent className="w-4 h-4" />}>
                  Reagendar
                </Button>
                <Button variant="primary" size="lg" onClick={() => setQrScannerOpen(true)} iconLeft={<IconBuildingWarehouse className="w-4 h-4" />}>
                  Recibir en bodega
                </Button>
              </>
            ) : originalEstado === "Programado" && currentRole === "Operador" ? (
              <Button variant="primary" size="lg" onClick={() => setQrScannerOpen(true)} iconLeft={<IconBuildingWarehouse className="w-4 h-4" />}>
                Recibir en bodega
              </Button>
            ) : originalEstado === "Programado" && (currentRole === "Seller" || currentRole === "KAM") ? (
              <Button variant="primary" size="lg" iconLeft={<IconCalendarEvent className="w-4 h-4" />}>
                Reagendar
              </Button>
            ) : canStartSesion && (originalEstado === "En proceso de conteo" || originalEstado === "Recepcionado en bodega") ? (
              sesionActiva ? (
                <Button variant="secondary" size="lg" onClick={() => setConfirmFinalizar(true)} iconLeft={<IconPlayerStop className="w-4 h-4" />}>
                  Finalizar sesión
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={iniciarSesion} iconLeft={<IconPlayerPlay className="w-4 h-4" />}>
                  Iniciar sesión de conteo
                </Button>
              )
            ) : null}
          </div>

          {/* Mobile: Guía de despacho button for closed OR */}
          {orCerrada && (
            <div className="flex lg:hidden justify-center sm:justify-start">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setGuiaModal(true)}
                iconLeft={<IconFileText className="w-4 h-4" />}
              >
                Ver Guía de despacho
              </Button>
            </div>
          )}
        </div>

        {/* ── Resumen unificado de la OR (estado + datos + QR) ── */}
        {!orCerrada && (() => {
          const showQr = !sesionActiva && sesiones.length === 0;
          const displayEstado: Status =
            sesionActiva || sesiones.length > 0
              ? "En proceso de conteo"
              : (originalEstado as Status) ?? "Programado";

          return (
            <div className={`bg-white border border-neutral-200 rounded-xl overflow-hidden ${sesionActiva ? "hidden sm:block" : ""}`}>
              <div className="flex flex-col lg:flex-row">
                {/* Left: info summary */}
                <div className="flex-1 min-w-0 px-4 py-3 flex flex-col">
                  {/* Estado badge */}
                  <div className="mb-3">
                    <StatusBadge status={displayEstado} />
                  </div>

                  {/* Data grid */}
                  <div className="flex items-start gap-x-5 gap-y-2.5 flex-wrap">
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Orden</p>
                      <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-sans">{id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Tienda</p>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5">{baseData.seller}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Sucursal</p>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5">{baseData.sucursal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Productos</p>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5">{products.length} SKUs · {stats.totalEsperadas.toLocaleString("es-CL")} Uds.</p>
                    </div>
                    {baseData.pallets != null && (
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Pallets</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{baseData.pallets}</p>
                      </div>
                    )}
                    {baseData.bultos != null && (
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Bultos</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{baseData.bultos}</p>
                      </div>
                    )}
                    {sesiones.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Sesiones</p>
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">{sesiones.length + (sesionActiva ? 1 : 0)}</p>
                      </div>
                    )}
                  </div>

                  {/* Comentarios — contextuales según estado */}
                  {(() => {
                    const isRecepcionado = displayEstado === "Recepcionado en bodega" || displayEstado === "En proceso de conteo" || displayEstado === "Pendiente de aprobación";
                    const comentario = isRecepcionado ? baseData.comentarioRecepcion : baseData.comentarios;
                    const label = isRecepcionado ? "Comentarios del operador" : "Comentarios del seller";
                    return (
                      <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex-1 flex flex-col">
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{label}</p>
                        <div className="mt-1.5 flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2.5 flex-1">
                          <IconMessage className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${comentario ? "text-neutral-600" : "text-neutral-400"}`} />
                          {comentario
                            ? <p className="text-sm text-neutral-600 leading-relaxed">{comentario}</p>
                            : <p className="text-sm text-neutral-400 italic">Sin comentarios adicionales</p>
                          }
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: QR widget (only pre-count) */}
                {showQr && (
                  <>
                    {/* Divider — horizontal on mobile, vertical on desktop */}
                    <div className="w-full h-px bg-neutral-200 lg:w-px lg:h-auto lg:self-stretch" />
                    <div className="px-4 py-3 lg:py-4 flex justify-center">
                      <QrDisplaySection
                        orId={id}
                        seller={baseData.seller}
                        sucursal={baseData.sucursal}
                        bultos={baseData.bultos}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Active session: mobile compact card ── */}
        {sesionActiva && (
          <div className="sm:hidden rounded-xl px-3 py-2.5 space-y-2 bg-primary-50">
            {/* Session ID + progress bar inline */}
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scanError ? "bg-red-500" : "bg-primary-500 animate-pulse"}`} />
              <span className={`text-xs font-bold flex-shrink-0 ${scanError ? "text-red-600" : "text-primary-600"}`}>{scanError ? "No encontrado" : sesionId(sesionNumActual)}</span>
              <div className="flex-1 h-1.5 bg-primary-200/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.pct === 100 ? "bg-green-500" : "bg-primary-500"
                  }`}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-primary-600 tabular-nums flex-shrink-0">
                {stats.pct}%
              </span>
              <span className="text-[11px] text-primary-400 tabular-nums flex-shrink-0">
                {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
              </span>
              {stats.totalSesionAct > 0 && (
                <span className="text-[11px] font-bold text-primary-500 tabular-nums flex-shrink-0">+{stats.totalSesionAct}</span>
              )}
            </div>
            {/* Scanner block — dark bg, no borders, eye-catching */}
            <div className={`bg-neutral-900 rounded-xl px-4 py-4 space-y-3 transition-colors duration-300 ${
              scanError ? "bg-red-900/90 animate-[headShake_0.5s_ease-in-out]" : ""
            }`}>
              {/* Viewfinder area */}
              <div className="relative w-full h-14 flex items-center justify-center">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/20 rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/20 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/20 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/20 rounded-br" />
                <IconBarcode className="w-6 h-6 text-white/15" />
                <div className="absolute inset-x-2 h-0.5 bg-primary-400/40 top-1/2 animate-pulse rounded-full" />
              </div>
              {/* Input inside dark block */}
              <div className="relative">
                <IconBarcode className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${scanError ? "text-red-400" : scanSuccess ? "text-green-400" : "text-white/40"}`} />
                <input
                  ref={scannerInputRef}
                  type="text"
                  value={scanner}
                  onChange={e => { setScanner(e.target.value); if (scanError) setScanError(false); }}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder={scanError ? "Código no encontrado" : "Escanea o ingresa SKU"}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${
                    scanError
                      ? "bg-red-100 text-red-700 placeholder-red-400 focus:ring-red-300"
                      : scanSuccess
                        ? "bg-green-500/15 text-white placeholder-white/40 ring-2 ring-green-500 focus:ring-green-500"
                        : "bg-white/10 text-white placeholder-white/40 focus:ring-primary-400"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Desktop combined: session + scanner + progress (single card) ── */}
        {sesionActiva && (
          <div className="hidden sm:block bg-white border border-neutral-200 rounded-xl overflow-hidden">
            {/* Session header bar */}
            <div className="bg-primary-50 border-b border-primary-200 px-4 py-2.5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-bold text-primary-600">{sesionId(sesionNumActual)}</span>
              <span className="text-primary-400 text-xs">Iniciada {fmtDT(sesionInicio)}</span>
              <span className="ml-auto text-sm font-bold text-primary-500 tabular-nums flex-shrink-0">
                {stats.totalSesionAct.toLocaleString("es-CL")} uds. escaneadas
              </span>
            </div>
            {/* Scanner input row */}
            <div className="px-4 py-3 border-b border-neutral-100">
              <div className="flex flex-row gap-2">
                <div className="relative flex-1">
                  <IconScan className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${scanError ? "text-red-400" : scanSuccess ? "text-green-500" : "text-neutral-600"}`} />
                  <input
                    type="text"
                    value={scanner}
                    onChange={e => { setScanner(e.target.value); if (scanError) setScanError(false); }}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    placeholder={scanError ? "Código no encontrado en esta OR" : "Ingresa o escanea SKU / Código de barras"}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      scanError
                        ? "border border-red-300 bg-red-50 text-red-700 focus:ring-red-200 placeholder-red-400"
                        : scanSuccess
                          ? "border border-green-500 bg-green-50 text-neutral-600 ring-2 ring-green-500 focus:ring-green-500 placeholder-neutral-500"
                          : "border border-neutral-200 text-neutral-600 focus:ring-primary-200 placeholder-neutral-500"
                    }`}
                    autoFocus
                  />
                </div>
                <Button variant="primary" size="lg" onClick={handleScan}>
                  Registrar
                </Button>
              </div>
            </div>
            {/* Progress row */}
            <div className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-neutral-900 tabular-nums leading-none w-12 flex-shrink-0">
                  {stats.pct}%
                </span>
                <div className="flex-1">
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.pct === 100 ? "bg-green-500" :
                        stats.pct >= 75  ? "bg-primary-500" :
                        stats.conDiferencias > 0 ? "bg-amber-400" : "bg-primary-400"
                      }`}
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-neutral-600 tabular-nums flex-shrink-0">
                  {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
                </span>
                {stats.totalSesionAct > 0 && (
                  <span className="text-xs font-semibold text-primary-500 tabular-nums flex-shrink-0">
                    +{stats.totalSesionAct}
                  </span>
                )}
              </div>
              {/* Chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {stats.sinDiferencias > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                    <IconCircleCheck className="w-2.5 h-2.5" />
                    {stats.sinDiferencias} OK
                  </span>
                )}
                {stats.conDiferencias > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                    <IconAlertTriangle className="w-2.5 h-2.5" />
                    {stats.conDiferencias} diferencias
                  </span>
                )}
                {stats.pendientes > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-200 rounded-full">
                    {stats.pendientes} pendientes
                  </span>
                )}
                {(Object.entries(incidenciasPorTag) as [IncidenciaTagKey, number][]).map(([tagKey, total]) => {
                  const tag = INCIDENCIA_TAGS.find(t => t.key === tagKey);
                  if (!tag || total === 0) return null;
                  return (
                    <span key={tagKey} title={tag.tooltip} className={`inline-flex items-center gap-1 text-[11px] font-medium leading-none px-2 py-0.5 rounded-[6px] border cursor-help ${tagColorCls(tagKey)}`}>
                      {tag.label}
                      <span className="opacity-60 font-normal tabular-nums ml-0.5">· {total}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Progreso de conteo (visible solo después de al menos una sesión finalizada) ── */}
        {!orCerrada && !sesionActiva && sesiones.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3">
          {/* Row: porcentaje + barra + conteo */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-neutral-900 tabular-nums leading-none w-12 flex-shrink-0">
              {stats.pct}%
            </span>
            {stats.pct === 0 && sesiones.length === 0 && (
              <span className="text-xs text-neutral-600 italic">Sin conteo iniciado</span>
            )}
            <div className="flex-1">
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.pct === 100 ? "bg-green-500" :
                    stats.pct >= 75  ? "bg-primary-500" :
                    stats.conDiferencias > 0 ? "bg-amber-400" : "bg-primary-400"
                  }`}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-neutral-600 tabular-nums flex-shrink-0">
              {stats.totalContadas.toLocaleString("es-CL")}/{stats.totalEsperadas.toLocaleString("es-CL")}
            </span>
          </div>

          {/* Chips en una sola línea debajo */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {stats.sinDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                <IconCircleCheck className="w-2.5 h-2.5" />
                {stats.sinDiferencias} OK
              </span>
            )}
            {stats.conDiferencias > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                <IconAlertTriangle className="w-2.5 h-2.5" />
                {stats.conDiferencias} diferencias
              </span>
            )}
            {stats.pendientes > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-200 rounded-full">
                {stats.pendientes} pendientes
              </span>
            )}
            {(Object.entries(incidenciasPorTag) as [IncidenciaTagKey, number][]).map(([tagKey, total]) => {
              const tag = INCIDENCIA_TAGS.find(t => t.key === tagKey);
              if (!tag || total === 0) return null;
              return (
                <span key={tagKey} title={tag.tooltip} className={`inline-flex items-center gap-1 text-[11px] font-medium leading-none px-2 py-0.5 rounded-[6px] border cursor-help ${tagColorCls(tagKey)}`}>
                  {tag.label}
                  <span className="opacity-60 font-normal tabular-nums ml-0.5">· {total}</span>
                </span>
              );
            })}
          </div>

          {/* Per-product breakdown table (collapsible) */}
          {products.length > 0 && (
            <div className="mt-4">
              {showProductTable && (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden mb-3">
                    {products.map(p => {
                      const total      = totalPP[p.id] ?? 0;
                      const diff       = total - p.esperadas;
                      const incCount   = (incidencias[p.id] ?? []).reduce((s, r) => s + r.cantidad, 0);
                      const status     = getProductStatus(total, p.esperadas);
                      const statusConf = {
                        completo:   { label: "Completo",   cls: "bg-green-50 text-green-700" },
                        diferencia: { label: "Diferencia", cls: "bg-amber-50 text-amber-700" },
                        exceso:     { label: "Exceso",     cls: "bg-orange-50 text-orange-700" },
                        pendiente:  { label: "Pendiente",  cls: "bg-neutral-50 text-neutral-500" },
                      }[status];
                      return (
                        <div key={`m-${p.id}`} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-800 leading-snug">{p.nombre}</p>
                              <p className="text-xs text-neutral-600 font-sans mt-0.5">{p.sku}</p>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium flex-shrink-0 ${statusConf.cls}`}>
                              {statusConf.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 mt-2.5 bg-neutral-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase">Esperado</p>
                              <p className="text-xs font-semibold text-neutral-600 tabular-nums">{p.esperadas}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase">Contado</p>
                              <p className="text-xs font-bold text-neutral-800 tabular-nums">{total}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase">Diferencia</p>
                              <p className={`text-xs font-bold tabular-nums ${diff === 0 ? "text-green-600" : diff > 0 ? "text-orange-600" : "text-red-600"}`}>
                                {diff === 0 ? "—" : (diff > 0 ? "+" : "") + diff}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase">Incid.</p>
                              <p className={`text-xs tabular-nums ${incCount > 0 ? "text-red-600 font-bold" : "text-neutral-600"}`}>
                                {incCount > 0 ? incCount : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block border border-neutral-100 rounded-lg overflow-hidden mb-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500 text-left">
                          <th className="px-3 py-2 font-medium">SKU</th>
                          <th className="px-3 py-2 font-medium">Producto</th>
                          <th className="px-3 py-2 font-medium text-right">Esperado</th>
                          <th className="px-3 py-2 font-medium text-right">Contado</th>
                          <th className="px-3 py-2 font-medium text-right">Diferencia</th>
                          <th className="px-3 py-2 font-medium text-right">Incidencias</th>
                          <th className="px-3 py-2 font-medium text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {products.map(p => {
                          const total      = totalPP[p.id] ?? 0;
                          const diff       = total - p.esperadas;
                          const incCount   = (incidencias[p.id] ?? []).reduce((s, r) => s + r.cantidad, 0);
                          const status     = getProductStatus(total, p.esperadas);
                          const statusConf = {
                            completo:   { label: "Completo",   cls: "bg-green-50 text-green-700" },
                            diferencia: { label: "Diferencia", cls: "bg-amber-50 text-amber-700" },
                            exceso:     { label: "Exceso",     cls: "bg-orange-50 text-orange-700" },
                            pendiente:  { label: "Pendiente",  cls: "bg-neutral-50 text-neutral-500" },
                          }[status];
                          return (
                            <tr key={p.id} className="hover:bg-neutral-50/50">
                              <td className="px-3 py-2 text-neutral-500 font-sans">{p.sku}</td>
                              <td className="px-3 py-2 text-neutral-800 max-w-[180px] truncate">{p.nombre}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-neutral-600">{p.esperadas}</td>
                              <td className="px-3 py-2 text-right tabular-nums font-semibold text-neutral-800">{total}</td>
                              <td className={`px-3 py-2 text-right tabular-nums font-semibold ${
                                diff === 0 ? "text-green-600" : diff > 0 ? "text-orange-600" : "text-red-600"
                              }`}>
                                {diff === 0 ? "—" : (diff > 0 ? "+" : "") + diff}
                              </td>
                              <td className={`px-3 py-2 text-right tabular-nums ${incCount > 0 ? "text-red-600 font-semibold" : "text-neutral-600"}`}>
                                {incCount > 0 ? incCount : "—"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-xs font-medium ${statusConf.cls}`}>
                                  {statusConf.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <button
                onClick={() => setShowProductTable(v => !v)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-neutral-600 hover:text-neutral-600 transition-colors"
              >
                {showProductTable ? "Ocultar detalle" : "Ver detalle de productos"}
                {showProductTable ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
        )}

        {/* ── Stats resumen dark bar (OR cerrada) — estado incluido ── */}
        {orCerrada && (() => {
          const totalEsperadas = products.reduce((s, p) => s + p.esperadas, 0);
          const totalRecibidas = products.reduce((s, p) => {
            const acc = acumulado[p.id] ?? 0;
            const inc = (incidencias[p.id] ?? []).filter(r => r.tag !== "").reduce((rs, r) => rs + r.cantidad, 0);
            return s + acc + inc;
          }, 0);
          const diffNeta = totalRecibidas - totalEsperadas;
          const totalInc = products.reduce((s, p) => (incidencias[p.id] ?? []).filter(r => r.tag !== "").length + s, 0);
          const isPendiente = orEstado === "Pendiente de aprobación";
          const summaryItems: { label: string; value: string; cls?: string; badge?: boolean; badgeCls?: string }[] = [
            { label: "Estado", value: isPendiente ? "Pendiente" : "Completada", badge: true,
              badgeCls: isPendiente ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400" },
            { label: "SKUs", value: products.length.toString() },
            { label: "Uds. esperadas", value: totalEsperadas.toLocaleString("es-CL") },
            { label: "Uds. recibidas", value: totalRecibidas.toLocaleString("es-CL") },
            { label: "Diferencia neta", value: diffNeta === 0 ? "0" : (diffNeta > 0 ? "+" : "") + diffNeta.toLocaleString("es-CL"),
              cls: diffNeta === 0 ? "text-green-400" : diffNeta > 0 ? "text-blue-400" : "text-red-400" },
            { label: "Incidencias", value: totalInc > 0 ? totalInc.toString() : "0",
              cls: totalInc > 0 ? "text-amber-400" : undefined },
          ];
          return (
            <div className="bg-neutral-900 rounded-xl overflow-hidden">
              {/* Mobile: 3+3 */}
              <div className="sm:hidden px-4 py-3.5 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {summaryItems.slice(0, 3).map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[9px] font-semibold text-neutral-300 uppercase tracking-wider">{s.label}</p>
                      {s.badge ? (
                        <span className={`inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeCls ?? "bg-green-500/20 text-green-400"}`}>{s.value}</span>
                      ) : (
                        <p className={`text-base font-bold mt-0.5 tabular-nums ${s.cls ?? "text-white"}`}>{s.value}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {summaryItems.slice(3).map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[9px] font-semibold text-neutral-300 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-base font-bold mt-0.5 tabular-nums ${s.cls ?? "text-white"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Desktop: 6-col */}
              <div className="hidden sm:grid grid-cols-6 gap-3 px-5 py-4">
                {summaryItems.map(s => (
                  <div key={s.label} className="text-left">
                    <p className="text-[10px] font-semibold text-neutral-300 uppercase tracking-wider">{s.label}</p>
                    {s.badge ? (
                      <span className={`inline-flex mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${s.badgeCls ?? "bg-green-500/20 text-green-400"}`}>{s.value}</span>
                    ) : (
                      <p className={`text-sm font-bold mt-1 tabular-nums ${s.cls ?? "text-white"}`}>{s.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Información de la OR (datos del Seller) ── */}
        {orCerrada && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-neutral-800">Información de la OR</span>
                <StatusBadge status={(orEstado ?? "Completada") as Status} />
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">Datos ingresados por el seller al crear la orden</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">ID de OR</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-sans">{id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Seller</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5">{baseData.seller}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Sucursal</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5">{baseData.sucursal}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Fecha agendada</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5">{baseData.fechaAgendada}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">SKUs declarados</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5">{products.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Unidades declaradas</p>
                  <p className="text-sm font-semibold text-neutral-800 mt-0.5">{stats.totalEsperadas.toLocaleString("es-CL")}</p>
                </div>
                {(baseData.pallets != null || baseData.bultos != null) && (
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Formato de carga</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                      {[baseData.pallets != null && `${baseData.pallets} Pallets`, baseData.bultos != null && `${baseData.bultos} Bultos`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {baseData.comentarios && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Comentarios del seller</p>
                    <div className="mt-1.5 flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2.5">
                      <IconMessage className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-600 leading-relaxed">{baseData.comentarios}</p>
                    </div>
                  </div>
                )}
                {baseData.comentarioRecepcion && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Comentarios del operador</p>
                    <div className="mt-1.5 flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2.5">
                      <IconMessage className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-600 leading-relaxed">{baseData.comentarioRecepcion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Resumen de recepción (OR cerrada) ── */}
        {orCerrada && (
          <ResumenOR
            id={id} baseData={baseData} orEstado={orEstado}
            sesiones={sesiones} products={products}
            incidencias={incidencias} acumulado={acumulado}
            OPERADOR={OPERADOR} canApprove={can(currentRole, "or:approve")}
            quarantineRecs={quarantineRecs}
            onUpdateQuarantine={updateQuarantineRecord}
          />
        )}

        {/* ── Products container (hidden when OR closed — ResumenOR has details) ── */}
        {!orCerrada && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            {products.length === 0 ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center">
                  <IconPackage className="w-7 h-7 text-neutral-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Sin productos</p>
                  <p className="text-xs text-neutral-600 mt-0.5">Agrega los productos que llegaron en esta OR.</p>
                </div>
              </div>
            ) : (
              <div>
                {products.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <hr className="border-neutral-200" />}
                    <ProductCard
                      product={p}
                      acumulado={acumulado[p.id] ?? 0}
                      sesionActiva={sesionActiva}
                      onChange={updateContadas}
                      onRemove={pid => setPendingRemove(pid)}
                      incidencias={incidencias[p.id] ?? []}
                      onCategorizar={() => setIncidenciaTarget(p.id)}
                      isJustScanned={lastScannedId === p.id}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Añadir producto — solo visible con sesión activa */}
            {sesionActiva && (
              <div className="border-t border-dashed border-neutral-200">
                <button onClick={() => setAddProductFlow("choice")} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-neutral-600 hover:text-primary-500 hover:bg-primary-50/50 transition-colors duration-300 font-medium">
                  <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                    <IconPlus className="w-3 h-3" />
                  </span>
                  Añadir producto
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Session history ── */}
        {sesiones.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-base font-semibold text-neutral-800">Historial de sesiones</span>
              <span className="text-sm text-neutral-600 tabular-nums">
                {totalAcumUds.toLocaleString("es-CL")} uds. acumuladas
              </span>
            </div>
            {sesiones.map(ses => (
              <SesionRow
                key={ses.id}
                sesion={ses}
                incidencias={incidencias}
                products={products}
                acumulado={acumulado}
              />
            ))}
          </div>
        )}

        {/* ── Notificaciones enviadas (OR cerrada) ── */}
        {orCerrada && (() => {
          const hasInc = Object.values(incidencias).some(rows => rows.some(r => r.tag !== ""));
          const hasQuar = quarantineRecs.length > 0;

          type Notif = { titulo: string; destinatario: string; fecha: string; canal: string; icon: React.ReactNode; color: string };
          const notifs: Notif[] = [
            {
              titulo: "OR creada por el seller",
              destinatario: "Equipo de recepción",
              fecha: "07/03/2026 14:22",
              canal: "Email + Push",
              icon: <IconCirclePlus className="w-4 h-4 text-primary-500" />,
              color: "primary",
            },
            {
              titulo: "OR programada para recepción",
              destinatario: "Operador de andén",
              fecha: "07/03/2026 14:25",
              canal: "Push",
              icon: <IconCalendarEvent className="w-4 h-4 text-blue-500" />,
              color: "blue",
            },
            {
              titulo: "Sesión de conteo iniciada",
              destinatario: "Supervisor",
              fecha: "08/03/2026 16:35",
              canal: "Push",
              icon: <IconPlayerPlay className="w-4 h-4 text-green-500" />,
              color: "green",
            },
            {
              titulo: "Recepción completada",
              destinatario: `${baseData.seller} (Seller) + Supervisor`,
              fecha: "08/03/2026 18:10",
              canal: "Email + Push",
              icon: <IconCircleCheck className="w-4 h-4 text-green-600" />,
              color: "green",
            },
          ];

          if (hasInc) {
            notifs.push({
              titulo: "Incidencias reportadas al seller",
              destinatario: `${baseData.seller} (Seller)`,
              fecha: "08/03/2026 18:12",
              canal: "Email",
              icon: <IconAlertTriangle className="w-4 h-4 text-amber-500" />,
              color: "amber",
            });
          }

          if (hasQuar) {
            notifs.push({
              titulo: "Gestión de cuarentena iniciada",
              destinatario: "Equipo de calidad",
              fecha: "08/03/2026 18:15",
              canal: "Email + Push",
              icon: <IconShield className="w-4 h-4 text-red-500" />,
              color: "red",
            });
          }

          const reversed = [...notifs].reverse();

          return (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-semibold text-neutral-800">Notificaciones enviadas</span>
                  <p className="text-xs text-neutral-600 mt-0.5">Comunicaciones automáticas del sistema</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral-600 tabular-nums flex-shrink-0">
                  <IconBell className="w-4 h-4" />
                  {notifs.length} enviadas
                </div>
              </div>
              <div className="p-4">
                {reversed.map((n, idx) => {
                  const isLast = idx === reversed.length - 1;
                  return (
                    <div key={idx} className="flex gap-3">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          n.color === "primary" ? "bg-primary-50"  :
                          n.color === "blue"    ? "bg-blue-50"     :
                          n.color === "green"   ? "bg-green-50"    :
                          n.color === "amber"   ? "bg-amber-50"    :
                                                  "bg-red-50"
                        }`}>
                          {n.icon}
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-neutral-200 min-h-[16px]" />}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-4"}`}>
                        <p className="text-sm font-medium text-neutral-800">{n.titulo}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 flex-wrap">
                          <span>{n.destinatario}</span>
                          <span className="text-neutral-300">·</span>
                          <span>{n.canal}</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-0.5 tabular-nums">{n.fecha}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Registros de auditoría (solo Super Admin) ── */}
        {can(currentRole, "audit:view") && (() => {
          const auditEvents = SEED_AUDIT[id] ?? [];
          if (auditEvents.length === 0) return null;
          return (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <IconFileText className="w-4 h-4 text-neutral-600" />
                  <p className="text-base font-semibold text-neutral-900">Registros de auditoría</p>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">{auditEvents.length} evento{auditEvents.length !== 1 ? "s" : ""} registrado{auditEvents.length !== 1 ? "s" : ""} · Solo visible para Super Admin</p>
              </div>
              <div className="px-5 py-4">
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-neutral-200" />

                  <div className="space-y-0">
                    {auditEvents.map((evt, idx) => (
                      <div key={evt.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {/* Icon dot */}
                        <div className={`relative z-10 flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center ${getAuditIcon(evt.tipo)}`}>
                          {getAuditIconElement(evt.tipo)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-medium text-neutral-800 leading-snug">{evt.titulo}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-600 flex-wrap">
                            <span className="tabular-nums">{fmtDT(evt.timestamp)}</span>
                            <span className="text-neutral-300">·</span>
                            <span>{evt.usuario}</span>
                            <span className="text-neutral-300">·</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${
                              evt.rol === "Supervisor" ? "bg-purple-50 text-purple-600" :
                              evt.rol === "Operador"   ? "bg-sky-50 text-sky-600" :
                              evt.rol === "Seller"     ? "bg-amber-50 text-amber-600" :
                              evt.rol === "Sistema"    ? "bg-neutral-100 text-neutral-500" :
                                                         "bg-neutral-50 text-neutral-500"
                            }`}>{evt.rol}</span>
                          </div>
                          {evt.detalle && (
                            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{evt.detalle}</p>
                          )}
                          {(evt.estadoAnterior || evt.estadoPosterior) && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                              {evt.estadoAnterior && <span className="text-neutral-600">{evt.estadoAnterior}</span>}
                              {evt.estadoAnterior && evt.estadoPosterior && <span className="text-neutral-300">→</span>}
                              {evt.estadoPosterior && <span className="font-medium text-neutral-600">{evt.estadoPosterior}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Footer: Liberar + Completar OR (always visible when OR open, hidden for Creado) ── */}
        {!orCerrada && (originalEstado === "En proceso de conteo" || originalEstado === "Recepcionado en bodega") && (<>
          {/* No-units alert modal */}
          <AlertModal
            open={noUnitsAlert}
            onClose={() => setNoUnitsAlert(false)}
            icon={IconAlertTriangle}
            variant="warning"
            title="No se puede completar la OR"
          >
            <p>Debes ingresar al menos una unidad en las sesiones de conteo antes de completar la recepción.</p>
          </AlertModal>

          {/* Desktop footer actions */}
          <div className="hidden lg:flex items-center justify-between pt-2 pb-8">
            <Button variant="secondary" size="lg" onClick={() => setConfirmLiberar(true)} disabled={!sesionActiva} iconLeft={<IconLockOpen className="w-4 h-4" />}>
              Liberar
            </Button>

            <Button
              variant={terminarVariant}
              size="lg"
              onClick={() => {
                if (terminarDisabled) return;
                if (stats.totalContadas === 0) { setNoUnitsAlert(true); return; }
                setNoUnitsAlert(false);
                setConfirmClose(true);
              }}
              disabled={terminarDisabled}
              title={
                sesiones.length === 0 ? "Registra al menos una sesión antes de completar" :
                sesionActiva ? "Finaliza la sesión activa antes de completar" : undefined
              }
              iconLeft={<IconClipboardCheck className="w-4 h-4" />}
            >
              Completar OR
            </Button>
          </div>
        </>)}

      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!orCerrada && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 z-30 lg:hidden">
          {originalEstado === "Creado" && canComplete ? (
            <Button
              variant="primary"
              size="lg"
              href={`/recepciones/crear?startStep=2&mode=completar&sucursal=${encodeURIComponent(baseData.sucursal)}&seller=${encodeURIComponent(baseData.seller)}&orId=${id}`}
              iconLeft={<IconCircleCheck className="w-4 h-4" />}
              className="w-full"
            >
              Completar
            </Button>
          ) : originalEstado === "Programado" && currentRole === "Super Admin" ? (
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="lg" onClick={() => setQrScannerOpen(true)} iconLeft={<IconBuildingWarehouse className="w-4 h-4" />} className="w-full">
                Recibir en bodega
              </Button>
              <Button variant="secondary" size="lg" iconLeft={<IconCalendarEvent className="w-4 h-4" />} className="w-full">
                Reagendar
              </Button>
            </div>
          ) : originalEstado === "Programado" && currentRole === "Operador" ? (
            <Button variant="primary" size="lg" onClick={() => setQrScannerOpen(true)} iconLeft={<IconBuildingWarehouse className="w-4 h-4" />} className="w-full">
              Recibir en bodega
            </Button>
          ) : originalEstado === "Programado" && (currentRole === "Seller" || currentRole === "KAM") ? (
            <Button variant="primary" size="lg" iconLeft={<IconCalendarEvent className="w-4 h-4" />} className="w-full">
              Reagendar
            </Button>
          ) : canStartSesion && (originalEstado === "En proceso de conteo" || originalEstado === "Recepcionado en bodega") ? (
            sesionActiva ? (
              <div className="flex flex-col gap-1">
                {canFinSesion && (
                  <Button variant="primary" size="lg" onClick={() => setConfirmFinalizar(true)} iconLeft={<IconPlayerStop className="w-4 h-4" />} className="w-full">
                    Finalizar sesión
                  </Button>
                )}
                {canRelSesion && (
                  <Button variant="tertiary" size="lg" onClick={() => setConfirmLiberar(true)} iconLeft={<IconLockOpen className="w-4 h-4" />} className="w-full !text-red-500 hover:!text-red-600">
                    Liberar sesión
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="lg" onClick={iniciarSesion} iconLeft={<IconPlayerPlay className="w-4 h-4" />} className="w-full">
                  Iniciar sesión de conteo
                </Button>
                {sesiones.length > 0 && (
                  <Button
                    variant={terminarVariant}
                    size="lg"
                    onClick={() => {
                      if (stats.totalContadas === 0) { setNoUnitsAlert(true); return; }
                      setNoUnitsAlert(false);
                      setConfirmClose(true);
                    }}
                    disabled={terminarDisabled}
                    iconLeft={<IconClipboardCheck className="w-4 h-4" />}
                    className="w-full"
                  >
                    Completar OR
                  </Button>
                )}
              </div>
            )
          ) : null}
        </div>
      )}

      {/* ── Mobile sticky bar for Pendiente de aprobación ── */}
      {orEstado === "Pendiente de aprobación" && (currentRole === "Super Admin" || currentRole === "KAM" || currentRole === "Seller") && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 pt-3 pb-6 z-30 lg:hidden">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setApproveModal(true)}
            disabled={!approvalData.canApprove}
            iconLeft={<IconCircleCheck className="w-4 h-4" />}
            className="w-full"
          >
            {!approvalData.canApprove
              ? `${approvalData.pendientesQR} incidencia${approvalData.pendientesQR !== 1 ? "s" : ""} sin resolver`
              : "Aprobar OR"}
          </Button>
        </div>
      )}

      {/* ── AlertModal: Aprobar OR ── */}
      <AlertModal
        open={approveModal}
        onClose={() => setApproveModal(false)}
        icon={IconCircleCheck}
        variant="warning"
        title="Aprobar orden de recepción"
        subtitle="Esta acción es definitiva y no puede deshacerse"
        confirm={{
          label: "Sí, aprobar OR",
          icon: <IconCircleCheck className="w-4 h-4" />,
          onClick: handleApproveOR,
        }}
      >
        <p>
          ¿Confirmas aprobar la orden{" "}
          <span className="font-bold text-neutral-900">{id}</span>?
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Uds. recibidas</span>
            <span className="font-semibold text-neutral-900">{approvalData.totalRecibidas.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Uds. esperadas</span>
            <span className="font-semibold text-neutral-900">{approvalData.totalEsperadas.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Diferencia neta</span>
            <span className={`font-semibold ${approvalData.diffNeta === 0 ? "text-green-600" : approvalData.diffNeta > 0 ? "text-blue-600" : "text-red-600"}`}>
              {approvalData.diffNeta === 0 ? "0" : (approvalData.diffNeta > 0 ? "+" : "") + approvalData.diffNeta.toLocaleString("es-CL")}
            </span>
          </div>
          {approvalData.totalInc > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Incidencias</span>
              <span className="font-semibold text-amber-600">{approvalData.totalInc}</span>
            </div>
          )}
        </div>
        {approvalData.totalInc > 0 && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Todas las incidencias han sido resueltas.
          </p>
        )}
      </AlertModal>
    </div>
  );
}
