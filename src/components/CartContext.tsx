'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Database } from '@/lib/database.types'

type Menu = Database['public']['Tables']['menus']['Row']

export interface CartItem {
  menu: Menu
  quantity: number
  specialNotes?: string
}

interface CartState {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menu: Menu; quantity: number; specialNotes?: string } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { menuId: number; quantity: number } }
  | { type: 'UPDATE_NOTES'; payload: { menuId: number; notes: string } }
  | { type: 'CLEAR_CART' }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.menu.id === action.payload.menu.id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.menu.id === action.payload.menu.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
        return {
          items: updatedItems,
          total: calculateTotal(updatedItems)
        }
      }
      
      const newItems = [...state.items, {
        menu: action.payload.menu,
        quantity: action.payload.quantity,
        specialNotes: action.payload.specialNotes
      }]
      
      return {
        items: newItems,
        total: calculateTotal(newItems)
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.menu.id !== action.payload)
      return {
        items: newItems,
        total: calculateTotal(newItems)
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.menu.id === action.payload.menuId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
      
      return {
        items: newItems,
        total: calculateTotal(newItems)
      }
    }
    
    case 'UPDATE_NOTES': {
      const newItems = state.items.map(item =>
        item.menu.id === action.payload.menuId
          ? { ...item, specialNotes: action.payload.notes }
          : item
      )
      
      return {
        items: newItems,
        total: calculateTotal(newItems)
      }
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0 }
    
    default:
      return state
  }
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.menu.price * item.quantity), 0)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })
  
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}