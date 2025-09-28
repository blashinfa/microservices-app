const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
const events = [];

app.post('/events', async (req, res) => {
  const data = req.body;
  console.log(data);

  await axios.post('http://localhost:4000/events', data).catch((err) => {
    console.log(err.message);
  });
  await axios.post('http://localhost:4001/events', data).catch((err) => {
    console.log(err.message);
  });
  await axios.post('http://localhost:4002/events', data).catch((err) => {
    console.log(err.message);
  });
  await axios.post('http://localhost:4004/events', data).catch((err) => {
    console.log(err.message);
  });
  events.push(data);
  return res.send({ message: 'Ok' });
});

app.get('/events', (req, res) => {
  return res.json(events);
});

app.listen(4005, () => {
  console.log(`listen to http://localhost:4005`);
});
