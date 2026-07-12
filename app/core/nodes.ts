export enum CustomNode {
  INPUT = "input",
  FILE = "file",
}

export function isCustomNode(name: string): name is CustomNode {
  return Object.values(CustomNode).includes(name as CustomNode);
}

export function isFormNode(name: string): boolean {
  switch (name) {
    case CustomNode.INPUT:
      return true;
    default:
      return false;
  }
}
