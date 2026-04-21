'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  deliveryId: string
  onSubmit?: () => void
}

export function ReviewForm({ deliveryId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          rating,
          comment: comment || null,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        onSubmit?.()
      } else {
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="card text-center py-8">
        <p className="text-lg font-semibold text-primary mb-2">Thank you for your review!</p>
        <p className="text-secondary text-sm">Your feedback helps us improve our service.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="font-semibold text-primary mb-4">Leave a Review</h3>

      <div className="mb-6">
        <p className="text-sm font-medium text-secondary mb-3">How would you rate this delivery?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoverRating || rating)
                    ? 'fill-accent-gold text-accent-gold'
                    : 'text-secondary/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="comment" className="text-sm font-medium text-secondary block mb-2">
          Comments (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience..."
          rows={3}
          maxLength={500}
          className="input-base w-full"
        />
        <p className="text-xs text-secondary mt-1">{comment.length}/500</p>
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="btn-primary w-full"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
