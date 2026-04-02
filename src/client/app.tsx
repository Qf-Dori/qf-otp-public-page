import React, { useState } from 'react'
import { OtpService } from './services/otpService'
import { getTurnstileSiteKey } from './services/turnstileService'
import { VerificationForm } from './components/VerificationForm'
import './app.css'
import { ComplaintForm } from './components/ComplaintForm'
import { cmpForm } from './types/types'

const Step = {
    VERIFY: 'verify',
    FORM: 'form',
}

 

export default function App() {
    const [step, setStep]         = useState<string>(Step.VERIFY)
    const [email, setEmail]       = useState<string>('')
    const [nonce, setNonce]       = useState<string>('')
    const [formFields, setFormFields] = useState<cmpForm>({
        last_name: '',
        phone_number: '',
        _t: new Date().getTime(),

    })
    const [error, setError]       = useState<string>('')
    const [loading, setLoading]   = useState<boolean>(false)

    const handleRequestOtp = async (userEmail: string, turnstileToken: string) => {
        setError('')
        setLoading(true)
        try {
            const serverNonce = await OtpService.requestOtp(userEmail, false, turnstileToken)
            setEmail(userEmail)
            setNonce(serverNonce)
        } catch (err: any) {
            setError(err.message || 'Could not send code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async (userEmail: string) => {
        setError('')
        setLoading(true)
        try {
            const serverNonce = await OtpService.requestOtp(userEmail, true)
            setNonce(serverNonce)
        } catch (err: any) {
            setError(err.message || 'Could not resend code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (userOtp: string) => {
        setError('')
        setLoading(true)
        try {
            const valid = await OtpService.verifyOtp(nonce, userOtp)
            if (valid) {
                setStep(Step.FORM)
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getSiteKey = async () => {
        return await getTurnstileSiteKey();
    }


    return (
        <div className="main-layout">
            {step === Step.VERIFY && (
                <VerificationForm
                    nonce={nonce}
                    loading={loading}
                    error={error}
                    onRequestOtp={handleRequestOtp}
                    onResendOtp={handleResendOtp}
                    handleVerifyOtp={handleVerifyOtp}
                    getSiteKey={getSiteKey}
                />
            )}
            {step === Step.FORM && (
                <ComplaintForm 
                    formFields={formFields} 
                    setFormFields={setFormFields} 
                />
                
            )}
        </div>
    )
}
