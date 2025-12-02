'use client'

import { useState, useEffect, useRef } from 'react'
import { useGooglePlaces, ParsedAddress } from '@/lib/hooks/useGooglePlaces'

interface AddressAutocompleteProps {
  label?: string
  placeholder?: string
  onSelect: (address: ParsedAddress) => void
  initialValue?: string
  error?: string
  required?: boolean
  className?: string
}

export function AddressAutocomplete({
  label,
  placeholder = 'הזן כתובת...',
  onSelect,
  initialValue = '',
  error,
  required = false,
  className = '',
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  const {
    predictions,
    loading,
    error: apiError,
    fetchPredictions,
    selectPlace,
    clearPredictions,
  } = useGooglePlaces({
    onSelect: (address) => {
      isSelectingRef.current = true
      setInputValue(address.formattedAddress)
      setIsOpen(false)
      onSelect(address)
      // Reset the flag after a short delay
      setTimeout(() => {
        isSelectingRef.current = false
      }, 100)
    },
  })

  // Debounced search
  useEffect(() => {
    // Don't fetch if we're in the middle of selecting an address
    if (isSelectingRef.current) {
      return
    }

    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        fetchPredictions(inputValue)
        setIsOpen(true)
      } else {
        clearPredictions()
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, fetchPredictions, clearPredictions])

  // Handle clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelect(predictions[selectedIndex].place_id)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelect = async (placeId: string) => {
    try {
      await selectPlace(placeId)
      setSelectedIndex(-1)
    } catch (err) {
      console.error('Error selecting place:', err)
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-status-danger"> *</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 rounded-lg border-2 border-gray-200
            focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-orange-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-lg
            ${error || apiError ? 'border-status-danger' : ''}
          `}
          dir="auto"
        />

        {loading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-accent-orange border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border-2 border-gray-200 max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelect(prediction.placeId)}
              className={`
                w-full px-4 py-3 text-right hover:bg-gray-50
                border-b border-gray-100 last:border-b-0
                transition-colors
                ${index === selectedIndex ? 'bg-orange-50' : ''}
              `}
            >
              <div className="font-medium text-gray-900">
                {prediction.structuredFormat.mainText.text}
              </div>
              <div className="text-sm text-gray-500">
                {prediction.structuredFormat.secondaryText.text}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {(error || apiError) && (
        <p className="mt-2 text-sm text-status-danger">{error || apiError}</p>
      )}

      {/* Helper Text */}
      {!error && !apiError && (
        <p className="mt-2 text-sm text-gray-500">
          התחל להקליד כתובת בישראל
        </p>
      )}
    </div>
  )
}
