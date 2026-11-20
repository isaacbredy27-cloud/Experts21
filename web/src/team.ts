import teamData from "./generated/team.json";

export interface KnowledgeFile {
  path: string;
  name: string;
  size: number;
  status: string;
}

export interface Agent {
  name: string;
  description: string;
  group: string;
  model: string;
  modelId: string;
  color: string | null;
  persona: { firstName: string; voice: string; workingStyle: string };
  skills: string[];
  knowledgeFiles: KnowledgeFile[];
}

export const team = teamData as { builtAt: string; sharedFiles: KnowledgeFile[]; agents: Agent[]; warnings: string[] };
export const agents = team.agents;
export const agentByName = new Map(agents.map((a) => [a.name, a]));
export const orchestrator = agentByName.get("orchestrator")!;

export function displayName(name: string): string {
  const a = agentByName.get(name);
  return a ? `${a.persona.firstName}` : name;
}

/** User-provided documents (everything except the folder README). */
export function userDocs(files: KnowledgeFile[]): KnowledgeFile[] {
  return files.filter((f) => f.name.toLowerCase() !== "readme.md");
}

export function modelLabel(model: string): string {
  if (model === "opus") return "Opus";
  if (model === "sonnet") return "Sonnet";
  if (model === "haiku") return "Haiku";
  return model;
}
