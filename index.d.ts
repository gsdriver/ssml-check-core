export interface ISSMLCheckOptions {
  platform?: "google" | "amazon" | "all";
  locale?: string;
  unsupportedTags?: string[];
  getPositions?: boolean;
}

export interface ISSMLCheckError {
  type: string;
  tag?: string;
  attribute?: string;
  value?: string;
}

export interface ISSMLCheckVerifyResponse {
  errors?: ISSMLCheckError[];
  fixedSSML?: string;
}

export function check(
  ssml: string,
  options?: any,
): Promise<ISSMLCheckError[] | undefined>;

export function verifyAndFix(
  ssml: string,
  options?: any,
): Promise<ISSMLCheckVerifyResponse>;
