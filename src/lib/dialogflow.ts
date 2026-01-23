import { GoogleAuth } from "google-auth-library";
import { Session, Conversation, Message } from "@/types/conversation";

function getCredentials() {
  const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  return JSON.parse(credentialsJson);
}

function getConfig() {
  const projectId = process.env.CA_PROJECT_ID;
  const location = process.env.CA_LOCATION;
  const agentId = process.env.CA_AGENT_ID;

  if (!projectId || !location || !agentId) {
    throw new Error(
      "Missing required environment variables: CA_PROJECT_ID, CA_LOCATION, or CA_AGENT_ID"
    );
  }

  return { projectId, location, agentId };
}

async function getAuthClient() {
  const credentials = getCredentials();

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return auth.getClient();
}

function getApiEndpoint(location: string): string {
  return location === "global"
    ? "https://dialogflow.googleapis.com"
    : `https://${location}-dialogflow.googleapis.com`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInteraction(interaction: any, conversationId: string, index: number): Message[] {
  const messages: Message[] = [];

  // User input
  const userText =
    interaction.request?.queryInput?.text?.text ||
    interaction.request?.queryInput?.intent?.intent;

  if (userText) {
    const requestTime = interaction.requestTime
      ? new Date(interaction.requestTime).toISOString()
      : "";

    messages.push({
      id: `${conversationId}-user-${index}`,
      role: "user",
      text: userText,
      timestamp: requestTime,
    });
  }

  // Agent response
  if (interaction.response?.queryResult) {
    const queryResult = interaction.response.queryResult;
    const responseTime = interaction.responseTime
      ? new Date(interaction.responseTime).toISOString()
      : "";

    // Calculate latency
    let latency: number | undefined;
    if (interaction.requestTime && interaction.responseTime) {
      const requestMs = new Date(interaction.requestTime).getTime();
      const responseMs = new Date(interaction.responseTime).getTime();
      latency = (responseMs - requestMs) / 1000;
    }

    // Extract text from response messages
    const responseTexts: string[] = [];
    if (queryResult.responseMessages) {
      for (const msg of queryResult.responseMessages) {
        if (msg.text?.text) {
          responseTexts.push(...msg.text.text);
        }
      }
    }

    // Get playbook info if available
    const playbookName =
      queryResult.generativeInfo?.currentPlaybooks?.[0] || undefined;

    if (responseTexts.length > 0) {
      messages.push({
        id: `${conversationId}-agent-${index}`,
        role: "agent",
        text: responseTexts.join("\n\n"),
        timestamp: responseTime,
        latency,
        playbookName: playbookName ? playbookName.split("/").pop() : undefined,
      });
    }
  }

  return messages;
}

export async function listConversations(): Promise<Session[]> {
  const { projectId, location, agentId } = getConfig();
  const client = await getAuthClient();
  const apiEndpoint = getApiEndpoint(location);

  const parent = `projects/${projectId}/locations/${location}/agents/${agentId}`;
  // Use v3beta1 for conversations API
  const url = `${apiEndpoint}/v3beta1/${parent}/conversations?pageSize=100`;

  const response = await client.request({ url });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any;
  const conversations = data.conversations || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return conversations.map((conv: any) => {
    const name = conv.name || "";
    const id = name.split("/").pop() || "";

    // Parse start time
    const startTime = conv.startTime
      ? new Date(conv.startTime).toISOString()
      : "";

    // Calculate duration
    let duration = "0m00s";
    if (conv.startTime && conv.endTime) {
      const startMs = new Date(conv.startTime).getTime();
      const endMs = new Date(conv.endTime).getTime();
      const durationSeconds = Math.floor((endMs - startMs) / 1000);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      duration = `${minutes}m${seconds.toString().padStart(2, "0")}s`;
    }

    // Count turns (interactions)
    const turns = conv.interactions?.length || 0;

    // Determine channel
    const environment = conv.environment || "";
    const channel = environment.includes("dfMessenger") ? "Text" : "Text";

    return {
      id,
      name,
      startTime,
      duration,
      turns,
      channel,
    };
  });
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const { projectId, location, agentId } = getConfig();
  const client = await getAuthClient();
  const apiEndpoint = getApiEndpoint(location);

  const name = `projects/${projectId}/locations/${location}/agents/${agentId}/conversations/${conversationId}`;
  // Use v3beta1 for conversations API
  const url = `${apiEndpoint}/v3beta1/${name}`;

  try {
    const response = await client.request({ url });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversation = response.data as any;

    if (!conversation) {
      return null;
    }

    const startTime = conversation.startTime
      ? new Date(conversation.startTime).toISOString()
      : "";

    const messages: Message[] = [];

    // Process interactions to extract messages
    if (conversation.interactions) {
      conversation.interactions.forEach(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (interaction: any, index: number) => {
          const interactionMessages = parseInteraction(
            interaction,
            conversationId,
            index
          );
          messages.push(...interactionMessages);
        }
      );
    }

    return {
      id: conversationId,
      name: conversation.name || "",
      startTime,
      messages,
    };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
}
