import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '4b56758586df453faab4eff6a64c6506'
                    }
                    'cmp-rest-api': {
                        table: 'sys_ws_definition'
                        id: '254362bd88df4d55b99a2884222ec5c5'
                        deleted: true
                    }
                    'complaints-utils': {
                        table: 'sys_script_include'
                        id: '6ba80cef8f7a45a8970db4218c93ae51'
                    }
                    'otp-verification-util': {
                        table: 'sys_script_include'
                        id: '686b4c35eb734adb9181a31d328d8420'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'fbd2ba77098a42b18ba4fdd3b4c0e9b6'
                    }
                    'request-otp': {
                        table: 'sys_ws_operation'
                        id: 'b55fc78f038445ff935ca69e8fe3dc10'
                        deleted: true
                    }
                    'src_server_rest api_requestOtp_js': {
                        table: 'sys_module'
                        id: 'd414f2263571424a8d16941fc745712c'
                    }
                    'src_server_rest api_submitComplaint_js': {
                        table: 'sys_module'
                        id: '99cc9bc471b14352848d410429aa1602'
                    }
                    'src_server_rest api_verifySubmit_js': {
                        table: 'sys_module'
                        id: '619fb5ee00654aa6a7d494763be644b1'
                    }
                    src_server_script_includes_ComplaintsUtils_server_js: {
                        table: 'sys_module'
                        id: 'f85cb20a0aa641e89fafbae5aac8ab7e'
                    }
                    src_server_script_includes_OTPVerificationUtil_server_js: {
                        table: 'sys_module'
                        id: 'b335791b75e1412fa4eebc1386aaec09'
                    }
                    src_server_script_includes_TurnstileValidator_server_js: {
                        table: 'sys_module'
                        id: 'ef6edd26ff3f4da181fe45a46be7ced4'
                    }
                    'turnstile-validator': {
                        table: 'sys_script_include'
                        id: 'c06a51a53b2e43c284fbc23c34227658'
                    }
                    'verify-submit': {
                        table: 'sys_ws_operation'
                        id: '5ffd8afe17064ad78789bf5454a1b51b'
                        deleted: true
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '33b6a347920f4a1e8760371f391e4968'
                        key: {
                            application_file: 'dbcaa638fb414f9d822e53dd8098570c'
                            source_artifact: 'feb59ee42d754663ad172c9fffd6be25'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '35b5ae73d3c64270be80f5d69398b9db'
                        key: {
                            application_file: 'bc3cb0635cd24f5da864b08f169894c0'
                            source_artifact: 'feb59ee42d754663ad172c9fffd6be25'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b6c7001c6b0d4a509a3a26b31f6002bc'
                        key: {
                            name: 'x_77594_quality_fo/main.js.map'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'bc3cb0635cd24f5da864b08f169894c0'
                        key: {
                            endpoint: 'x_77594_quality_fo_complaint_portal.do'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'cdd4886b4b814e7ba1e05f464d3a145c'
                        key: {
                            application_file: 'b6c7001c6b0d4a509a3a26b31f6002bc'
                            source_artifact: 'feb59ee42d754663ad172c9fffd6be25'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dbcaa638fb414f9d822e53dd8098570c'
                        key: {
                            name: 'x_77594_quality_fo/main'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'feb59ee42d754663ad172c9fffd6be25'
                        key: {
                            name: 'x_77594_quality_fo_complaint_portal.do - BYOUI Files'
                        }
                    },
                ]
            }
        }
    }
}
