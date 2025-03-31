import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

//Plugin类定义插件的生命周期并公开所有插件可用的操作
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	onCreate() {
		if (!this.app.workspace.layoutReady) {
			console.log('工作空间还在加载');
			return;
		}
		console.log('布局就绪')
	}

	/**
	 * 加载插件需要的资源；此处配置插件的大部分功能
	 * 
	 * onload函数应仅包含插件初始化所需的代码。
	 * 这包括应用程序注册，
	 * 例如注册命令、视图类型和 Markdown 后处理器。
	 * 
	 * 它不应包含任何耗时的操作或数据获取。
	 */
	async onload() {
		console.log('加载插件');

		this.registerEvent(this.app.vault.on('create', this.onCreate, this));

		await this.loadSettings();


		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


		/**
		 * https://lucide.dev/ 查看图标
		 * 
		 * 功能区添加操作  dice info 
		 */
		this.addRibbonIcon('circle-user-round', '功能栏-图标标题', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('通知');
		});


		this.addCommand({
			id: 'cmd-hello',
			name: 'cmd-hi',
			callback: () => {
				//cmd窗口运行npm run dev 同时obsidian安装了hot-reload插件 改变main.ts  main.js会自动更新 
				console.log('你好，俊宝222，333');
			},
		});

		/**
		 * 命令区添加操作
		 * 
		 * 用于“检查”您的命令是否可以在当前情况下执行。
		 */
		this.addCommand({
			id: 'choose-command',
			name: 'choose command',
			/**
			 * 运行checkCallback两次
			 * 
			 * 1.打开命令面板时，会调用一次。执行初步检查以确定命令是否可以运行 
			 * 		checking true 执行初步检查以确定命令是否可以运行 
			 * 2.当用户在命令面板中选择您的命令时。
			 * 		checking false 执行真正的命令
			 * 
			 * @param checking 
			 * @returns 
			 */
			checkCallback: (checking: boolean) => {
				console.log('checking', checking);
				const value = getRequiredValue();
				if (value) {
					if (!checking) {
						doCommand(value);
					}
					return true
				}
				return false;
			},
		});

		/**
		 * 编辑器命令
		 * 它提供活动编辑器及其视图作为参数
		 * 
		 * 仅当有活动编辑器可用时，编辑器命令才会出现在命令面板中。


		 */
		this.addCommand({
			id: 'edit-command',
			name: 'edit command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const sel = editor.getSelection()
				console.log(`You have selected: ${sel}`);
			},
		});

		//编辑器条件命令
		this.addCommand({
			id: 'edit-choose-command',
			name: 'edit choose command',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				const value = getRequiredValue2(editor);
				if (value) {
					if (!checking) {
						doCommand(value);
					}
					return true
				}
				return false;
			},
		});

		this.addCommand({
			id: 'hot-key-command',
			name: 'hot key command',
			//Mod 键是一个特殊的修饰键，在 Windows 和 Linux 上变为 Ctrl，在 macOS 上变为 Cmd
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'q' }],
			callback: () => {
				console.log('mod shift q 你好');
			},
		});

		/**
		 * 上下文菜单
		 * 
		 */
		this.addRibbonIcon('square-menu', 'Open menu', (event) => {
			const menu = new Menu();

			menu.addItem((item) =>
				item
					.setTitle('Copy')
					.setIcon('documents')
					.onClick(() => {
						new Notice('Copied');
					})
			);

			menu.addItem((item) =>
				item
					.setTitle('Paste')
					.setIcon('paste')
					.onClick(() => {
						new Notice('Pasted');
					})
			);

			//打开您用鼠标单击的菜单
			//menu.showAtMouseEvent(event);
			//x 做到右 y 上到下
			menu.showAtPosition({ x: 200, y: 100 })
		});

		/**
		 * 通过订阅file-menu和editor-menu工作区事件
		 * 将项目添加到 文件菜单 或 编辑器菜单
		 */
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle('Print file path 👈')
						.setIcon('document')
						.onClick(async () => {
							new Notice(file.path);
							//文件路径
							console.log(file.path);
						});
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle('Print file path 👈')
						.setIcon('document')
						.onClick(async () => {
							new Notice(view.file.path);
							console.log(view.file.parent);
						});
				});
			})
		);

	}



	//释放插件需要的资源；插件禁止时运行
	onunload() {
		console.log('释放插件');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
function doCommand(value: any) {
	console.log(value);
}

function getRequiredValue(): number {
	console.log('getRequiredValue');
	return 10;
}

function getRequiredValue2(editor: Editor) {
	const sel = editor.getSelection()
	console.log(`You have selected: ${sel}`);
	return sel;
}
