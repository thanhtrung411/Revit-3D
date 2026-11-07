export function wallOpacity(distance, referenceDistance, enabled = true) {
  if (!enabled) return 1;
  const t = Math.min(1, Math.max(0, (distance / referenceDistance - 0.30) / 0.50));
  return Math.max(.18, t * t * (3 - 2 * t));
}
export function floorOffset(index, amount, spacing) {
  return index * amount * spacing;
}
export function kindOf(category, name = '') {
  category = category.toUpperCase();
  if (/CURTAIN PANELS/i.test(name)) return 'glass';
  if (/SPECIALTY EQUIPMENT/i.test(name)) return 'furniture';
  if (/ROOF/.test(category)) return 'roof';
  if (/WINDOW|CURTAIN/.test(category)) return 'glass';
  if (/WALL|DOOR|COVERING/.test(category)) return 'wall';
  if (/SLAB/.test(category)) return 'floor';
  if (/FURNISH|FURNITURE|SANITARY|APPLIANCE/.test(category)) return 'furniture';
  if (/STAIR|RAILING|RAMP/.test(category)) return 'stair';
  return 'structure';
}
export function slabDisplayFloor(sourceFloor, top, thickness, wallBases) {
  const closest = wallBases.reduce((best, floor) => Math.abs(floor.base - top) < Math.abs(best.base - top) ? floor : best, { id: sourceFloor, base: Infinity });
  const source = wallBases.find(f => f.id === sourceFloor);
  const tolerance = Math.max(thickness, .1);
  return source && closest.id !== sourceFloor && Math.abs(closest.base - top) <= tolerance && Math.abs(source.base - top) > tolerance ? closest.id : sourceFloor;
}
