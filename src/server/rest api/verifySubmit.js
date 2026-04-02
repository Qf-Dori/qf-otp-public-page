(function process(request, response) {

    var body  = request.body.data;

    var nonce = body.nonce;
    var userOtp = body.otp;

    if (!nonce || !userOtp) {
        response.setStatus(400);
        response.setBody({ error: 'nonce and otp are required.' });
        return;
    }
    
    var util   = new OTPVerificationUtil();
    var result = util.verifyHandshake(nonce, userOtp);
    
    if (!result.valid) {
        response.setStatus(400);
        response.setBody(result);
        return;
    }

    response.setStatus(200);
    response.setBody(result);

})(request, response);