import { supabase } from './supabase'

// Helper functions to work around Supabase type inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export const updateMenu = async (id: number, data: {
  name?: string;
  description?: string | null;
  price?: number;
  category?: string;
  stock_quantity?: number | null;
  is_available?: boolean;
  image_url?: string | null;
  updated_at?: string;
}) => {
  try {
    console.log(`Updating menu ${id} with data:`, data)
    const result = await (supabase as AnySupabase)
      .from('menus')
      .update(data)
      .eq('id', id)
    
    console.log(`Update result for menu ${id}:`, result)
    return result
  } catch (error) {
    console.error(`Error updating menu ${id}:`, error)
    throw error
  }
}

export const insertMenu = async (data: {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  stock_quantity?: number | null;
  is_available?: boolean;
  image_url?: string | null;
}) => {
  return await (supabase as AnySupabase)
    .from('menus')
    .insert(data)
}

export const updateOrder = async (id: number, data: {
  status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  updated_at?: string;
}) => {
  return await (supabase as AnySupabase)
    .from('orders')
    .update(data)
    .eq('id', id)
}

export const insertTable = async (data: {
  table_number: number;
  qr_code: string;
  is_active?: boolean;
}) => {
  return await (supabase as AnySupabase)
    .from('tables')
    .insert([data])
    .select()
    .single()
}

export const updateTable = async (id: number, data: {
  qr_code?: string;
  is_active?: boolean;
  updated_at?: string;
}) => {
  return await (supabase as AnySupabase)
    .from('tables')
    .update(data)
    .eq('id', id)
}

export const insertOrder = async (data: {
  table_id: number;
  total_amount: number;
  special_notes?: string | null;
  status?: string;
}) => {
  return await (supabase as AnySupabase)
    .from('orders')
    .insert(data)
    .select()
    .single()
}

export const insertOrderItems = async (items: Array<{
  order_id: number;
  menu_id: number;
  quantity: number;
  price: number;
  special_notes?: string | null;
}>) => {
  return await (supabase as AnySupabase)
    .from('order_items')
    .insert(items)
}