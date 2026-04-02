(function process(request, response) {

    var body   = request.body.data;
    var email  = body.email;
    var resend = body.resend === 'true';
    var turnstileToken = body.turnstile_token;

    // ── Layer 1: IP-based rate limiting (3 req/min, 1-hour block) ──
    var util = new OTPVerificationUtil();
    var clientIP = gs.getSession().getClientIP();
    if (util.isIPBlocked(clientIP)) {
        response.setStatus(429);
        response.setBody({ error: 'Too many requests. Please try again later.' });
        return;
    }

    if (!email) {
        response.setStatus(400);
        response.setBody({ error: 'email is required.' });
        return;
    }

    // ── Email validation & sanitization ──
    email = email.toString().trim().toLowerCase();
    var shouldBlock = false;
    // Block multi-recipient injection (commas, semicolons, spaces, newlines)
    if (/[,;\s]/.test(email)) {
       shouldBlock = true;
    }

    if (email.length < 5 || email.length > 254) {
        shouldBlock = true;
        return;
    }

    var emailRegex = new RegExp('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$');
    if (!emailRegex.test(email)) {
        shouldBlock = true;
    }

    if (shouldBlock) {
        response.setStatus(400);
        response.setBody({ error: 'Invalid email address.' });
        return;
    }

    // ── Turnstile check (skip on resend — user already passed the challenge) ──
    if (!resend) {
        var validator = new TurnstileValidator();
        var cfResult  = validator.validate(turnstileToken);

        if (!cfResult.success) {
            response.setStatus(403);
            response.setBody({
                error: 'CAPTCHA verification failed.',
                codes: cfResult.error_codes
            });
            return;
        }
    }

    //Turnstile passed / resend
    var result = resend ? util.resendHandshake(email) : util.createHandshake(email);

    if (!result.sent) {
        var status = result.error === 'rate_limited' ? 429 : 400;
        response.setStatus(status);
        response.setBody({
            error: result.error,
            message: result.error === 'rate_limited'
                ? 'Too many requests. Please try again later.'
                : result.message
        });
        return;
    }

    response.setStatus(200);
    response.setBody(result);

})(request, response);
