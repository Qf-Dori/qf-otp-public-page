// handles importing scss as modules
declare module '*.scss' {
    const content: string
    export default content
}

// Cloudflare Turnstile — loaded via <script> in index.html with ?render=explicit
interface TurnstileRenderOptions {
    sitekey: string
    callback?: (token: string) => void
    'error-callback'?: (errorCode: string) => void
    'expired-callback'?: () => void
    theme?: 'auto' | 'light' | 'dark'
    size?: 'normal' | 'flexible' | 'compact'
    execution?: 'render' | 'execute'
    appearance?: 'always' | 'execute' | 'interaction-only'
}

interface Turnstile {
    render(container: string | HTMLElement, options: TurnstileRenderOptions): string
    reset(widgetId: string): void
    remove(widgetId: string): void
    getResponse(widgetId: string): string | undefined
    isExpired(widgetId: string): boolean
    execute(container: string | HTMLElement): void
    ready(callback: () => void): void
}

interface Window {
    turnstile?: Turnstile
}
