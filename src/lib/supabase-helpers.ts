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
    console.log(`🔄 Updating menu ${id} with data:`, data)
    
    // First verify the menu exists
    const { data: existingMenu, error: checkError } = await supabase
      .from('menus')
      .select('id, name, stock_quantity')
      .eq('id', id)
      .single()
    
    if (checkError) {
      console.error(`❌ Menu ${id} not found:`, checkError)
      throw checkError
    }
    
    console.log(`📋 Current menu data:`, existingMenu)
    
    // Perform the update
    const result = await (supabase as AnySupabase)
      .from('menus')
      .update(data)
      .eq('id', id)
      .select() // Add select to get updated data back
    
    if (result.error) {
      console.error(`❌ Update failed for menu ${id}:`, result.error)
      throw result.error
    }
    
    console.log(`✅ Menu ${id} updated successfully:`, result.data)
    return result
  } catch (error) {
    console.error(`💥 Exception updating menu ${id}:`, error)
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

// Define the return type for the database function
type StockUpdateResult = {
  success: boolean;
  error?: string;
  menu_id?: number;
  old_stock?: number;
  new_stock?: number;
  quantity_subtracted?: number;
  available_stock?: number;
  requested?: number;
}

// Secure function to update menu stock using database function
export const updateMenuStock = async (menuId: number, quantityToSubtract: number): Promise<{
  data: StockUpdateResult | null;
  error: Error | null;
}> => {
  try {
    console.log(`🔄 Updating stock for menu ${menuId}, subtracting ${quantityToSubtract}`)
    
    const { data, error } = await (supabase as AnySupabase).rpc('update_menu_stock', {
      menu_id: menuId,
      quantity_to_subtract: quantityToSubtract
    })
    
    if (error) {
      console.error(`❌ Stock update RPC error:`, error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
    
    console.log(`📊 Stock update result:`, data)
    
    // Cast the data to our expected type
    const stockResult = data as StockUpdateResult
    
    if (stockResult && !stockResult.success) {
      return { data: stockResult, error: new Error(stockResult.error || 'Stock update failed') }
    }
    
    return { data: stockResult, error: null }
  } catch (error: unknown) {
    console.error(`💥 Exception in updateMenuStock:`, error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}