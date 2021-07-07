// State management

const ADD_BOOK = 'ADD_BOOK';
const REMOVE_BOOK = 'REMOVE_BOOK';
const LOAD_BOOKS = 'LOAD_BOOKS';

function generateId() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function createStore(books = []) {
  let state = books;
  const subscribers = [];

  const update = (action) => {
    switch (action.type) {
      case ADD_BOOK: {
        state = [...state, action.book];
        break;
      }
      case REMOVE_BOOK: {
        state = state.filter((book) => book.id !== action.id);
        break;
      }
      case LOAD_BOOKS: {
        state = action.books;
        break;
      }
      default:
        break;
    }
    subscribers.forEach((subscriber) => subscriber());
  };

  const getState = () => state;

  const onUpdate = (subscriber) => subscribers.push(subscriber);

  return {
    update,
    getState,
    onUpdate,
  };
}

const STORAGE_KEY = 'bookshelf';

class BookStore {
  constructor() {
    const store = createStore();
    store.onUpdate(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()));
    });
    this.store = store;
  }

  get books() {
    return this.store.getState();
  }

  addBook(book) {
    this.store.update({
      type: ADD_BOOK,
      book,
    });
  }

  removeBook(id) {
    this.store.update({
      type: REMOVE_BOOK,
      id,
    });
  }

  onUpdate(callback) {
    this.store.onUpdate(callback);
  }

  loadBooks() {
    const bookshelf = localStorage.getItem(STORAGE_KEY);
    if (bookshelf && bookshelf !== 'undefined') {
      this.store.update({
        type: LOAD_BOOKS,
        books: JSON.parse(bookshelf),
      });
    }
  }
}

const bookStore = new BookStore();

// DOM Manipulation

const list = document.getElementById('books');
const form = document.getElementById('book-entry');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = form.elements[0].value;
  const author = form.elements[1].value;
  const id = generateId();

  bookStore.addBook({ title, author, id });
  form.elements[0].value = '';
  form.elements[1].value = '';
});

function addBookToDOM(book) {
  const node = document.createElement('li');
  const title = document.createElement('h5');
  title.innerText = `"${book.title}" by ${book.author}`;
  title.classList.add('book-title');

  const button = document.createElement('button');
  button.innerText = 'Remove';
  button.addEventListener('click', () => bookStore.removeBook(book.id));
  button.classList.add('button', 'bg-danger', 'small-button');

  node.classList.add('book-item');
  node.appendChild(title);
  node.appendChild(button);

  list.appendChild(node);
}

bookStore.onUpdate(() => {
  list.innerHTML = '';
  bookStore.books.forEach(addBookToDOM);
});

window.addEventListener('load', () => {
  // eslint-disable-next-line no-undef
  const { DateTime } = luxon;
  const now = DateTime.now();
  document.getElementById('date').innerText = now.toLocaleString(DateTime.DATETIME_MED);

  bookStore.loadBooks();
});