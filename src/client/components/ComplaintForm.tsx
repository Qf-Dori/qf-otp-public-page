import React, { useState } from 'react'
import { cmpForm } from '../types/types'

type ComplaintFormProps = {
    formFields?: cmpForm
    setFormFields?: React.Dispatch<React.SetStateAction<cmpForm | undefined>>
}

export const ComplaintForm = ({formFields, setFormFields}: ComplaintFormProps) => {

    const [renderTimestamp] = useState(() => new Date().getTime());
    
    return (
        <section className='cmp-form-layout'>
            <h1>Complaint Form</h1>
            <form className="verification-card">
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
                    <input tabIndex={-1} autoComplete="off" name="last_name" value={formFields?.last_name || ''} onChange={(e) => setFormFields?.({ ...formFields, last_name: e.target.value })} />
                    <input tabIndex={-1} autoComplete="off" name="phone_number" value={formFields?.phone_number || ''} onChange={(e) => setFormFields?.({ ...formFields, phone_number: e.target.value })} />
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
                <button type="submit">Submit a Complaint</button>
            </form>
        </section>
    )
}