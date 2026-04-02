import '@servicenow/sdk/global';
// @ts-ignore ScriptInclude exists at runtime but is not typed in this SDK version
import { ScriptInclude } from '@servicenow/sdk/core';


ScriptInclude({
    $id: Now.ID['otp-verification-util'],
    name: 'OTPVerificationUtil',
    active: true,
    apiName: 'x_77594_quality_fo.OTPVerificationUtil',
    // @ts-ignore - Now.include exists at runtime
    script: Now.include('../server/script_includes/OTPVerificationUtil.server.js'),
})

ScriptInclude({
    $id: Now.ID['complaints-utils'],
    name: 'ComplaintsUtils',
    active: true,
    apiName: 'x_77594_quality_fo.ComplaintsUtils',
    // @ts-ignore - Now.include exists at runtime
    script: Now.include('../server/script_includes/ComplaintsUtils.server.js'),
})

ScriptInclude({
    $id: Now.ID['turnstile-validator'],
    name: 'TurnstileValidator',
    active: true,
    apiName: 'x_77594_quality_fo.TurnstileValidator',
    // @ts-ignore - Now.include exists at runtime
    script: Now.include('../server/script_includes/TurnstileValidator.server.js'),
})




// Alternative way to define the RestApi (sys_ws_definition)
/*Problem : RestApi  doesn't recognize all ServiceNow database fields, causing TypeScript errors 
   [e.g  requires_authentication: false] - DOT NOT WORK with RestApi helper. 

  Solution : A "direct" way to talk to the database tables (sys_ws_definition and sys_ws_operation)
, allowing you to manually set every field—like Namespace, Public Access,
  and Relative Path—without the SDK blocking you */

//  export const QF_Public_API_Definition = Record({
//     $id: Now.ID['qf-api-header'],
//     table: 'sys_ws_definition',
//     data: {
//         name: 'Quality Forward Public API',
//         service_id: 'cmp_opt_default_service',
//         namespace: 'x_77594_quality_fo',
//         active: true,
//         short_description: 'Pharma-grade complaint intake',
//         enforce_acl: [] // Typed as an array in the SDK
//     }
// });

// 2. Define the OTP Resource (Endpoint)
// Record({
//     $id: Now.ID['qf-otp-endpoint'],
//     table: 'sys_ws_operation',
//     data: {
//         // Link to the record above
//         web_service_definition: QF_Public_API_Definition, 
        
//         name: 'email_otp',
//         http_method: 'POST',
//         relative_path: '/submit',
//         active: true,
        
//         // These are the "hidden" fields that the RestApi helper blocks
//         requires_authentication: false,
//         requires_acl_authorization: false,
//         requires_snc_internal_role: false,

//     // @ts-ignore - Now.include exists at runtime
//         operation_script: Now.include('../server/rest_api/test.server.js')
//     }
// });