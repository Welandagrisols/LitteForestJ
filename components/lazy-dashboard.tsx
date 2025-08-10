
'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from './loading-spinner'

const DashboardTab = dynamic(() => import('./dashboard-tab').then(mod => ({ default: mod.DashboardTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const InventoryTab = dynamic(() => import('./inventory-tab').then(mod => ({ default: mod.InventoryTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const SalesTab = dynamic(() => import('./sales-tab').then(mod => ({ default: mod.SalesTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const CustomersTab = dynamic(() => import('./customers-tab').then(mod => ({ default: mod.CustomersTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const ReportsTab = dynamic(() => import('./reports-tab').then(mod => ({ default: mod.ReportsTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const TasksTab = dynamic(() => import('./tasks-tab').then(mod => ({ default: mod.TasksTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const OpsTab = dynamic(() => import('./ops-tab').then(mod => ({ default: mod.OpsTab })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

export {
  DashboardTab,
  InventoryTab,
  SalesTab,
  CustomersTab,
  ReportsTab,
  TasksTab,
  OpsTab
}
