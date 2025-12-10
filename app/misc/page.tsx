'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface MiscItem {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  caption?: string
  created_at: string
}

export default function MiscPage() {
  const [items, setItems] = useState<MiscItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const { user, isSuperUser } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('misc_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isSuperUser || !mediaUrl.trim()) return

    setUploading(true)
    try {
      const { error } = await supabase
        .from('misc_items')
        .insert({
          media_url: mediaUrl.trim(),
          media_type: mediaType,
          caption: caption.trim() || null,
          author_id: user.id,
        } as any)

      if (error) throw error

      setMediaUrl('')
      setCaption('')
      setShowUpload(false)
      loadItems()
    } catch (error) {
      console.error('Error uploading item:', error)
      alert('Failed to upload item')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold text-black">Misc</h1>
        {isSuperUser && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            {showUpload ? 'Cancel' : 'Add Item'}
          </button>
        )}
      </div>

      {showUpload && isSuperUser && (
        <form onSubmit={handleUpload} className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                className="w-full px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Media URL
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Add a caption..."
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      )}

      {items.length > 0 ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="break-inside-avoid mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {item.media_type === 'image' ? (
                <div className="relative w-full aspect-auto">
                  <Image
                    src={item.media_url}
                    alt={item.caption || 'Misc image'}
                    width={500}
                    height={500}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-video bg-black">
                  <video
                    src={item.media_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {item.caption && (
                <div className="p-3">
                  <p className="text-sm text-gray-600">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-lg">No items yet.</p>
      )}
    </div>
  )
}

