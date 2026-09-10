export const root: string;
export function readEnv(mode: string): Record<string, string>;
export function frontendEnvironment(mode: string): string;
export function developmentConfig(values: Record<string, string>): {
  frontendPort: number;
  backendPort: number;
  apiUrl: string;
  frontendUrl: string;
};
export function backendEnvironment(mode: string): Record<string, string | undefined>;
