export enum Step {
  INIT = 1,
  OUTLINE = 2,
  EXPANSION = 3,
  DOWNLOAD = 4,
}

export interface OutlineSection {
  title: string;
  summary: string;
}

export type ExpandedSections = {
  [key: number]: string;
};
