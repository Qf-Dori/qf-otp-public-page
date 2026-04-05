const verifyRequestToken = async (
  recordId: string,
  verificationToken: string,
) => {
  const response = await fetch(
    "/api/x_77594_quality_fo/req_token/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        record_id: recordId,
        verification_token: verificationToken,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.result?.error || `HTTP error ${response.status}`);
  }

  const { result } = await response.json();
  return result;
};

const submitComplaint = async (
  recordId: string,
  honeypotFields: { last_name: string; phone_number: string; _t: number },
) => {
  const response = await fetch(
    "/api/x_77594_quality_fo/complaint/submit_complaint",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        record_id: recordId,
        ...honeypotFields,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.result?.error || `HTTP error ${response.status}`);
  }

  const { result } = await response.json();
  return result;
};

export const ComplaintService = {
  verifyRequestToken,
  submitComplaint,
};
