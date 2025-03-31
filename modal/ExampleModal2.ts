import { FuzzySuggestModal, Notice, SuggestModal } from 'obsidian';

interface Book {
  title: string;
  author: string;
}

const ALL_BOOKS = [
  {
    title: '斗破苍穹',
    author: '天蚕土豆',
  },
  {
    title: '少年闰土',
    author: '鲁迅',
  },
  {
    title: '海底两万里',
    author: '未知',
  },
];
/* 
从建议列表选择的模态框

除此以外SuggestModal，Obsidian API 还提供了一种更专业的建议模
FuzzySuggestModal
*/
export class ExampleModal2 extends SuggestModal<Book> {
    // 和前两个对比 少了构造器 可以吗
  // Returns all available suggestions.
  getSuggestions(query: string): Book[] {
    return ALL_BOOKS.filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Renders each suggestion item.
  renderSuggestion(book: Book, el: HTMLElement) {
    el.createEl('div', { text: book.title });
    el.createEl('small', { text: book.author });
  }

  // Perform action on the selected suggestion.
  onChooseSuggestion(book: Book, evt: MouseEvent | KeyboardEvent) {
    new Notice(`Selected ${book.title}`);
  }
}

export class ExampleModal3 extends FuzzySuggestModal<Book> {
    getItems(): Book[] {
      return ALL_BOOKS;
    }
  
    getItemText(book: Book): string {
      return book.title;
    }
  
    onChooseItem(book: Book, evt: MouseEvent | KeyboardEvent) {
      new Notice(`Selected ${book.title}`);
    }
  }