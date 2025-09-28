import express from 'express';
import bodyParser from 'body-parser';
import redis from 'redis';
import cors from 'cors';
import axios from 'axios';

const app = express();
const client = redis.createClient();

app.use(bodyParser.json());
app.use(cors());

app.use(async (req, res, next) => {
  if (!client.isOpen) await client.connect();
  next();
});
app.get('/posts', async (req, res) => {
  let data = Object.entries(await client.hGetAll('postsList'));
  data = data.map((item) => JSON.parse(item[1]));
  return res.send(data);
});

async function handleEvent(event) {
  if (!client.isOpen) await client.connect();
  try {
    if (event.type === 'post.create') {
      const data = event.data;
      data.comments = [];
      await client.hSet('postsList', data.id, JSON.stringify(data));
      console.log('post has been saved');
    } else if (event.type === 'comment.create') {
      const data = event.data;
      const post = JSON.parse(await client.hGet('postsList', data.postId));
      post.comments.push(event.data);
      await client.hSet('postsList', data.postId, JSON.stringify(post));
      console.log('comment has been saved');
    } else if (event.type === 'comment.updated') {
      const data = event.data;

      const post = JSON.parse(await client.hGet('postsList', data.postId));
      // post.comments = data.comments | [];
      post.comments = post.comments.map((comment) => {
        if (comment.id === data.id) {
          comment = data;
        }
        return comment;
      });
      await client.hSet('postsList', data.postId, JSON.stringify(post));
    }
  } catch (err) {
    console.log('error', err);
  }
}

app.post('/events', async (req, res) => {
  const event = req.body;
  await handleEvent(event);
  return res.send({ status: 'success' });
});

app.listen(4002, async () => {
  console.log('listen to http://localhost:4002');
  const events = await axios.get('http://localhost:4005/events');
  console.log(events.data);
  for (let event of events.data) {
    await handleEvent(event);
  }
});
