(function process(request, response) {

    var body              = request.body.data;
    var recordId          = body.record_id;
    var verificationToken = body.verification_token;

    if (!recordId || !verificationToken) {
        response.setStatus(400);
        response.setBody({ error: 'record_id and verification_token are required.' });
        return;
    }

    // 1. Re-derive expected token server-side and compare
    var util          = new OTPVerificationUtil();
    var expectedToken = util.generateVerificationToken(recordId);

    if (verificationToken !== expectedToken) {
        response.setStatus(403);
        response.setBody({ error: 'Security token mismatch. Please restart the verification process.' });
        return;
    }

    // 2. Fetch OTP record — must exist and be marked valid
    var otp = new GlideRecord('x_77594_quality_fo_data_table_1');
    if (!otp.get(recordId)) {
        response.setStatus(403);
        response.setBody({ error: 'Verification record not found. Please restart the verification process.' });
        return;
    }

    if (!otp.verified) {
        response.setStatus(403);
        response.setBody({ error: 'OTP not verified. Please complete the OTP step first.' });
        return;
    }

    // Token and OTP valid — client can now proceed to submitComplaint
    response.setStatus(200);
    response.setBody({
        status: 'verified',
        record_id: recordId
    });

})(request, response);
