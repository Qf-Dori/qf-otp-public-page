var OTPVerificationUtil = Class.create();
OTPVerificationUtil.prototype = {
  initialize: function () {},

  _getSalt: function () {
    return gs.getProperty("x_77594_quality_fo.otp.secret_salt", "");
  },
  generateOTP: function () {
    var rawInt = GlideSecureRandomUtil.getSecureRandomInt()
    var secureNum = Math.abs(rawInt) % 1000000;
    var str = secureNum.toString();
    while (str.length < 6) { str = "0" + str; }
    return str;
  },
  generateNonce: function () {
    return GlideSecureRandomUtil.getSecureRandomString(32);
  },
  hashComponents: function (otp, nonce, salt) {
    var digest = new GlideDigest();
    return digest.getSHA256Hex(otp + nonce + salt);
  },

  /**
   * Layer 1: IP-based throttling.
   * If a single IP makes more than 3 requests in 1 minute, block it for 1 hour.
   * Stored in the transient table with email = "__ip_rate:<ip>" as a convention.
   */
  isIPBlocked: function (clientIP) {
    var rateMarker = "__ip_rate:" + clientIP;
    var blockMarker = "__ip_block:" + clientIP;

    // 1. Check if already blocked (block record from the last hour)
    var blockCheck = new GlideRecord("x_77594_quality_fo_data_table_1");
    blockCheck.addQuery("email", blockMarker);
    blockCheck.addQuery("sys_created_on", ">=", gs.hoursAgo(1));
    blockCheck.setLimit(1);
    blockCheck.query();
    if (blockCheck.next()) {
      return true;
    }

    // 2. Count hits in last 60 seconds (DB-side aggregation)
    var hitCount = new GlideAggregate("x_77594_quality_fo_data_table_1");
    hitCount.addQuery("email", rateMarker);
    hitCount.addQuery("sys_created_on", ">=", gs.minutesAgo(1));
    hitCount.addAggregate("COUNT");
    hitCount.query();

    var count = 0;
    if (hitCount.next()) {
      count = parseInt(hitCount.getAggregate("COUNT"), 10);
    }

    if (count >= 3) {
      // Threshold exceeded — create block marker
      var br = new GlideRecord("x_77594_quality_fo_data_table_1");
      br.initialize();
      br.email = blockMarker;
      br.setWorkflow(false);
      br.insert();
      return true;
    }

    // 3. Log this hit
    var hit = new GlideRecord("x_77594_quality_fo_data_table_1");
    hit.initialize();
    hit.email = rateMarker;
    hit.setWorkflow(false);
    hit.insert();

    return false;
  },

  /**
   * Layer 2: Email-based throttling.
   * Prevents an attacker from rotating IPs to spam one email address.
   * Max 3 pending (unverified) records per email in the last hour.
   * Uses GlideAggregate for DB-side COUNT — avoids pulling all rows into memory.
   */
  isEmailOverLimit: function (email) {
    var gr = new GlideAggregate("x_77594_quality_fo_data_table_1");
    gr.addQuery("email", email);
    gr.addQuery("email", "DOES NOT CONTAIN", "__ip_");
    gr.addQuery("sys_created_on", ">=", gs.hoursAgo(1));
    gr.addAggregate("COUNT");
    gr.query();

    if (gr.next()) {
      return parseInt(gr.getAggregate("COUNT"), 10) >= 3;
    }
    return false;
  },
  /**
   * Generates a one-time verification token bound to a specific record.
   * The client holds this token and submits it with the final form.
   * We SHA-256 hash the record sysID + secret salt — never the OTP itself.
   */
  generateVerificationToken: function (recordSysID) {
    var salt = this._getSalt();
    var digest = new GlideDigest();
    return digest.getSHA256Hex(recordSysID + salt);
  },

  createHandshake: function (email) {
    if (this.isEmailOverLimit(email)) {
      return {
        sent: false,
        error: "rate_limited",
        message: "Too many OTP requests. Please try again later.",
      };
    }

    var otp = this.generateOTP();
    var nonce = this.generateNonce();
    var salt = this._getSalt();
    var hash = this.hashComponents(otp, nonce, salt);

    var expires = new GlideDateTime();
    expires.addSeconds(600);

    var rec = new GlideRecord("x_77594_quality_fo_data_table_1");
    rec.initialize();
    rec.email = email;
    rec.nonce = nonce;
    rec.hash = hash;
    rec.attempts = 0;
    rec.expires = expires;
    rec.setWorkflow(false); // Prevent ACL / business-rule interference in guest context
    rec.insert();

    gs.eventQueue("x_77594_quality_fo.otp_requested", rec, otp, email);

    return { sent: true, nonce: nonce };
  },

  /**
   * Resend: regenerates OTP on the existing record for this email.
   * Enforces a 60-second cooldown so the user can't spam the button.
   * Does NOT consume the hourly rate-limit slot (no new record is inserted).
   */
  resendHandshake: function (email) {
    var rec = new GlideRecord("x_77594_quality_fo_data_table_1");
    rec.addQuery("email", email);
    rec.orderByDesc("sys_created_on");
    rec.setLimit(1);
    rec.query();

    if (!rec.next()) {
      // No pending record — fall through to a fresh request (applies rate limit)
      return this.createHandshake(email);
    }

    // Only resend to unverified records; a verified record means the user
    // already completed OTP and should be on the complaint form
    if (rec.getValue("verified") === "1") {
      return {
        sent: false,
        error: "already_verified",
        message: "OTP already verified. Please complete your submission.",
      };
    }

    // 60-second between resends
    var createdMs = new GlideDateTime(
      rec.sys_created_on.toString(),
    ).getNumericValue();
    var nowMs = new GlideDateTime().getNumericValue();
    if (nowMs - createdMs < 60000) {
      return {
        sent: false,
        error: "cooldown",
        message: "Please wait 60 seconds before requesting a new code.",
      };
    }

    // Regenerate OTP in-place — same record,
    //  no new rate-limit slot consumed
    var otp = this.generateOTP();
    var nonce = this.generateNonce();
    var salt = this._getSalt();
    var hash = this.hashComponents(otp, nonce, salt);

    var expires = new GlideDateTime();
    expires.addSeconds(600);

    rec.nonce = nonce;
    rec.hash = hash;
    rec.attempts = 0;
    rec.expires = expires;
    rec.setWorkflow(false);
    rec.update();

    gs.eventQueue("x_77594_quality_fo.otp_requested", rec, otp, email);

    return { sent: true, nonce: nonce };
  },

  verifyHandshake: function (nonce, userOtp) {
    var rec = new GlideRecord("x_77594_quality_fo_data_table_1");
    rec.addQuery("nonce", nonce);
    rec.setLimit(1);
    rec.query();

    if (!rec.next()) {
      return { valid: false, message: "Invalid or expired nonce." };
    }

    var now = new GlideDateTime();
    if (now.compareTo(new GlideDateTime(rec.expires.toString())) > 0) {
      rec.setWorkflow(false);
      rec.deleteRecord();
      return { valid: false, message: "OTP has expired." };
    }

    var attempts = parseInt(rec.attempts) + 1;

    var salt = this._getSalt();
    var expectedHash = this.hashComponents(userOtp, nonce, salt);
    var storedHash = rec.hash.toString();

    if (expectedHash !== storedHash) {
      if (attempts >= 3) {
        rec.setWorkflow(false);
        rec.deleteRecord();
        return {
          valid: false,
          message: "Too many attempts. Please request a new code.",
        };
      }
      rec.attempts = attempts;
      rec.setWorkflow(false);
      rec.update();
      return {
        valid: false,
        message: "Incorrect OTP. " + (3 - attempts) + " attempt(s) remaining.",
      };
    }

    // OTP correct — mark record as verified and clear sensitive fields.
    // Do NOT delete: until complaint data is written into the record.
    var sysId = rec.getUniqueValue();
    rec.verified = true;
    rec.hash = null; // OTP hash no longer needed; clear it
    rec.nonce = null; // Nonce no longer needed; clear it
    rec.setWorkflow(false);
    rec.update();

    var token = this.generateVerificationToken(sysId);
    return {
      valid: true,
      verification_token: token,
      record_id: sysId,
      message: "OK",
    };
  },

  type: "OTPVerificationUtil",
};
