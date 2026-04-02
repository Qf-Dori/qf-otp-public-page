(function process(request, response) {

    var body              = request.body.data;
    var recordId          = body.record_id;      // sysId of the OTP transient record
    var verificationToken = body.verification_token;
    var now = new Date().getTime();
    
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

    // 2. Fetch OTP record once — must exist and be marked verified
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
    // Honey pot check for dumb bots - silently discard likely bot submissions, based on presence of fields that should be empty 
    // and/or very rapid submission time (less than 2 seconds from form load)
    if (body.last_name || body.phone_number || (now - body._t) < 2000) {
    response.setStatus(200);
    response.setBody({ status:'success', reference_number:'REF' + Math.floor(Math.random()*999999) });
    return; // silently discard
}

    // 3. Delegate complaint insert to ComplaintsUtils
    var result = new ComplaintsUtils().submitComplaint(recordId, body);

    // 4. Mark OTP record submitted — same open record, no second fetch
    otp.submission_status = 'submitted';
    otp.setWorkflow(false);
    otp.update();

    response.setStatus(200);
    response.setBody({
        status: 'success',
        message: 'Complaint registered successfully.',
        reference_number: result.reference_number,
        record_id: result.sys_id,
    });

})(request, response);
