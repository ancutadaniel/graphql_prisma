const users = [
  {
    id: '1',
    name: 'Dacether',
    email: 'test@test.com',
    age: 30,
    posts: ['1'],
    comments: ['1', '2'],
  },
  {
    id: '2',
    name: 'Harold',
    email: 'test1@test1.com',
    age: 35,
    posts: ['2'],
    comments: ['3', '4'],
  },
];

const posts = [
  {
    id: '1',
    title: 'My first post',
    body: 'This is my first post',
    published: true,
    author: '1',
  },
  {
    id: '2',
    title: 'My second post',
    body: 'This is my second post',
    published: false,
    author: '2',
  },
  {
    id: '3',
    title: 'My third post',
    body: 'This is my third post',
    published: true,
    author: '2',
  },
];

const comments = [
  {
    id: '1',
    text: 'This is my first comment',
    author: '1',
    post: '1',
  },
  {
    id: '2',
    text: 'This is my second comment',
    author: '1',
    post: '2',
  },
  {
    id: '3',
    text: 'This is my third comment',
    author: '2',
    post: '3',
  },
  {
    id: '4',
    text: 'This is my fourth comment',
    author: '2',
    post: '3',
  },
];

const db = {
  users,
  posts,
  comments,
};

export default db;
