-- Create tasks table with all necessary fields for cost tracking
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    description TEXT,
    task_date DATE NOT NULL,
    batch_sku VARCHAR(50),
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    labor_hours DECIMAL(5, 2),
    labor_rate DECIMAL(10, 2),
    consumables_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (COALESCE(labor_cost, 0) + COALESCE(consumables_cost, 0)) STORED,
    status VARCHAR(50) DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed')),
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_consumables table for tracking consumables used in tasks
CREATE TABLE IF NOT EXISTS public.task_consumables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    consumable_sku VARCHAR(50) NOT NULL,
    consumable_name VARCHAR(255) NOT NULL,
    quantity_used DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_batch_sku ON public.tasks(batch_sku);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_consumables_task_id ON public.task_consumables(task_id);
CREATE INDEX IF NOT EXISTS idx_task_consumables_sku ON public.task_consumables(consumable_sku);

-- Add foreign key constraint to link tasks with inventory batches
ALTER TABLE IF EXISTS public.tasks 
ADD CONSTRAINT fk_tasks_batch_sku 
FOREIGN KEY (batch_sku) REFERENCES public.inventory(sku) ON DELETE SET NULL;

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.tasks IS 'Tasks performed on plant batches with cost tracking';
COMMENT ON TABLE public.task_consumables IS 'Consumables used in each task';
COMMENT ON COLUMN public.tasks.total_cost IS 'Automatically calculated as labor_cost + consumables_cost';
COMMENT ON COLUMN public.task_consumables.total_cost IS 'Automatically calculated as quantity_used * unit_cost';

-- Insert sample data
INSERT INTO public.tasks (task_name, task_type, description, task_date, batch_sku, labor_cost, labor_hours, labor_rate, consumables_cost, status, assigned_to) VALUES
('Watering Mango Seedlings', 'Watering', 'Regular watering of mango seedlings in section A', '2024-01-15', 'MAN01', 500, 2, 250, 0, 'Completed', 'John Doe'),
('Fertilizing Avocado Batch', 'Fertilizing', 'Applied organic fertilizer to avocado seedlings', '2024-01-14', 'AVA01', 750, 3, 250, 2500, 'Completed', 'Jane Smith')
ON CONFLICT (id) DO NOTHING;
