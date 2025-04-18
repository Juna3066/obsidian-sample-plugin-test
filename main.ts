import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu, setIcon, addIcon, WorkspaceLeaf, TFile, TFolder, Vault, TAbstractFile } from 'obsidian';
import { moment } from 'obsidian';
import { ExampleModal } from './modal';
import { ExampleModal2, ExampleModal3 } from 'modal/ExampleModal2';
import { ExampleSettingTab } from './settings';
import { ExampleView, VIEW_TYPE_EXAMPLE } from 'view';


const ALL_EMOJIS: Record<string, string> = {
	':+1:': '👍',
	':sunglasses:': '😎',
	':smile:': '😄',
};

// Remember to rename these classes and interfaces!
/**
 * 向插件添加设置的主要原因是存储即使用户退出 Obsidian 后仍会保留的配置
 * 
 * 添加插件设置步骤1 -定义配置内容
 * 
 * Object.assign()复制对任何嵌套属性的引用（浅复制）。
 * 如果您的设置对象包含嵌套属性，则需要递归复制每个嵌套属性（深复制
 */
interface MyPluginSettings {
	mySetting: string;
	dateFormat: string;
}
const DEFAULT_SETTINGS: Partial<MyPluginSettings> = {
	mySetting: 'default',
	dateFormat: 'YYYY-MM-DD',
}

//Plugin类定义插件的生命周期并公开所有插件可用的操作
export default class MyPlugin extends Plugin {
	// 添加插件设置步骤1 -定义配置内容
	settings: MyPluginSettings;
	statusBar: HTMLElement;

	onCreate() {
		if (!this.app.workspace.layoutReady) {
			console.log('工作空间还在加载');
			return;
		}
		console.log('布局就绪')
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		/* 
		getLeavesOfType()在需要访问视图实例时使用。

		切勿在插件中管理对视图的引用。Obsidian 可能会多次调用视图工厂函数,避免视图中的副作用
		*/
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf === null) {
				return;
			}
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
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

		this.registerEvent(
			this.app.vault.on("create", async (file: TAbstractFile) => {
				console.log(file);
			})
		);

		this.registerEvent(this.app.vault.on('create', () => {
			console.log('a new file has entered the arena')
		}));
		this.registerEvent(this.app.vault.on('delete', () => {
			console.log('file delete')
		}));
		this.registerEvent(this.app.vault.on('modify', () => {
			console.log('file modify')
		}));


		this.statusBar = this.addStatusBarItem();

