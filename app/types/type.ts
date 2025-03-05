export interface View {
  id: number;
  name: string;
  image: string;
}
export default interface Issue {
  id: string;
  type: string;
  description: string;
  position: { x: number; y: number };
  viewIndex: number;
  viewName: string;
  timestamp: string;
  image?: string;
}

export interface IssueType {
  id: string;
  label: string;
}

export const ISSUE_LIST = [];