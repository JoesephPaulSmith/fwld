import type { UnitSystem } from '@/types';

const METERS_TO_FEET = 3.28084;

export function convertValue(
  value: number,
  fromUnit: 'meters' | 'feet',
  toSystem: UnitSystem
): number {
  if (toSystem === 'metric') {
    return fromUnit === 'meters' ? value : value / METERS_TO_FEET;
  } else {
    return fromUnit === 'feet' ? value : value * METERS_TO_FEET;
  }
}

export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

export function feetToMeters(feet: number): number {
  return feet / METERS_TO_FEET;
}

export function formatValue(
  value: number,
  unitSystem: UnitSystem,
  precision: number = 2
): string {
  const convertedValue = unitSystem === 'imperial'
    ? metersToFeet(value)
    : value;
  return convertedValue.toFixed(precision);
}

export function getUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'm (IGLD85)' : 'ft (IGLD85)';
}

export function getShortUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'm' : 'ft';
}
