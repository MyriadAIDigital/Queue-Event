import { app, InvocationContext, Timer } from "@azure/functions";
import axios from "axios";
export async function Queue(myTimer: Timer, context: InvocationContext): Promise<void> {
    const apiEndpoint = process.env.API_ENDPOINT;
    context.log(`POST request apiEndpoint ${apiEndpoint}`);
    // Define the tenantIDs you want to trigger
    const tenantIDs = ["0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008"];

    try {

        // Create an array of promises for each tenantID
        const requests = tenantIDs.map(tenantID => {
            const requestBody = {
                tenantId: tenantID,
                scheduleTime: new Date().toISOString(),
                triggeredBy: "system"
            };
            return axios.post(apiEndpoint, requestBody);
        });

        // Execute all POST requests in parallel
        const responses = await Promise.allSettled(requests);

        // Log the results
        responses.forEach((result, index) => {
            if (result.status === "fulfilled") {
                context.log(`POST request successful for tenantID ${tenantIDs[index]}. Status: ${result.value.status}`);
                context.log(`Response Data: ${JSON.stringify(result.value.data)}`);
            } else {
                context.log(`Error making POST request for tenantID ${tenantIDs[index]}: ${result.reason.message}`);
            }
        });
    } catch (error) {
        context.log(`Unexpected error: ${error.message}`);
    }
}

app.timer('Queue', {
    // schedule: '0 0/30 * * * *',
    schedule: '0 */1 * * * *',
    handler: Queue
});
