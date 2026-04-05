import React, { useState } from 'react'
import { cmpForm } from '../types/types'

type ComplaintFormProps = {
    formFields: cmpForm
    setFormFields: React.Dispatch<React.SetStateAction<cmpForm>>
    onSubmit: () => Promise<any>
    loading: boolean
    error: string
}

export const ComplaintForm = ({formFields, setFormFields, onSubmit, loading, error}: ComplaintFormProps) => {

    const [renderTimestamp] = useState(() => new Date().getTime());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormFields(prev => ({ ...prev, _t: renderTimestamp }))
        await onSubmit()
    }

    return (
        <section className='cmp-form-layout'>
            <h1>Complaint Form</h1>
            <form className="verification-card" onSubmit={handleSubmit}>
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
                    <input tabIndex={-1} autoComplete="off" name="last_name" value={formFields.last_name || ''} onChange={(e) => setFormFields({ ...formFields, last_name: e.target.value })} />
                    <input tabIndex={-1} autoComplete="off" name="phone_number" value={formFields.phone_number || ''} onChange={(e) => setFormFields({ ...formFields, phone_number: e.target.value })} />
                </div>
                <input type="hidden" name="_t" value={renderTimestamp} />
                <strong>Complaint form coming soon...</strong>
                <br />
                <br />
                <input type="text" placeholder="Field 1" />
                {"    "}
                <input type="text" placeholder="Field 2" />
                <br />
                <br />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit a Complaint'}</button>
            </form>
        </section>
    )
}