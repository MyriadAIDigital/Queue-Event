import { app, InvocationContext, Timer } from "@azure/functions";
import axios from "axios";

export async function Queue(myTimer: Timer, context: InvocationContext): Promise<void> {
    const primaryEndpoint = process.env.API_ENDPOINT;
    const secondaryEndpoint = process.env.NEW_API_ENDPOINT;

    context.log(`📡 Primary API Endpoint: ${primaryEndpoint}`);
    context.log(`📡 Secondary API Endpoint: ${secondaryEndpoint}`);

    const tenantIDs = ["0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009"];

    try {
        const requests = [];

        for (const tenantID of tenantIDs) {
            const requestBody = {
                tenantId: tenantID,
                scheduleTime: new Date().toISOString(),
                triggeredBy: "system"
            };

            // Call both endpoints for each tenant
            for (const endpoint of [primaryEndpoint, secondaryEndpoint]) {
                requests.push(
                    axios.post(endpoint, requestBody)
                        .then(res => ({
                            status: 'fulfilled',
                            tenantID,
                            endpoint,
                            response: res
                        }))
                        .catch(err => ({
                            status: 'rejected',
                            tenantID,
                            endpoint,
                            error: err
                        }))
                );
            }
        }

        const results = await Promise.all(requests);

        results.forEach(result => {
            const tag = `tenantId: ${result.tenantID} | endpoint: ${result.endpoint}`;
            if (result.status === 'fulfilled') {
                context.log(`✅ Success | ${tag}`);
                context.log(`📦 Response: ${JSON.stringify(result.response.data)}`);
            } else {
                context.log(`❌ Failure | ${tag}`);
                context.log(`🧨 Error: ${result.error?.message || 'Unknown error'}`);
            }
        });

    } catch (error: any) {
        context.log(`💥 Unexpected error in main try: ${error.message}`);
    }
}

// ⏰ Every 1 minute (for testing; change as needed)
app.timer('Queue', {
    schedule: '0 */1 * * * *',
    handler: Queue
});
