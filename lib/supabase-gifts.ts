import { supabase, OpenedGift } from './supabase'

/**
 * Obtener todos los regalos abiertos
 */
export async function getOpenedGifts(): Promise<Set<number>> {
  try {
    const { data, error } = await supabase
      .from('opened_gifts')
      .select('gift_id')
      .order('opened_at', { ascending: true })

    if (error) {
      console.error('Error al obtener regalos abiertos:', error)
      return new Set()
    }

    // Convertir array de objetos a Set de IDs
    const giftIds = data?.map(item => item.gift_id) || []
    return new Set(giftIds)
  } catch (error) {
    console.error('Error inesperado al obtener regalos abiertos:', error)
    return new Set()
  }
}

/**
 * Marcar un regalo como abierto
 */
export async function openGift(giftId: number): Promise<boolean> {
  try {
    // Usar upsert para insertar o actualizar si ya existe
    const { error } = await supabase
      .from('opened_gifts')
      .upsert(
        {
          gift_id: giftId,
          opened_at: new Date().toISOString()
        },
        {
          onConflict: 'gift_id' // Si ya existe, actualizar
        }
      )

    if (error) {
      console.error('Error al abrir regalo:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error inesperado al abrir regalo:', error)
    return false
  }
}

/**
 * Obtener la última fecha en que se abrió un regalo
 */
export async function getLastGiftOpenedDate(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('opened_gifts')
      .select('opened_at')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // Si no hay registros, retornar null
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error al obtener última fecha:', error)
      return null
    }

    return data?.opened_at || null
  } catch (error) {
    console.error('Error inesperado al obtener última fecha:', error)
    return null
  }
}

/**
 * Suscribirse a cambios en regalos abiertos (para sincronización en tiempo real)
 */
export function subscribeToOpenedGifts(
  callback: (giftIds: Set<number>) => void
) {
  const channel = supabase
    .channel('opened_gifts_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'opened_gifts'
      },
      async () => {
        // Cuando hay cambios, obtener la lista actualizada
        const giftIds = await getOpenedGifts()
        callback(giftIds)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

