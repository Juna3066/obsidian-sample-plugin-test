import { ItemView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

// 当视图在新叶内打开时被调用，并负责构建视图的内容。
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h4', { text: 'Example view' });
  }
// onClose()在视图应该关闭时调用，并负责清理视图使用的任何资源
  async onClose() {
    // Nothing to clean up.
  }
}