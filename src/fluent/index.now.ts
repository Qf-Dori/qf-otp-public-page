import '@servicenow/sdk/global';
// @ts-ignore ScriptInclude exists at runtime but is not typed in this SDK version
import { ScriptInclude, RestApi } from '@servicenow/sdk/core';


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


