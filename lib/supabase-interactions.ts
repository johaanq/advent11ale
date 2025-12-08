import { supabase } from './supabase'

// ============= LIKES =============

export async function toggleLike(giftId: number): Promise<boolean> {
  try {
    // Primero verificar si ya hay un like
    const { data: existingLike, error: fetchError } = await supabase
      .from('gift_likes')
      .select('*')
      .eq('gift_id', giftId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking like:', fetchError)
      return false
    }

    if (existingLike) {
      // Si existe, actualizar el estado
      const { error: updateError } = await supabase
        .from('gift_likes')
        .update({ liked: !existingLike.liked })
        .eq('gift_id', giftId)

      if (updateError) {
        console.error('Error updating like:', updateError)
        return false
      }
      return !existingLike.liked
    } else {
      // Si no existe, crear nuevo
      const { error: insertError } = await supabase
        .from('gift_likes')
        .insert({ gift_id: giftId, liked: true })

      if (insertError) {
        console.error('Error inserting like:', insertError)
        return false
      }
      return true
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return false
  }
}

export async function getLikeStatus(giftId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('gift_likes')
      .select('liked')
      .eq('gift_id', giftId)
      .maybeSingle()

    if (error) {
      console.error('Error getting like status:', error)
      return false
    }

    return data?.liked || false
  } catch (error) {
    console.error('Error getting like status:', error)
    return false
  }
}

// ============= COMENTARIOS =============

export interface Comment {
  id: string
  gift_id: number
  comment: string
  author_name: string
  created_at: string
}

export async function getComments(giftId: number): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('gift_comments')
      .select('*')
      .eq('gift_id', giftId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting comments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting comments:', error)
    return []
  }
}

export async function addComment(giftId: number, comment: string, authorName: string = 'Ale'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gift_comments')
      .insert({
        gift_id: giftId,
        comment: comment,
        author_name: authorName
      })

    if (error) {
      console.error('Error adding comment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error adding comment:', error)
    return false
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gift_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting comment:', error)
    return false
  }
}

// Suscribirse a cambios en comentarios en tiempo real
export function subscribeToComments(giftId: number, callback: (comments: Comment[]) => void) {
  const channel = supabase
    .channel(`comments-${giftId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'gift_comments',
        filter: `gift_id=eq.${giftId}`
      },
      async () => {
        // Cuando hay un cambio, obtener todos los comentarios actualizados
        const comments = await getComments(giftId)
        callback(comments)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Suscribirse a cambios en likes en tiempo real
export function subscribeToLikes(giftId: number, callback: (liked: boolean) => void) {
  const channel = supabase
    .channel(`likes-${giftId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'gift_likes',
        filter: `gift_id=eq.${giftId}`
      },
      async () => {
        // Cuando hay un cambio, obtener el estado actualizado
        const liked = await getLikeStatus(giftId)
        callback(liked)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

