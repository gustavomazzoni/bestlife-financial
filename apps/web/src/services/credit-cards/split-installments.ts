/**
 * Splits a total amount into `count` installments, exact to the cent.
 * Any leftover cent(s) from integer division land on the last installment
 * so the parts always sum exactly to `total`.
 */
export function splitIntoInstallments(total: number, count: number): number[] {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  return Array.from({ length: count }, (_, i) => {
    const cents = i === count - 1 ? baseCents + remainderCents : baseCents;
    return cents / 100;
  });
}
