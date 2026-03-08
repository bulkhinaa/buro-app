import { RoomCount, BathroomConfig, KitchenType } from '../types';

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  rooms: RoomCount;
  bathrooms: BathroomConfig;
  kitchen_type: KitchenType;
  area_range: { min: number; max: number };
  svg: string;
  tags: string[];
}

// SVG style guide (Pro quality):
// Walls: 3-4px stroke, #1A1A1A
// Partitions: 2px stroke, #8E8E93
// Doors: 90° arcs, thin line
// Windows: double lines on exterior walls, #C5A55A
// Bathroom fill: rgba(123, 45, 62, 0.08)
// Kitchen fill: rgba(197, 165, 90, 0.08)
// Labels: 10px, #8E8E93
// ViewBox: 200x200

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ─────────────────────────────────────────────
  // STUDIOS (2)
  // ─────────────────────────────────────────────
  {
    id: 'studio-rect',
    name: 'Прямоугольная',
    description: 'Классическая студия прямоугольной формы',
    rooms: 0,
    bathrooms: 'combined_1',
    kitchen_type: 'open',
    area_range: { min: 25, max: 35 },
    tags: ['новостройка', 'монолит', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="15" y="15" width="170" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Bathroom partition -->
  <line x1="15" y1="70" x2="65" y2="70" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="65" y1="15" x2="65" y2="70" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom fill -->
  <rect x="17" y="17" width="46" height="51" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen zone fill -->
  <rect x="115" y="17" width="68" height="80" fill="rgba(197,165,90,0.08)"/>
  <!-- Kitchen partition (half-wall) -->
  <line x1="115" y1="97" x2="115" y2="55" stroke="#8E8E93" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Bathroom door arc -->
  <path d="M 65 55 A 15 15 0 0 0 50 70" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <line x1="65" y1="55" x2="65" y2="70" stroke="none"/>
  <!-- Entry door -->
  <rect x="13" y="130" width="4" height="30" fill="#F9F7F4"/>
  <path d="M 17 160 A 30 30 0 0 0 47 130" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - top wall -->
  <line x1="80" y1="13" x2="110" y2="13" stroke="#C5A55A" stroke-width="2"/>
  <line x1="80" y1="17" x2="110" y2="17" stroke="#C5A55A" stroke-width="1"/>
  <line x1="130" y1="13" x2="170" y2="13" stroke="#C5A55A" stroke-width="2"/>
  <line x1="130" y1="17" x2="170" y2="17" stroke="#C5A55A" stroke-width="1"/>
  <!-- Window - right wall -->
  <line x1="187" y1="100" x2="187" y2="145" stroke="#C5A55A" stroke-width="2"/>
  <line x1="183" y1="100" x2="183" y2="145" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="35" y="48" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="150" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="90" y="135" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="30" y="155" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: 'studio-l',
    name: 'Г-образная',
    description: 'Студия с нишей, Г-образная планировка',
    rooms: 0,
    bathrooms: 'combined_1',
    kitchen_type: 'open',
    area_range: { min: 28, max: 40 },
    tags: ['новостройка', 'монолит'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- L-shaped exterior -->
  <path d="M 15 15 L 185 15 L 185 120 L 120 120 L 120 185 L 15 185 Z" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Bathroom -->
  <line x1="15" y1="65" x2="60" y2="65" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="60" y1="15" x2="60" y2="65" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="17" y="17" width="41" height="46" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen zone -->
  <rect x="125" y="17" width="58" height="60" fill="rgba(197,165,90,0.08)"/>
  <line x1="125" y1="77" x2="125" y2="40" stroke="#8E8E93" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Bathroom door -->
  <path d="M 60 50 A 15 15 0 0 0 45 65" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Entry door -->
  <rect x="13" y="130" width="4" height="28" fill="#F9F7F4"/>
  <path d="M 17 158 A 28 28 0 0 0 45 130" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows -->
  <line x1="75" y1="13" x2="115" y2="13" stroke="#C5A55A" stroke-width="2"/>
  <line x1="75" y1="17" x2="115" y2="17" stroke="#C5A55A" stroke-width="1"/>
  <line x1="187" y1="40" x2="187" y2="80" stroke="#C5A55A" stroke-width="2"/>
  <line x1="183" y1="40" x2="183" y2="80" stroke="#C5A55A" stroke-width="1"/>
  <line x1="40" y1="187" x2="85" y2="187" stroke="#C5A55A" stroke-width="2"/>
  <line x1="40" y1="183" x2="85" y2="183" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="36" y="45" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="155" y="50" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="100" y="100" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="70" y="155" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <text x="30" y="155" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },

  // ─────────────────────────────────────────────
  // 1-ROOM APARTMENTS (3)
  // ─────────────────────────────────────────────
  {
    id: '1r-linear',
    name: 'Линейная',
    description: 'Все окна на одну сторону',
    rooms: 1,
    bathrooms: 'combined_1',
    kitchen_type: 'separate',
    area_range: { min: 36, max: 45 },
    tags: ['панель', 'П-44Т', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="15" y="15" width="170" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Hall partition -->
  <line x1="15" y1="75" x2="70" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom partition -->
  <line x1="70" y1="15" x2="70" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Room/kitchen wall -->
  <line x1="110" y1="15" x2="110" y2="185" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom fill -->
  <rect x="17" y="17" width="51" height="56" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="112" y="17" width="71" height="166" fill="rgba(197,165,90,0.08)"/>
  <!-- Bathroom door -->
  <path d="M 55 75 A 15 15 0 0 1 70 60" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Kitchen door -->
  <rect x="108" y="90" width="4" height="28" fill="#F9F7F4"/>
  <path d="M 110 118 A 28 28 0 0 1 82 90" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Room door -->
  <rect x="108" y="140" width="4" height="28" fill="#F9F7F4"/>
  <!-- Entry door -->
  <rect x="13" y="140" width="4" height="28" fill="#F9F7F4"/>
  <path d="M 17 168 A 28 28 0 0 0 45 140" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - right wall (all rooms face right) -->
  <line x1="187" y1="35" x2="187" y2="70" stroke="#C5A55A" stroke-width="2"/>
  <line x1="183" y1="35" x2="183" y2="70" stroke="#C5A55A" stroke-width="1"/>
  <line x1="187" y1="130" x2="187" y2="170" stroke="#C5A55A" stroke-width="2"/>
  <line x1="183" y1="130" x2="183" y2="170" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="185" y="130" width="12" height="40" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="191" y="153" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Б</text>
  <!-- Labels -->
  <text x="40" y="50" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="150" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="55" y="140" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <text x="40" y="105" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '1r-raspashonka',
    name: 'Распашонка',
    description: 'Комната и кухня на разные стороны',
    rooms: 1,
    bathrooms: 'combined_1',
    kitchen_type: 'separate',
    area_range: { min: 38, max: 45 },
    tags: ['панель', 'кирпич', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="15" y="15" width="170" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Central hall -->
  <line x1="75" y1="15" x2="75" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="130" y1="15" x2="130" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="15" y1="105" x2="185" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom in hall -->
  <line x1="75" y1="60" x2="130" y2="60" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="77" y="17" width="51" height="41" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill (left) -->
  <rect x="17" y="17" width="56" height="86" fill="rgba(197,165,90,0.08)"/>
  <!-- Bathroom door -->
  <path d="M 110 60 A 15 15 0 0 0 95 75" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Kitchen door -->
  <rect x="73" y="75" width="4" height="25" fill="#F9F7F4"/>
  <!-- Room door -->
  <rect x="128" y="75" width="4" height="25" fill="#F9F7F4"/>
  <!-- Entry door -->
  <rect x="95" y="103" width="25" height="4" fill="#F9F7F4"/>
  <path d="M 95 105 A 25 25 0 0 0 120 130" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - left wall (kitchen) -->
  <line x1="13" y1="40" x2="13" y2="80" stroke="#C5A55A" stroke-width="2"/>
  <line x1="17" y1="40" x2="17" y2="80" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right wall (room) -->
  <line x1="187" y1="40" x2="187" y2="80" stroke="#C5A55A" stroke-width="2"/>
  <line x1="183" y1="40" x2="183" y2="80" stroke="#C5A55A" stroke-width="1"/>
  <!-- Room (bottom) -->
  <text x="100" y="155" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <!-- Window bottom -->
  <line x1="60" y1="187" x2="100" y2="187" stroke="#C5A55A" stroke-width="2"/>
  <line x1="60" y1="183" x2="100" y2="183" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="60" y="185" width="40" height="12" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="100" y="43" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="45" y="60" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="157" y="60" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="100" y="90" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '1r-euro',
    name: 'Евро-однушка',
    description: 'Кухня-гостиная + спальная зона',
    rooms: 1,
    bathrooms: 'combined_1',
    kitchen_type: 'open',
    area_range: { min: 36, max: 42 },
    tags: ['новостройка', 'монолит', 'евроформат'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="15" y="15" width="170" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Bedroom wall -->
  <line x1="15" y1="110" x2="110" y2="110" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="110" y1="110" x2="110" y2="185" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Hall/bathroom area -->
  <line x1="110" y1="15" x2="110" y2="70" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="110" y1="70" x2="185" y2="70" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom fill -->
  <rect x="112" y="17" width="71" height="51" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen zone in living area -->
  <rect x="17" y="17" width="50" height="91" fill="rgba(197,165,90,0.08)"/>
  <line x1="67" y1="15" x2="67" y2="60" stroke="#8E8E93" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Bedroom door -->
  <rect x="60" y="108" width="25" height="4" fill="#F9F7F4"/>
  <path d="M 60 110 A 25 25 0 0 1 85 135" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Bathroom door -->
  <path d="M 130 70 A 18 18 0 0 1 148 52" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Entry door -->
  <rect x="140" y="183" width="28" height="4" fill="#F9F7F4"/>
  <path d="M 168 185 A 28 28 0 0 0 140 157" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - top wall -->
  <line x1="30" y1="13" x2="65" y2="13" stroke="#C5A55A" stroke-width="2"/>
  <line x1="30" y1="17" x2="65" y2="17" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - left wall (bedroom) -->
  <line x1="13" y1="130" x2="13" y2="170" stroke="#C5A55A" stroke-width="2"/>
  <line x1="17" y1="130" x2="17" y2="170" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="3" y="130" width="12" height="40" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="150" y="48" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="40" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="65" y="75" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="55" y="155" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <text x="148" y="130" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },

  // ─────────────────────────────────────────────
  // 2-ROOM APARTMENTS (4)
  // ─────────────────────────────────────────────
  {
    id: '2r-linear',
    name: 'Линейная',
    description: 'Все окна на одну сторону',
    rooms: 2,
    bathrooms: 'separate_1',
    kitchen_type: 'separate',
    area_range: { min: 50, max: 60 },
    tags: ['панель', 'П-44', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="10" y="15" width="180" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Central corridor -->
  <line x1="10" y1="80" x2="120" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Room divider -->
  <line x1="120" y1="15" x2="120" y2="185" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area -->
  <line x1="50" y1="15" x2="50" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Toilet/bathroom split -->
  <line x1="50" y1="50" x2="85" y2="50" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="85" y1="15" x2="85" y2="50" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom fills -->
  <rect x="12" y="17" width="36" height="61" fill="rgba(123,45,62,0.08)"/>
  <rect x="52" y="17" width="31" height="31" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="122" y="17" width="66" height="166" fill="rgba(197,165,90,0.08)"/>
  <!-- Doors -->
  <path d="M 35 80 A 15 15 0 0 1 50 65" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <path d="M 65 50 A 12 12 0 0 0 77 38" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <rect x="118" y="95" width="4" height="25" fill="#F9F7F4"/>
  <!-- Entry -->
  <rect x="55" y="183" width="28" height="4" fill="#F9F7F4"/>
  <path d="M 83 185 A 28 28 0 0 0 55 157" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - right wall -->
  <line x1="192" y1="35" x2="192" y2="70" stroke="#C5A55A" stroke-width="2"/>
  <line x1="188" y1="35" x2="188" y2="70" stroke="#C5A55A" stroke-width="1"/>
  <line x1="192" y1="135" x2="192" y2="170" stroke="#C5A55A" stroke-width="2"/>
  <line x1="188" y1="135" x2="188" y2="170" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="190" y="135" width="10" height="35" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="30" y="55" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="68" y="38" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="155" y="100" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="65" y="140" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="65" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="80" y="100" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '2r-raspashonka',
    name: 'Распашонка',
    description: 'Комнаты на противоположные стороны',
    rooms: 2,
    bathrooms: 'separate_1',
    kitchen_type: 'separate',
    area_range: { min: 55, max: 65 },
    tags: ['панель', 'П-44Т', 'самая популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="10" y="15" width="180" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Central corridor horizontal -->
  <line x1="10" y1="90" x2="190" y2="90" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="10" y1="130" x2="190" y2="130" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Room dividers -->
  <line x1="100" y1="15" x2="100" y2="90" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="100" y1="130" x2="100" y2="185" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area in corridor -->
  <line x1="55" y1="90" x2="55" y2="130" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="100" y1="90" x2="100" y2="130" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom fills -->
  <rect x="12" y="92" width="41" height="36" fill="rgba(123,45,62,0.08)"/>
  <rect x="57" y="92" width="41" height="36" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill (top-right) -->
  <rect x="102" y="17" width="86" height="71" fill="rgba(197,165,90,0.08)"/>
  <!-- Doors -->
  <path d="M 30 90 A 12 12 0 0 0 42 102" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <path d="M 75 130 A 12 12 0 0 0 87 118" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Entry -->
  <rect x="130" y="128" width="28" height="4" fill="#F9F7F4"/>
  <path d="M 158 130 A 28 28 0 0 0 130 102" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - left (room 1 top) -->
  <line x1="8" y1="35" x2="8" y2="70" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="35" x2="12" y2="70" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right (kitchen top) -->
  <line x1="192" y1="35" x2="192" y2="70" stroke="#C5A55A" stroke-width="2"/>
  <line x1="188" y1="35" x2="188" y2="70" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - left (room 2 bottom) -->
  <line x1="8" y1="145" x2="8" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="145" x2="12" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right (room bottom) -->
  <line x1="192" y1="145" x2="192" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="188" y1="145" x2="188" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="0" y="145" width="10" height="30" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="50" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="148" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="30" y="116" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="78" y="116" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="50" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="148" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="148" y="116" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '2r-euro',
    name: 'Евро-двушка',
    description: 'Кухня-гостиная + изолированная спальня',
    rooms: 2,
    bathrooms: 'separate_1',
    kitchen_type: 'open',
    area_range: { min: 45, max: 55 },
    tags: ['новостройка', 'монолит', 'евроформат', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="10" y="15" width="180" height="170" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Bedroom wall -->
  <line x1="10" y1="105" x2="110" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="110" y1="105" x2="110" y2="185" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area -->
  <line x1="120" y1="15" x2="120" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="120" y1="80" x2="190" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom split -->
  <line x1="155" y1="15" x2="155" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="122" y="17" width="31" height="61" fill="rgba(123,45,62,0.08)"/>
  <rect x="157" y="17" width="31" height="61" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen zone -->
  <rect x="12" y="17" width="55" height="86" fill="rgba(197,165,90,0.08)"/>
  <line x1="67" y1="15" x2="67" y2="60" stroke="#8E8E93" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Bedroom door -->
  <rect x="55" y="103" width="25" height="4" fill="#F9F7F4"/>
  <path d="M 55 105 A 25 25 0 0 1 80 130" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Bathroom doors -->
  <path d="M 135 80 A 14 14 0 0 1 149 66" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <path d="M 170 80 A 14 14 0 0 0 156 66" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Entry -->
  <rect x="140" y="183" width="28" height="4" fill="#F9F7F4"/>
  <path d="M 168 185 A 28 28 0 0 0 140 157" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows -->
  <line x1="8" y1="35" x2="8" y2="75" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="35" x2="12" y2="75" stroke="#C5A55A" stroke-width="1"/>
  <line x1="8" y1="130" x2="8" y2="170" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="130" x2="12" y2="170" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="0" y="130" width="10" height="40" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="40" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="80" y="65" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="136" y="52" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="173" y="52" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="55" y="150" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <text x="150" y="140" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '2r-corner',
    name: 'Угловая',
    description: 'Г-образная, окна на две стороны',
    rooms: 2,
    bathrooms: 'separate_1',
    kitchen_type: 'separate',
    area_range: { min: 55, max: 65 },
    tags: ['панель', 'кирпич', 'угловая'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- L-shaped exterior -->
  <path d="M 10 15 L 190 15 L 190 110 L 110 110 L 110 185 L 10 185 Z" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Room divider -->
  <line x1="10" y1="105" x2="110" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Kitchen wall -->
  <line x1="110" y1="15" x2="110" y2="105" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area -->
  <line x1="55" y1="15" x2="55" y2="65" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="55" y1="65" x2="110" y2="65" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom split -->
  <line x1="82" y1="15" x2="82" y2="65" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="57" y="17" width="23" height="46" fill="rgba(123,45,62,0.08)"/>
  <rect x="84" y="17" width="24" height="46" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="112" y="17" width="76" height="91" fill="rgba(197,165,90,0.08)"/>
  <!-- Doors -->
  <path d="M 68 65 A 12 12 0 0 1 80 53" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <path d="M 95 65 A 12 12 0 0 0 83 53" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Entry -->
  <rect x="30" y="183" width="28" height="4" fill="#F9F7F4"/>
  <path d="M 58 185 A 28 28 0 0 0 30 157" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - left wall -->
  <line x1="8" y1="35" x2="8" y2="70" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="35" x2="12" y2="70" stroke="#C5A55A" stroke-width="1"/>
  <line x1="8" y1="130" x2="8" y2="165" stroke="#C5A55A" stroke-width="2"/>
  <line x1="12" y1="130" x2="12" y2="165" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - top wall -->
  <line x1="130" y1="13" x2="170" y2="13" stroke="#C5A55A" stroke-width="2"/>
  <line x1="130" y1="17" x2="170" y2="17" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right wall -->
  <line x1="192" y1="35" x2="192" y2="75" stroke="#C5A55A" stroke-width="2"/>
  <line x1="188" y1="35" x2="188" y2="75" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="30" y="50" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="68" y="45" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="95" y="45" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="150" y="65" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="55" y="150" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С</text>
  <text x="55" y="90" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },

  // ─────────────────────────────────────────────
  // 3-ROOM APARTMENTS (3)
  // ─────────────────────────────────────────────
  {
    id: '3r-linear',
    name: 'Линейная',
    description: 'Три комнаты, все окна на одну сторону',
    rooms: 3,
    bathrooms: 'separate_2',
    kitchen_type: 'separate',
    area_range: { min: 70, max: 85 },
    tags: ['панель', 'П-44Т'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="8" y="10" width="184" height="180" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Corridor -->
  <line x1="8" y1="75" x2="130" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Room dividers -->
  <line x1="70" y1="75" x2="70" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="130" y1="10" x2="130" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area -->
  <line x1="45" y1="10" x2="45" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="80" y1="10" x2="80" y2="45" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="45" y1="45" x2="80" y2="45" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="10" y="12" width="33" height="61" fill="rgba(123,45,62,0.08)"/>
  <rect x="47" y="12" width="31" height="31" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="132" y="12" width="58" height="176" fill="rgba(197,165,90,0.08)"/>
  <!-- Entry -->
  <rect x="85" y="188" width="25" height="4" fill="#F9F7F4"/>
  <path d="M 110 190 A 25 25 0 0 0 85 165" fill="none" stroke="#8E8E93" stroke-width="1.5"/>
  <!-- Windows - right wall -->
  <line x1="194" y1="30" x2="194" y2="60" stroke="#C5A55A" stroke-width="2"/>
  <line x1="190" y1="30" x2="190" y2="60" stroke="#C5A55A" stroke-width="1"/>
  <line x1="194" y1="110" x2="194" y2="140" stroke="#C5A55A" stroke-width="2"/>
  <line x1="190" y1="110" x2="190" y2="140" stroke="#C5A55A" stroke-width="1"/>
  <line x1="194" y1="155" x2="194" y2="180" stroke="#C5A55A" stroke-width="2"/>
  <line x1="190" y1="155" x2="190" y2="180" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="192" y="155" width="8" height="25" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="26" y="48" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="62" y="32" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="162" y="100" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="100" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="38" y="140" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="100" y="140" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="90" y="88" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '3r-raspashonka',
    name: 'Распашонка',
    description: 'Комнаты на противоположные стороны',
    rooms: 3,
    bathrooms: 'separate_2',
    kitchen_type: 'separate',
    area_range: { min: 75, max: 90 },
    tags: ['панель', 'П-44Т', 'популярная'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="8" y="10" width="184" height="180" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Corridor -->
  <line x1="8" y1="85" x2="192" y2="85" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="8" y1="125" x2="192" y2="125" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Top room dividers -->
  <line x1="95" y1="10" x2="95" y2="85" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bottom room dividers -->
  <line x1="75" y1="125" x2="75" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="140" y1="125" x2="140" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom in corridor -->
  <line x1="45" y1="85" x2="45" y2="125" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="90" y1="85" x2="90" y2="125" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="10" y="87" width="33" height="36" fill="rgba(123,45,62,0.08)"/>
  <rect x="47" y="87" width="41" height="36" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="97" y="12" width="93" height="71" fill="rgba(197,165,90,0.08)"/>
  <!-- Entry -->
  <rect x="120" y="123" width="25" height="4" fill="#F9F7F4"/>
  <!-- Windows - left top -->
  <line x1="6" y1="30" x2="6" y2="60" stroke="#C5A55A" stroke-width="2"/>
  <line x1="10" y1="30" x2="10" y2="60" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right top -->
  <line x1="194" y1="30" x2="194" y2="60" stroke="#C5A55A" stroke-width="2"/>
  <line x1="190" y1="30" x2="190" y2="60" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - left bottom -->
  <line x1="6" y1="145" x2="6" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="10" y1="145" x2="10" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - bottom center -->
  <line x1="95" y1="192" x2="125" y2="192" stroke="#C5A55A" stroke-width="2"/>
  <line x1="95" y1="188" x2="125" y2="188" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - right bottom -->
  <line x1="194" y1="145" x2="194" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="190" y1="145" x2="190" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="48" y="52" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="145" y="52" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="26" y="110" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="68" y="110" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="40" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="108" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="165" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С3</text>
  <text x="150" y="108" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '3r-euro',
    name: 'Евро-трёшка',
    description: 'Кухня-гостиная + 2 спальни',
    rooms: 3,
    bathrooms: 'separate_1',
    kitchen_type: 'open',
    area_range: { min: 60, max: 75 },
    tags: ['новостройка', 'монолит', 'евроформат'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="8" y="10" width="184" height="180" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Bedroom walls -->
  <line x1="8" y1="100" x2="100" y2="100" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="100" y1="100" x2="100" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="55" y1="100" x2="55" y2="190" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom area -->
  <line x1="130" y1="10" x2="130" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="130" y1="75" x2="192" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="160" y1="10" x2="160" y2="75" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="132" y="12" width="26" height="61" fill="rgba(123,45,62,0.08)"/>
  <rect x="162" y="12" width="28" height="61" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen zone -->
  <rect x="10" y="12" width="55" height="86" fill="rgba(197,165,90,0.08)"/>
  <line x1="65" y1="10" x2="65" y2="55" stroke="#8E8E93" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Bedroom doors -->
  <rect x="20" y="98" width="22" height="4" fill="#F9F7F4"/>
  <rect x="70" y="98" width="22" height="4" fill="#F9F7F4"/>
  <!-- Entry -->
  <rect x="150" y="188" width="25" height="4" fill="#F9F7F4"/>
  <!-- Windows - left -->
  <line x1="6" y1="30" x2="6" y2="65" stroke="#C5A55A" stroke-width="2"/>
  <line x1="10" y1="30" x2="10" y2="65" stroke="#C5A55A" stroke-width="1"/>
  <line x1="6" y1="125" x2="6" y2="155" stroke="#C5A55A" stroke-width="2"/>
  <line x1="10" y1="125" x2="10" y2="155" stroke="#C5A55A" stroke-width="1"/>
  <!-- Windows - bottom -->
  <line x1="65" y1="192" x2="90" y2="192" stroke="#C5A55A" stroke-width="2"/>
  <line x1="65" y1="188" x2="90" y2="188" stroke="#C5A55A" stroke-width="1"/>
  <!-- Balcony -->
  <rect x="0" y="125" width="8" height="30" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="35" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="85" y="60" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="145" y="48" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="177" y="48" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="30" y="150" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="78" y="150" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="150" y="140" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },

  // ─────────────────────────────────────────────
  // 4+ ROOM APARTMENTS (2)
  // ─────────────────────────────────────────────
  {
    id: '4r-classic',
    name: 'Классическая',
    description: 'Четыре изолированные комнаты',
    rooms: 4,
    bathrooms: 'separate_2',
    kitchen_type: 'separate',
    area_range: { min: 95, max: 120 },
    tags: ['монолит', 'кирпич'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="5" y="5" width="190" height="190" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Main corridor -->
  <line x1="5" y1="80" x2="195" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="5" y1="120" x2="195" y2="120" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Top room dividers -->
  <line x1="100" y1="5" x2="100" y2="80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bottom room dividers -->
  <line x1="65" y1="120" x2="65" y2="195" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="130" y1="120" x2="130" y2="195" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Bathroom in corridor -->
  <line x1="40" y1="80" x2="40" y2="120" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="80" y1="80" x2="80" y2="120" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Fills -->
  <rect x="7" y="82" width="31" height="36" fill="rgba(123,45,62,0.08)"/>
  <rect x="42" y="82" width="36" height="36" fill="rgba(123,45,62,0.08)"/>
  <!-- Kitchen fill -->
  <rect x="102" y="7" width="91" height="71" fill="rgba(197,165,90,0.08)"/>
  <!-- Entry -->
  <rect x="110" y="118" width="22" height="4" fill="#F9F7F4"/>
  <!-- Windows -->
  <line x1="3" y1="25" x2="3" y2="55" stroke="#C5A55A" stroke-width="2"/>
  <line x1="7" y1="25" x2="7" y2="55" stroke="#C5A55A" stroke-width="1"/>
  <line x1="197" y1="25" x2="197" y2="55" stroke="#C5A55A" stroke-width="2"/>
  <line x1="193" y1="25" x2="193" y2="55" stroke="#C5A55A" stroke-width="1"/>
  <line x1="3" y1="140" x2="3" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="7" y1="140" x2="7" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <line x1="85" y1="197" x2="115" y2="197" stroke="#C5A55A" stroke-width="2"/>
  <line x1="85" y1="193" x2="115" y2="193" stroke="#C5A55A" stroke-width="1"/>
  <line x1="197" y1="140" x2="197" y2="175" stroke="#C5A55A" stroke-width="2"/>
  <line x1="193" y1="140" x2="193" y2="175" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="48" y="48" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="150" y="48" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="22" y="105" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Ванн</text>
  <text x="60" y="105" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Туал</text>
  <text x="33" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="97" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="163" y="162" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С3</text>
  <text x="150" y="105" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
  {
    id: '4r-master',
    name: 'С мастер-спальней',
    description: 'Мастер-спальня с собственным санузлом',
    rooms: 4,
    bathrooms: 'separate_2',
    kitchen_type: 'separate',
    area_range: { min: 100, max: 130 },
    tags: ['монолит', 'бизнес-класс', 'премиум'],
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Exterior walls -->
  <rect x="5" y="5" width="190" height="190" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Master bedroom area (top-left) -->
  <line x1="5" y1="90" x2="95" y2="90" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="95" y1="5" x2="95" y2="90" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Master ensuite -->
  <line x1="5" y1="55" x2="45" y2="55" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="45" y1="5" x2="45" y2="55" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="7" y="7" width="36" height="46" fill="rgba(123,45,62,0.08)"/>
  <!-- Master walk-in closet -->
  <line x1="65" y1="5" x2="65" y2="35" stroke="#8E8E93" stroke-width="2"/>
  <line x1="65" y1="35" x2="95" y2="35" stroke="#8E8E93" stroke-width="2"/>
  <!-- Kitchen area (top-right) -->
  <rect x="97" y="7" width="96" height="81" fill="rgba(197,165,90,0.08)"/>
  <line x1="95" y1="90" x2="195" y2="90" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Corridor -->
  <line x1="5" y1="130" x2="195" y2="130" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Guest bathroom in corridor -->
  <line x1="100" y1="90" x2="100" y2="130" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="7" y="92" width="91" height="36" fill="rgba(123,45,62,0.08)"/>
  <!-- Bottom rooms -->
  <line x1="70" y1="130" x2="70" y2="195" stroke="#1A1A1A" stroke-width="3"/>
  <line x1="135" y1="130" x2="135" y2="195" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Entry -->
  <rect x="120" y="128" width="22" height="4" fill="#F9F7F4"/>
  <!-- Windows -->
  <line x1="3" y1="60" x2="3" y2="85" stroke="#C5A55A" stroke-width="2"/>
  <line x1="7" y1="60" x2="7" y2="85" stroke="#C5A55A" stroke-width="1"/>
  <line x1="120" y1="3" x2="165" y2="3" stroke="#C5A55A" stroke-width="2"/>
  <line x1="120" y1="7" x2="165" y2="7" stroke="#C5A55A" stroke-width="1"/>
  <line x1="3" y1="150" x2="3" y2="180" stroke="#C5A55A" stroke-width="2"/>
  <line x1="7" y1="150" x2="7" y2="180" stroke="#C5A55A" stroke-width="1"/>
  <line x1="90" y1="197" x2="120" y2="197" stroke="#C5A55A" stroke-width="2"/>
  <line x1="90" y1="193" x2="120" y2="193" stroke="#C5A55A" stroke-width="1"/>
  <line x1="197" y1="150" x2="197" y2="180" stroke="#C5A55A" stroke-width="2"/>
  <line x1="193" y1="150" x2="193" y2="180" stroke="#C5A55A" stroke-width="1"/>
  <!-- Labels -->
  <text x="22" y="35" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">СУ</text>
  <text x="75" y="22" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Гард</text>
  <text x="65" y="70" font-size="8" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Мастер</text>
  <text x="145" y="55" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">К</text>
  <text x="50" y="115" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Гост. СУ</text>
  <text x="35" y="168" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С1</text>
  <text x="102" y="168" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">С2</text>
  <text x="165" y="168" font-size="9" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Г</text>
  <text x="150" y="115" font-size="7" fill="#8E8E93" text-anchor="middle" font-family="sans-serif">Пр</text>
</svg>`,
  },
];

/**
 * Filter layouts by room count, bathroom config, and kitchen type.
 * Smart matching: exact matches first, then partial matches for same room count.
 * Always returns at least all layouts for the given room count.
 */
export function filterLayouts(
  rooms: number,
  bathrooms?: string,
  kitchenType?: string,
): LayoutTemplate[] {
  // Get all layouts for this room count
  const roomMatches = LAYOUT_TEMPLATES.filter((l) => l.rooms === rooms);

  if (roomMatches.length === 0) return [];

  // Score each layout: +1 for bathroom match, +1 for kitchen match
  const scored = roomMatches.map((layout) => {
    let score = 0;
    if (bathrooms && layout.bathrooms === bathrooms) score += 1;
    if (kitchenType && layout.kitchen_type === kitchenType) score += 1;
    return { layout, score };
  });

  // Sort: exact matches first (score 2), partial (1), then rest (0)
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.layout);
}

/**
 * Find a layout template by its ID.
 */
export function getLayoutById(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((layout) => layout.id === id);
}
