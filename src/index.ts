export { MPPSession } from "./session";
export * from "./types";

export const MPP = {
  createSession: async (config: any) => {
    const { MPPSession } = await import("./session");
    return new MPPSession(config);
  }
};
