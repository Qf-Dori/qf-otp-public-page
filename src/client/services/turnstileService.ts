// Fetches the Turnstile SITE KEY (public) from the server.
// IMPORTANT: The SECRET KEY must stay server-side — never use it in the browser.
// Validation of the Turnstile token happens in requestOtp.js (server-side),

export const getTurnstileSiteKey = async (): Promise<string> => {
  const response = await fetch(
    "/api/x_77594_quality_fo/transtile/credentials",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const { result } = await response.json();
  // Only use the public site key on the client — ignore any other fields
  return result.key;
};
