# CMP Project — Claude Guidelines

## ServiceNow SDK Patterns

### Script Include (`index.now.ts`)

Use this pattern to register a Script Include with the ServiceNow SDK:

```ts
import '@servicenow/sdk/global';
// @ts-ignore ScriptInclude exists at runtime but is not typed in this SDK version
import { ScriptInclude } from '@servicenow/sdk/core';

ScriptInclude({
    $id: Now.ID['<record-id-key>'],
    name: '<ScriptIncludeName>',
    active: true,
    apiName: '<scope>.<ScriptIncludeName>',
    script: Now.include('./server/script includes/<ScriptIncludeName>.server.js'),
})
```

Key points:
- `@ts-ignore` is required for any SDK import that exists at runtime but is not typed: `ScriptInclude`, `RestApi`, `UiPage`. Also required on `Now.include(...)` calls inside `ScriptInclude` (not inside routes — those already have inline `@ts-ignore`).
- `$id` references a key from `Now.ID` (defined in the project's ID map).
- `apiName` must include the app scope prefix (e.g. `x_77594_quality_fo`).
- `script` uses `Now.include(...)` with paths **relative to `index.now.ts`** (in `src/fluent/`). Server files in `src/server/` need `../server/...` not `./server/...`.

### File extension convention

| File | Extension | Reason |
|------|-----------|--------|
| SDK registration/manifest | `.ts` | Compiled by the SDK build tool |
| Actual ServiceNow script body | `.js` | Runs in ServiceNow's Rhino/ES5 runtime — `Now.include()` embeds it as-is, no transpilation |

The server scripts use ServiceNow globals (`Class.create()`, `GlideRecord`, etc.) and must stay as plain JS.

---

### ServiceNow Security APIs (canonical patterns)

```js
// Cryptographically secure nonce (NOT Math.random)
var nonce = GlideSecureRandomUtil.getSecureRandomString(32);

// 6-digit OTP — guarantees no leading-zero ambiguity (100000–999999)
var otp = Math.floor(100000 + Math.random() * 900000).toString();

// SHA-256 hash — correct method is getSHA256Hex (not getSHA256Base16)
var digest = new GlideDigest();
var hash = digest.getSHA256Hex(otp + nonce + salt);

// Secret salt — always from an Encrypted System Property
var salt = gs.getProperty('x_77594_quality_fo.otp.secret_salt');
```

Rules:
- Never store the OTP or salt — only the hash goes in the DB.
- Never store the hash in a System Property — use the transient table so concurrent users don't overwrite each other.
- Track `attempts` on the transient record; delete it after 3 failures or on success.

---

### Fetching REST API from React (Guest / public users)

- **No CSRF token** — do NOT include `X-UserToken` or `g_ck` for guest users. Only authenticated users need it.
- **Response envelope** — ServiceNow wraps all REST API responses in `{ result: ... }`, so access data as `response.result.nonce`, not `response.nonce`.
- **URL format:** `/api/<scope>/<service_id>/<path>`
  - Example: `/api/x_77594_quality_fo/cmp_otp/otp/request`
  - Example: `/api/x_77594_quality_fo/cmp_otp/otp/verify`

```ts
const response = await fetch('/api/x_77594_quality_fo/cmp_otp/otp/request', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // No X-UserToken for guest users
    },
    body: JSON.stringify({ email }),
});
const data = await response.json();
const nonce = data.result.nonce; // unwrap the SN envelope
```

---

### Making a UI Page public (unauthenticated access)

Register the page in the `sys_public` table in ServiceNow — this is what allows guest users to load the React bundle without logging in. The `direct: true` flag in the SDK `UiPage` registration alone is not sufficient.

---

### Debugging emails in ServiceNow

| Table | What it shows |
|---|---|
| `syslog_email` | Metadata only — recipient, status, timestamp |
| `sys_email` | Full email record — subject (contains OTP), recipients, type, created date |

Use `sys_email` to verify the OTP was included in the subject/body during testing.

---

### REST API (`index.now.ts`)

Use this pattern to register a Scripted REST API with the ServiceNow SDK:

```ts
import '@servicenow/sdk/global';
// @ts-ignore RestApi exists at runtime but is not typed in this SDK version
import { RestApi } from '@servicenow/sdk/core';

RestApi({
    $id: Now.ID['<api-id-key>'],
    name: '<api_name>',
    service_id: '<service_id>',
    consumes: 'application/json',
    routes: [
        {
            $id: Now.ID['<route-id-key>'],
            name: '<route_name>',
            method: 'POST',           // GET | POST | PUT | DELETE | PATCH
            path: '/optional/path',   // omit for root path of the service
            // @ts-ignore - Now.include exists at runtime
            script: Now.include('./server/api/<handlerFile>.js'),
        },
    ],
})
```

Key points:
- Each `RestApi` block is one Scripted REST Service; it can have multiple `routes`.
- `service_id` is the internal identifier for the REST service (snake_case).
- `path` on a route is optional — omitting it maps the route to the service root.
- Each route's `script` is a separate `.js` handler file (plain JS, Rhino/ES5).
- Multiple `RestApi(...)` calls can live in the same `index.now.ts`.

---

### Direct Record Pattern — Alternative REST API Registration

**Problem:** The `RestApi` helper doesn't recognize all ServiceNow database fields, causing TypeScript errors (e.g. `requires_authentication: false` is not accepted).

**Solution:** Use `Record(...)` to write directly to the underlying tables (`sys_ws_definition` for the service, `sys_ws_operation` for the endpoint). This lets you set every field — Namespace, Public Access, Relative Path, ACL bypass — without the SDK blocking you.

```ts
import { Record } from '@servicenow/sdk/core';

// 1. Define the REST Service (sys_ws_definition)
export const myService = Record({
    $id: Now.ID['<service-id-key>'],
    table: 'sys_ws_definition',
    data: {
        name: '<service_name>',
        service_id: '<service_id>',
        namespace: 'x_77594_quality_fo',
        active: true,
        short_description: '...',
        enforce_acl: []
    }
});

// 2. Define the Endpoint (sys_ws_operation)
Record({
    $id: Now.ID['<endpoint-id-key>'],
    table: 'sys_ws_operation',
    data: {
        web_service_definition: myService,   // links to the service above
        name: '<route_name>',
        http_method: 'POST',
        relative_path: '/path',
        active: true,
        // Fields the RestApi helper blocks:
        requires_authentication: false,
        requires_acl_authorization: false,
        requires_snc_internal_role: false,
        // @ts-ignore - Now.include exists at runtime
        operation_script: Now.include('../server/rest_api/<handler>.js')
    }
});
```

Key points:
- Use this when you need `requires_authentication: false` or other fields the `RestApi` helper rejects.
- `web_service_definition` links the endpoint record to the service record by reference (pass the exported const).
- The handler file uses `operation_script` (not `script` as in `RestApi` routes).
- Path prefix for `Now.include` is relative to `index.now.ts` — from `src/fluent/` use `../server/...`.
