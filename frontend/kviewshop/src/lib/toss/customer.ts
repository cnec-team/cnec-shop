export function resolveCustomerName(
  brand: { companyName?: string | null; brandName?: string | null; representativeName?: string | null },
  user: { name?: string | null }
): string {
  return (
    brand.companyName?.trim() ||
    brand.brandName?.trim() ||
    brand.representativeName?.trim() ||
    user.name ||
    '크넥샵 브랜드'
  )
}
