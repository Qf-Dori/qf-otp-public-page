import React, { useState, useEffect } from 'react'
import { CloudflareTurnstile } from './CloudflareTurnstile'
const OTP_TIMER = 10 * 60 // 10 minutes in seconds
const RESEND_DELAY = 60      // seconds before resend is allowed

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

type VerificationFormProps = {
    nonce: string
    loading: boolean
    error: string
    onRequestOtp: (email: string, turnstileToken: string) => void
    onResendOtp: (email: string) => void
    getSiteKey: () => Promise<string>
    handleVerifyOtp: (otp: string) => void
}
export function VerificationForm({ nonce, loading, error, onRequestOtp, onResendOtp, handleVerifyOtp, getSiteKey }: VerificationFormProps) {

    const [email, setEmail] = useState<string>('')
    const [otp, setOtp] = useState<string>('')
    const [countdown, setCountdown] = useState<number>(OTP_TIMER)
    const [resendCooldown, setResendCooldown] = useState<number>(0)
    const [hasAttempted, setHasAttempted] = useState<boolean>(false)

    // Turnstile state
    const [siteKey, setSiteKey] = useState<string>('')
    const [turnstileToken, setTurnstileToken] = useState<string>('')

    useEffect(() => {
        onGetSiteKey()
    }, [getSiteKey])

    const onGetSiteKey = async () => {
        try {
            const key = await getSiteKey()
            setSiteKey(key)
        } catch (e) {
            console.error("Failed to fetch site key:", e)
        }
    }

    // Start OTP expiry countdown when nonce arrives, reset when nonce clears
    useEffect(() => {
        if (!nonce) {
            setCountdown(OTP_TIMER)
            return
        }
        setCountdown(OTP_TIMER)
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [nonce])

    // Start 60s resend cooldown whenever a code is sent (initial or resend)
    useEffect(() => {
        if (!nonce) return
        setResendCooldown(RESEND_DELAY)
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [nonce])

    const handleSubmitEmail = (e: React.SyntheticEvent) => {
        e.preventDefault()
        onRequestOtp(email, turnstileToken)
    }

    const handleResend = () => {
        setOtp('')
        onResendOtp(email)
    }

    const handleVerify = (e: React.SyntheticEvent) => {
        e.preventDefault()
        setHasAttempted(true)
        handleVerifyOtp(otp)
    }

  
    return (
        <div className="verification-card">
            <div className="logo-placeholder">QF</div>

            <p className="step-label">
                {!nonce ? 'Step 1 of 2 — Identify Yourself' : 'Step 2 of 2 — Enter Verification Code'}
            </p>

            <h2>Welcome</h2>
            <p className="greeting">
                {!nonce
                    ? 'Your feedback helps us maintain the highest product quality. Please enter your email address to receive a verification code before submitting your complaint.'
                    : "We've sent a 6-digit code to your email. Enter it below to access the complaint form."}
            </p>

            {!nonce ? (
                <form onSubmit={handleSubmitEmail}>
                    <div className="form-group">
                        <label htmlFor="email-input">Email address</label>
                        <input
                            id="email-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={error ? 'input--error' : ''}
                            autoComplete="email"
                            required
                        />
                        {error && <small className="input-error">{error}</small>}
                    </div>
                    {siteKey && (
                        <CloudflareTurnstile
                            siteKey={siteKey}
                            onToken={setTurnstileToken}
                            onError={(err) => { throw new Error("Turnstile error: " + err) }}
                            onExpired={() => setTurnstileToken('')}
                        />
                    )}
                    <button className="btn-primary" type="submit" disabled={loading || !email || !turnstileToken}>
                        {loading ? 'Sending…' : 'Send Verification Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify}>
                    <div className="otp-sent-banner">
                        Code sent to <strong>{email}</strong>
                        <br />
                        Check your inbox and enter the 6-digit code below.
                    </div>

                    <div className={`countdown${countdown <= 60 ? ' countdown--urgent' : ''}`}>
                        {countdown > 0
                            ? `⏱ Expires in ${formatTime(countdown)}`
                            : '⚠ Code expired'}
                    </div>

                    {countdown === 0 ? (
                        <>
                            <small className="input-error" style={{ display: 'block', textAlign: 'center' }}>
                                This code has expired.
                            </small>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleResend}
                                disabled={loading}
                            >
                                {loading ? 'Sending…' : 'Request New Code'}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="otp-input">Verification code</label>
                                <input
                                    id="otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    className={`otp-input${error ? ' input--error' : ''}`}
                                    autoComplete="one-time-code"
                                    required
                                />
                                {error && <small className="input-error">{error}</small>}
                            </div>
                            <button className="btn-primary" type="submit" disabled={otp.length !== 6 || loading}>
                                {loading ? 'Verifying…' : 'Verify Code'}
                            </button>
                            {hasAttempted && (
                                <p className="resend-link">
                                    {resendCooldown > 0 || loading
                                        ? <span className="resend-link--disabled">Resend in {resendCooldown}s</span>
                                        : <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }}>Resend Code</a>
                                    }
                                </p>
                            )}

                        </>
                    )}
                </form>
                
            )}
        </div>
    )
}
