import React, { useRef, useEffect, useCallback } from 'react'

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type CloudflareTurnstileProps = {
    siteKey: string
    onToken: (token: string) => void
    onError?: (errorCode: string) => void
    onExpired?: () => void
}

/*
 * Reads the CSP [Content Security Policy] - 
 * token generated per inline scripts or HTTP request 
 * nonce from the page's existing scripts.
 * ServiceNow injects a nonce via <sdk:now-ux-globals> — every allowed
 * <script> tag on the page carries it. We grab it from any script that
 * has one and apply it to the Turnstile <script> we create dynamically.
 */
function getPageNonce(): string | undefined {
    const scripts = document.querySelectorAll('script[nonce]')
    for (let i = 0; i < scripts.length; i++) {
        // .nonce property is the canonical way to read it (getAttribute
        // may return empty on some browsers after page load for security)
        const n = (scripts[i] as HTMLScriptElement).nonce
        if (n) return n
    }
    return undefined
}

/**
 * Dynamically injects the Turnstile script with the CSP nonce.
 * Returns a promise that resolves once window.turnstile is available.
 */
function loadTurnstileScript(): Promise<void> {
    // Already loaded or currently loading
    if (window.turnstile) return Promise.resolve()
    if (document.querySelector(`script[src^="${TURNSTILE_SRC}"]`)) {
        // Script tag exists but hasn't finished — wait for it
        return new Promise((resolve) => {
            const poll = setInterval(() => {
                if (window.turnstile) { clearInterval(poll); resolve() }
            }, 100)
            setTimeout(() => clearInterval(poll), 10000)
        })
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = TURNSTILE_SRC
        script.async = false

        // Apply the ServiceNow CSP nonce so the browser allows this script
        const nonce = getPageNonce()
        if (nonce) script.nonce = nonce
        
        script.onload = () => {
            // turnstile global may take a tick to initialize after script loads
            const poll = setInterval(() => {
                if (window.turnstile) { clearInterval(poll); resolve() }
            }, 50)
            setTimeout(() => { clearInterval(poll); reject(new Error('Turnstile init timeout')) }, 5000)
        }
        script.onerror = () => reject(new Error('Failed to load Turnstile script'))

        document.head.appendChild(script)
    })
}

export function CloudflareTurnstile({ siteKey, onToken, onError, onExpired }: CloudflareTurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)

    // Stable callback refs so Turnstile doesn't re-render when parent re-renders
    const onTokenRef = useRef(onToken)
    const onErrorRef = useRef(onError)
    const onExpiredRef = useRef(onExpired)
    useEffect(() => { onTokenRef.current = onToken }, [onToken])
    useEffect(() => { onErrorRef.current = onError }, [onError])
    useEffect(() => { onExpiredRef.current = onExpired }, [onExpired])

    const renderWidget = useCallback(() => {
        if (!containerRef.current || widgetIdRef.current || !window.turnstile) return

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => { onTokenRef.current(token) },
            'error-callback': (errorCode: string) => { onErrorRef.current?.(errorCode) },
            'expired-callback': () => { onExpiredRef.current?.() },
            theme: 'light',
            size: 'flexible',
        })
    }, [siteKey])

    useEffect(() => {
        let cancelled = false

        loadTurnstileScript()
            .then(() => {
                if (!cancelled && window.turnstile) {
                    window.turnstile.ready(() => renderWidget())
                }
            })
            .catch((err) => {
                console.error('CloudflareTurnstile:', err.message)
            })

        return () => {
            cancelled = true
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }
        }
    }, [renderWidget])

    return <div ref={containerRef} style={{ marginTop: '0.75rem' }} />
}
