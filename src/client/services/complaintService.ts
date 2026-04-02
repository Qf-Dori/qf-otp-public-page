const submitComplaint = async (
  recordId: string,
  verificationToken: string,
  fields: Record<string, unknown>,
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
        verification_token: verificationToken,
        ...fields,
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
  submitComplaint,
};
