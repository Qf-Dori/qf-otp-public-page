/**
 * TurnstileValidator — Server-side Cloudflare Turnstile credential access + token validation.
 *
 * Usage:
 *     var tv = new TurnstileValidator();
 *
 *     // REST endpoint returns the public site key to the browser:
 *     var creds = tv.getTranstileCredentials();  // { key, secret } or null
 *
 *     // requestOtp.js validates the token before sending OTP:
 *     var result = tv.validate(turnstileToken);  // { success, error_codes }
 */
var TurnstileValidator = Class.create();

TurnstileValidator.prototype = {
    initialize: function () {
        this.SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        this.KEY_PROP       = 'x_77594_quality_fo.recaptcha.site_key';
        this.SECRET_PROP    = 'x_77594_quality_fo.recaptcha.secret_key';
    },

    /**
     * Returns both Turnstile credentials from System Properties.
     * The REST endpoint that serves the site key to the browser calls this,
     * but should only return creds.key — never expose creds.secret to the client.
     */
    getTranstileCredentials: function () {
        var key    = gs.getProperty(this.KEY_PROP, '');
        var secret = gs.getProperty(this.SECRET_PROP, '');
        if (!key && !secret) {
            return null;
        }
        return {
            key: key,
            secret: secret
        };
    },

    /**
     * Validates a Turnstile token against Cloudflare's siteverify API.
     *
     * @param {string} token — The token from the client-side widget.
     * @returns {object} — { success: boolean, error_codes: string[] }
     */
    validate: function (token) {
        if (!token) {
            return { success: false, error_codes: ['missing-input-response'] };
        }

        var creds = this.getTranstileCredentials();
        if (!creds || !creds.secret) {
            gs.error('TurnstileValidator: secret key property not configured');
            return { success: false, error_codes: ['internal-error'] };
        }

        // ServiceNow resolves the real visitor IP behind its load balancers.
        // Cloudflare uses this to verify the token was issued to the same IP.
        var clientIP = gs.getSession().getClientIP();

        try {
            var restMessage = new sn_ws.RESTMessageV2();
            restMessage.setEndpoint(this.SITEVERIFY_URL);
            restMessage.setHttpMethod('POST');
            restMessage.setRequestHeader('Content-Type', 'application/json');
            restMessage.setRequestBody(JSON.stringify({
                secret: creds.secret,
                response: token,
                remoteip: clientIP
            }));

            var httpResponse = restMessage.execute();
            var body = JSON.parse(httpResponse.getBody());

            return {
                success: body.success === true,
                error_codes: body['error-codes'] || []
            };
        } catch (e) {
            gs.error('TurnstileValidator: outbound call failed — ' + e.message);
            return { success: false, error_codes: ['internal-error'] };
        }
    },

    type: 'TurnstileValidator'
};
