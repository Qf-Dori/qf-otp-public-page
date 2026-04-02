

const requestOtp = async (email: string, resend = false, turnstileToken?: string) => {
  const response = await fetch("/api/x_77594_quality_fo/cmp_otp/otp/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      resend: resend ? "true" : undefined,
      turnstile_token: turnstileToken || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `HTTP error ${response.status}`,
    );
  }

  const { result } = await response.json();
  return result.nonce;
};

const verifyOtp = async (nonce: string, otp: string) => {
  if (!nonce) throw new Error("Nonce is required for verification.");
  if (!otp) throw new Error("OTP code is required for verification.");
  try {
    const response = await fetch("/api/x_77594_quality_fo/cmp_otp/otp/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ nonce, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `HTTP error ${response.status}`,
      );
    }

    const { result } = await response.json();

    return result;
  } catch (e) {
    console.error("Verification error:", e);
    throw new Error("Verification failed. Please try again.");
  }
};

export const OtpService = {
  requestOtp,
  verifyOtp,
};
