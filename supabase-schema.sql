-- Create tables for the restaurant ordering system

-- Tables table
CREATE TABLE IF NOT EXISTS public.tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu items table
CREATE TABLE IF NOT EXISTS public.menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES public.tables(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES public.menus(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Users table for admin/barista authentication
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT,
    role VARCHAR(20) DEFAULT 'barista' CHECK (role IN ('admin', 'barista')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_id ON public.order_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menus_category ON public.menus(category);
CREATE INDEX IF NOT EXISTS idx_menus_is_available ON public.menus(is_available);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to menu items and tables
CREATE POLICY "Allow public read access to tables" ON public.tables
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to available menus" ON public.menus
    FOR SELECT USING (is_available = true);

-- Create policies for orders (customers can create and read their orders)
CREATE POLICY "Allow public insert on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on orders" ON public.orders
    FOR SELECT USING (true);

-- Create policies for order items
CREATE POLICY "Allow public insert on order_items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on order_items" ON public.order_items
    FOR SELECT USING (true);

-- Admin/Barista policies - full access when authenticated
CREATE POLICY "Allow authenticated users full access to tables" ON public.tables
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to menus" ON public.menus
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to orders" ON public.orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to order_items" ON public.order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update menu stock (secure function for public use)
CREATE OR REPLACE FUNCTION update_menu_stock(
    menu_id integer,
    quantity_to_subtract integer
)
RETURNS json AS $$
DECLARE
    current_stock integer;
    new_stock integer;
    menu_record record;
BEGIN
    -- Get current menu data
    SELECT * INTO menu_record FROM public.menus WHERE id = menu_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Menu not found');
    END IF;
    
    current_stock := COALESCE(menu_record.stock_quantity, 0);
    
    -- Check if there's enough stock
    IF current_stock < quantity_to_subtract THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Insufficient stock',
            'available_stock', current_stock,
            'requested', quantity_to_subtract
        );
    END IF;
    
    -- Calculate new stock
    new_stock := GREATEST(0, current_stock - quantity_to_subtract);
    
    -- Update the stock
    UPDATE public.menus 
    SET stock_quantity = new_stock, updated_at = NOW()
    WHERE id = menu_id;
    
    RETURN json_build_object(
        'success', true,
        'menu_id', menu_id,
        'old_stock', current_stock,
        'new_stock', new_stock,
        'quantity_subtracted', quantity_to_subtract
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION update_menu_stock(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION update_menu_stock(integer, integer) TO authenticated;

-- Function to restore menu stock (for cancelled orders)
CREATE OR REPLACE FUNCTION restore_menu_stock(
    menu_id integer,
    quantity_to_add integer
)
RETURNS json AS $$
DECLARE
    current_stock integer;
    new_stock integer;
    menu_record record;
BEGIN
    -- Get current menu data
    SELECT * INTO menu_record FROM public.menus WHERE id = menu_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Menu not found');
    END IF;
    
    current_stock := COALESCE(menu_record.stock_quantity, 0);
    
    -- Calculate new stock (add the quantity back)
    new_stock := current_stock + quantity_to_add;
    
    -- Update the stock
    UPDATE public.menus 
    SET stock_quantity = new_stock, updated_at = NOW()
    WHERE id = menu_id;
    
    RETURN json_build_object(
        'success', true,
        'menu_id', menu_id,
        'old_stock', current_stock,
        'new_stock', new_stock,
        'quantity_added', quantity_to_add
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION restore_menu_stock(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION restore_menu_stock(integer, integer) TO authenticated;

-- Triggers for updated_at
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.tables (table_number, qr_code) VALUES
(1, 'table_1_qr_code'),
(2, 'table_2_qr_code'),
(3, 'table_3_qr_code'),
(4, 'table_4_qr_code'),
(5, 'table_5_qr_code')
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO public.menus (name, description, price, category, stock_quantity) VALUES
('Espresso', 'Rich and bold espresso shot', 15000, 'Kopi', 50),
('Cappuccino', 'Classic cappuccino with steamed milk', 25000, 'Kopi', 50),
('Latte', 'Smooth latte with perfect milk foam', 28000, 'Kopi', 50),
('Americano', 'Black coffee with hot water', 18000, 'Kopi', 50),
('Nasi Goreng Spesial', 'Fried rice with chicken and vegetables', 35000, 'Makanan', 20),
('Mie Ayam', 'Chicken noodles with savory broth', 25000, 'Makanan', 20),
('Sandwich Club', 'Triple layer sandwich with chicken', 32000, 'Makanan', 15),
('Es Teh Manis', 'Sweet iced tea', 8000, 'Minuman', 100),
('Jus Jeruk', 'Fresh orange juice', 15000, 'Minuman', 30),
('Smoothie Mangga', 'Mango smoothie with fresh fruit', 22000, 'Minuman', 25)
ON CONFLICT DO NOTHING;