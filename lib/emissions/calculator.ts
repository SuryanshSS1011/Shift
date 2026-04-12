export function computeCO2Saved(factorKgPerUnit: number, quantity: number): number {
  return factorKgPerUnit * quantity
}

export function formatCO2(kg: number): string {
  if (kg < 0.1) {
    return `${(kg * 1000).toFixed(0)} g`
  }
  return `${kg.toFixed(1)} kg`
}

export function annualizedSavings(dailyKg: number): number {
  return dailyKg * 365
}
