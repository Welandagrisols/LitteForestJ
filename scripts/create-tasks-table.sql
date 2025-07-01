
-- Create tasks table for tracking nursery activities and costs
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_name VARCHAR(255) NOT NULL,
  task_type VARCHAR(100) NOT NULL, -- e.g., "Watering", "Fertilizing", "Pruning", "Planting", "Transplanting"
  description TEXT,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  batch_sku VARCHAR(100), -- Reference to inventory SKU for batch tracking
  labor_cost DECIMAL(10, 2) DEFAULT 0,
  labor_hours DECIMAL(5, 2) DEFAULT 0,
  labor_rate DECIMAL(10, 2) DEFAULT 0, -- Cost per hour
  consumables_cost DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (labor_cost + consumables_cost) STORED,
  status VARCHAR(50) DEFAULT 'Completed', -- "Planned", "In Progress", "Completed"
  assigned_to VARCHAR(255), -- Who performed the task
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_consumables table to track consumables used in each task
CREATE TABLE IF NOT EXISTS public.task_consumables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  consumable_sku VARCHAR(100) NOT NULL, -- Reference to inventory SKU
  consumable_name VARCHAR(255) NOT NULL,
  quantity_used DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_batch_sku ON public.tasks(batch_sku);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_task_consumables_task_id ON public.task_consumables(task_id);
CREATE INDEX IF NOT EXISTS idx_task_consumables_consumable_sku ON public.task_consumables(consumable_sku);

-- Add comments
COMMENT ON TABLE public.tasks IS 'Tracks nursery activities and their associated costs';
COMMENT ON TABLE public.task_consumables IS 'Tracks consumables used in each task';
COMMENT ON COLUMN public.tasks.batch_sku IS 'Links task to specific inventory batch (e.g., MAN01)';
COMMENT ON COLUMN public.tasks.labor_cost IS 'Total labor cost for the task';
COMMENT ON COLUMN public.tasks.consumables_cost IS 'Total cost of consumables used';
COMMENT ON COLUMN public.tasks.total_cost IS 'Automatically calculated total cost (labor + consumables)';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
