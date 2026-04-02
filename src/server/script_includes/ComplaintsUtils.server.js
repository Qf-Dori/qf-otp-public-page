var ComplaintsUtils = Class.create();
ComplaintsUtils.prototype = {
    initialize: function () {},

    submitComplaint: function (otpRecordId, body) {
        // Insert new record into the complaint table.
        // NOTE: OTP record lifecycle (marking it 'submitted') is handled by
        // the REST handler, which already has the record open — no second fetch needed.
        var gr = new GlideRecord('x_77594_quality_fo_complaint');
        gr.initialize();

        // TODO: map fields once complaint table columns are confirmed
        // gr.complaint_title = body.title;
        // gr.description     = body.description;
        // gr.category        = body.category;
        // ...

        gr.setWorkflow(false);
        var sysId = gr.insert();

        return {
            sys_id: sysId,
            reference_number: gr.getDisplayValue(),
        };
    },

    type: 'ComplaintsUtils'
};