		this.updateStatusBar();

		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 1000)
		);

		/**
		 * 要更改 Markdown 文档在阅读视图中的呈现方式，可以添加自己的Markdown 后处理器
		 * 
		 * 找包含两个冒号之间的文本的任何代码块:，并将其替换为适当的表情符号 
		 */
		this.mdPostDemo();

		/**
		 *  CSV 数据的代码块呈现为表格
		 */
		this.mdPostDemo2();

		this.addRibbonIcon('rows-3', 'Print leaf types', () => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				console.log(leaf.getViewState().type);
			});
		});

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);

		this.addRibbonIcon('dice', 'Activate view', () => {
			this.activateView();
		});

		this.registerEvent(this.app.vault.on('create', this.onCreate, this));

		// 添加插件设置步骤3 -插件加载时候 调用
		await this.loadSettings();
		this.addSettingTab(new ExampleSettingTab(this.app, this));


		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text 2x');
		//图标覆盖上文字
		setIcon(statusBarItemEl, 'piggy-bank')

		//状态栏 添加图标2
		const item = this.addStatusBarItem();
		setIcon(item, 'smile');

		/**
		 * 要在状态栏中创建新块，onload()中调用
		 * addStatusBarItem()方法
		 * 
		 * 它返回一个HTML 元素，您可以向其中添加自己的元素。
		 */
		const item2 = this.addStatusBarItem();
		item2.createEl('span', { text: 'Hello from the status bar 👋' });

		const fruits = this.addStatusBarItem();
		fruits.createEl('span', { text: '🍎' });
		fruits.createEl('span', { text: '🍌' });

		const veggies = this.addStatusBarItem();
		veggies.createEl('span', { text: '🥦' });
		veggies.createEl('span', { text: '🥬' });

		/**
		 * Obsidian 界面左侧的侧边栏主要被称为功能区
		 * 目的是托管插件定义的操作。
		 * 要向功能区添加操作，请使用addRibbonIcon()方法
		 * 
		 * 用户可以从功能区中删除插件的图标，甚至可以选择完全隐藏功能区。
		 * 因此，建议包含访问功能区中功能的替代方法，
		 * 
		 * 例如创建命令
		 * 
		 */
		// 添加自己的图标 您的图标需要适合0 0 100 100视图框才能正确绘制
		addIcon('circle', `<circle cx="50" cy="50" r="50" fill="currentColor" />`);
		this.addRibbonIcon('circle', 'Click me', () => {
			console.log('Hello, you!');

			this.printMdPath();
		});

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
				const select = editor.getSelection().trim();
				console.log(select);
				if (select) {
					//todo 需要理解
					editor.replaceSelection(select.toUpperCase());
					return;
				}
				/* 
				replaceRange ()方法替换两个光标位置之间的文本。
				如果您只指定一个位置，它会在该位置和下一个位置之间插入新文本。
				*/
				editor.replaceRange(moment().format('YYYY-MM-DD'), editor.getCursor())

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
				//使用writeCurrentDate修改当前文档内容 todo 补全参数
				if (view.file) {
					//writeCurrentDate(this.app.vault, view.file);
					emojify(this.app.vault, view.file);
				}
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

		this.addCommand({
			id: 'my-modal',
			name: 'my modal 模态框',
			callback: () => {
				//new ExampleModal(this.app).open();
				new ExampleModal(this.app, (result) => {
					new Notice(`hello,${result}`);
				}).open();
			},
		});
		this.addCommand({
			id: 'my-choose-modal',
			name: 'my choose modal 模态框',
			callback: () => {
				//new ExampleModal(this.app).open();
				new ExampleModal2(this.app).open();
			},
		});
		this.addCommand({
			id: 'my-choose-modal2',
			name: 'my choose modal 模态框2',
			callback: () => {
				//new ExampleModal(this.app).open();
				new ExampleModal3(this.app).open();
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
							new Notice(view.file ? view.file.path : "default");
							console.log(view.file ? view.file.parent : "default");
						});
				});
			})
		);


		this.addRibbonIcon('info', 'Calculate average file length', async () => {
			const fileLength = await this.averageFileLength();
			new Notice(`The average file length is ${fileLength} characters.`);
		});

	}



	async averageFileLength(): Promise<number> {
		const { vault } = this.app;

		const fileContents: string[] = await Promise.all(
			vault.getMarkdownFiles().map((file) => vault.cachedRead(file))
		);

		let totalLength = 0;
		fileContents.forEach((content) => {
			totalLength += content.length;
		});

		return totalLength / fileContents.length;
	}

	private printMdPath() {
		// const files = this.app.vault.getMarkdownFiles();
		const files = this.app.vault.getFiles();

		for (let i = 0; i < files.length; i++) {
			const path = files[i].path;
			console.log(path);
			if (this.FileNotFolder(path) && path.contains('to-delete')) {
				console.log('delete', path);
				this.app.vault.delete(files[i]);
				// this.app.vault.trash(files[i],true);
			}
		}
	}

	private FileNotFolder(path: string): boolean {
		const folderOrFile = this.app.vault.getAbstractFileByPath(path);
		let f = true;
		if (folderOrFile instanceof TFile) {
			console.log('It\'s a file!');
		} else if (folderOrFile instanceof TFolder) {
			console.log('It\'s a folder!');
			f = false;
		}
		return f;
	}

	updateStatusBar() {
		this.statusBar.setText(moment().format('H:mm:ss'));
	}



	private mdPostDemo2() {
		this.registerMarkdownCodeBlockProcessor('csv', (source, el, ctx) => {
			const rows = source.split('\n').filter((row) => row.length > 0);

			const table = el.createEl('table');
			const body = table.createEl('tbody');

			for (let i = 0; i < rows.length; i++) {
				const cols = rows[i].split(',');

				const row = body.createEl('tr');

				for (let j = 0; j < cols.length; j++) {
					row.createEl('td', { text: cols[j] });
				}
			}
		});
	}

	private mdPostDemo() {
		this.registerMarkdownPostProcessor((element, context) => {
			const codeblocks = element.findAll('code');
			console.log(codeblocks.length);
			//此处let const那个好，为什么
			for (const codeblock of codeblocks) {
				const text = codeblock.innerText.trim();
				if (text[0] === ':' && text[text.length - 1] === ':') {
					const emojiEl = codeblock.createSpan({
						text: ALL_EMOJIS[text] ?? text,
					});
					codeblock.replaceWith(emojiEl);
				}
			}
		});
	}

	//释放插件需要的资源；插件禁止时运行
	onunload() {
		console.log('释放插件');
	}

	// 添加插件设置步骤2 -保存配置到磁盘
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 添加插件设置步骤2 -从磁盘加载配置
	async saveSettings() {
		console.log('保存设置', this.settings);
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

	// 插件设置页面构建： html元素
	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		//在容器元素内添加标题元素
		containerEl.createEl('h1', { text: 'Heading 1' });

		//createEl()返回对新元素的引用
		const book = containerEl.createEl('div');
		book.createEl('div', { text: 'How to Take Smart Notes' });
		book.createEl('small', { text: 'Sönke Ahrens' });

		//为元素设置样式 1
		const book2 = containerEl.createEl('div', { cls: 'book' });
		book2.createEl('div', { text: 'How to Take Smart Notes', cls: 'book__title' });
		book2.createEl('small', { text: 'Sönke Ahrens', cls: 'book__author' });

		book.toggleClass('danger', this.plugin.settings.mySetting === '');

		new Setting(containerEl)
			.setName('设置附件路径：')
			.setDesc('set attachment path')
			.addText(text => text
				.setPlaceholder('Enter your attachment path')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					console.log(this.plugin.settings.mySetting);
					//添加插件设置步骤3 调用saveSettings
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

function writeCurrentDate(vault: Vault, file: TFile): Promise<void> {
	return vault.modify(file, `Today is ${new Intl.DateTimeFormat().format(new Date())}.`);
}

// emojify replaces all occurrences of :) with 🙂.
function emojify(vault: Vault, file: TFile): Promise<string> {
	return vault.process(file, (data) => {
		return data.replace(/:\)/g, '🙂');
	})
}
