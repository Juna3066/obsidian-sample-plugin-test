// main.ts用了export default class 所以 此处 名字任意
import ExamplePlugin from '../main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export class ExampleSettingTab extends PluginSettingTab {
  plugin: ExamplePlugin;

  constructor(app: App, plugin: ExamplePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  //display()是您构建设置选项卡内容的地方
  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Date format')
      .setDesc('Default date format')
      .addText((text) =>
        text
          .setPlaceholder('MMMM dd, yyyy')
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
      );
  }
}