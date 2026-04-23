'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { buildBreadcrumbs, type BreadcrumbItem as BreadcrumbItemType } from '@/lib/admin-routes'
import { Fragment } from 'react'

interface AdminBreadcrumbProps {
  /** 수동 모드: items를 직접 전달 (동적 세그먼트용) */
  items?: BreadcrumbItemType[]
}

export function AdminBreadcrumb({ items: manualItems }: AdminBreadcrumbProps) {
  const pathname = usePathname()
  const items = manualItems || buildBreadcrumbs(pathname)

  if (items.length === 0) return null

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {item.href && i < items.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href}
                    className="text-stone-500 transition-colors hover:text-stone-900"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="font-medium text-stone-900">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
