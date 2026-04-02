import '@servicenow/sdk/global'
// @ts-ignore UiPage exists at runtime but is not typed in this SDK version
import { UiPage } from '@servicenow/sdk/core'
import complaintPortal from '../../client/index.html'

UiPage({
    $id: Now.ID['complaint-portal-page'],
    endpoint: 'x_77594_quality_fo_complaint_portal.do',
    description: 'Complaint Portal UI Page',
    category: 'general',
    html: complaintPortal,
    direct: true,
})
