import { App, Modal, Setting } from 'obsidian';

/* 
模态框显示信息并接受用户的输入。
创建模态框类 需要继承Modal类
*/
export class ExampleModal extends Modal {
  /*   
  constructor(app: App) {
    super(app);
    this.setContent('Look at me, I\'m a modal! 👀')
  }
  */

  // 接受用户输入
  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.setTitle('What\'s your name?');

    let name = '';
    new Setting(this.contentEl)
      .setName('Name')
      .addText((text) =>
        text.onChange((value) => {
          name = value;
        }));

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Submit')
          .setCta()
          .onClick(() => {
            this.close();
            onSubmit(name);
          }));
  }
}