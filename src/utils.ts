import React, {
  useEffect,
  useRef,
} from 'react'

export function useCombinedRefs<T>(
  refs: (((instance: T | null) => void) | React.MutableRefObject<T | undefined | null> | null)[],
) {
  const targetRef = useRef<T>(null)

  useEffect(() => {
    refs.forEach(ref => {
      if (!ref) return

      if (typeof ref === 'function') {
        ref(targetRef.current || null)
      } else {
        ref.current = targetRef.current
      }
    })
  }, [refs])

  return targetRef
}
