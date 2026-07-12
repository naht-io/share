export enum CustomNode {
  INPUT = "input",
  FILE = "file",
}

export function isCustomNode(name: string): name is CustomNode {
  return Object.values(CustomNode).includes(name as CustomNode);
}
