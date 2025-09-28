import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import redis from 'redis';
import crypto from 'crypto';
import axios from 'axios';

const app = express();
const client = redis.createClient();

app.use(cors());
app.use(bodyParser.json());

app.get('/posts/:id/comments', async (req, res) => {
  if (!client.isOpen) await client.connect();
  const postId = req.params.id;
  let comments = [];

  if (await client.hExists('comments', postId)) {
    comments = JSON.parse(await client.hGet('comments', postId));
  }

  return res.status(200).send(comments);
});

app.post('/posts/:id/comments', async (req, res) => {
  if (!client.isOpen) await client.connect();
  const postId = req.params.id;
  const { comment } = req.body;
  const id = crypto.randomBytes(4).toString('hex');
  let postComments = [];
  if (await client.hExists('comments', postId)) {
    postComments = JSON.parse(await client.hGet('comments', postId));
  }
  await axios.post('http://localhost:4005/events', {
    type: 'comment.create',
    data: { comment, id, postId, status: 'pending' },
  });
  postComments.push({ comment, id, postId, status: 'pending' });
  await client.hSet('comments', postId, JSON.stringify(postComments));
  return res.status(201).send({ comment, id, postId });
});

app.post('/events', async (req, res) => {
  const event = req.body;
  if (event.type === 'comment.moderated') {
    const comment_id = event?.data?.id;
    const postId = event.data.postId;
    if (!client.isOpen) await client.connect();
    const comments = JSON.parse(await client.hGet('comments', postId));
    comments.map((comment) => {
      comment.id == comment_id && (comment = event.data);
      return comment;
    });
    await client.hSet('comments', postId, JSON.stringify(comments));
    axios.post('http://localhost:4005/events', {
      type: 'comment.updated',
      data: event?.data,
    });
    console.log('event', comments);
  }

  return res.send({});
});

app.listen(4001, () => {
  console.log('listen to http://localhsot:4001');
});
