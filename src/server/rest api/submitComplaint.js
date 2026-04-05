(function process(request, response) {

    var body     = request.body.data;
    var recordId = body.record_id;
    var now      = new Date().getTime();

    if (!recordId) {
        response.setStatus(400);
        response.setBody({ error: 'record_id is required.' });
        return;
    }

    // Honeypot — bots that fill hidden fields or submit too fast get a fake success
    if (body.last_name || body.phone_number || (now - body._t) < 2000) {
        response.setStatus(200);
        response.setBody({ status: 'success', reference_number: 'REF' + Math.floor(Math.random() * 999999) });
        return;
    }

    // Fetch OTP record — must exist and be valid (verifyReqToken already checked, but guard here too)
    var otp = new GlideRecord('x_77594_quality_fo_data_table_1');
    if (!otp.get(recordId) || !otp.verified) {
        response.setStatus(403);
        response.setBody({ error: 'Invalid or expired session. Please restart the verification process.' });
        return;
    }

    // Delegate complaint insert to ComplaintsUtils
    var result = new ComplaintsUtils().submitComplaint(recordId, body);

    // Mark OTP record submitted
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
