import express from 'express';
import redis from 'redis';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import axios from 'axios';
const app = express();
app.use(bodyParser.json());
app.use(cors());
const rclient = redis.createClient();

app.get('/posts', async (req, res) => {
  await rclient.connect();
  let posts;
  if (await rclient.exists('posts')) {
    const data = await rclient.lRange('posts', 0, -1);
    await rclient.close();
    posts = data.map((post) => JSON.parse(post));
  } else {
    posts = [];
  }

  return res.send(posts);
});

app.post('/posts', async (req, res) => {
  if (!rclient.isOpen) await rclient.connect();

  const { title } = req.body;
  const id = crypto.randomBytes(4).toString('hex');
  const post = { id, title };
  console.log(post);
  await rclient.rPush('posts', JSON.stringify(post));
  await rclient.close();
  await axios.post('http://localhost:4005/events', {
    type: 'post.create',
    data: post,
  });
  return res.status(201).send(post);
});

app.post('/events', (req, res) => {
  console.log('event', req.body);

  return res.send({});
});

app.listen(4000, () => {
  console.log(`listen to http://localhost:4000`);
});
