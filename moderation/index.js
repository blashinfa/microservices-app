const express = require('express');
const bodyParser = require('body-parser');

const axios = require('axios');

const app = express();

app.use(bodyParser.json());

app.post('/events', (req, res) => {
  console.log(req);
  try {
    const event = req.body;
    console.log(event);
    if (event.type === 'comment.create') {
      event.data.status = !event.data.comment.includes('orange')
        ? 'moderated'
        : 'rejected';
      axios.post('http://localhost:4005/events', {
        type: 'comment.moderated',
        data: event.data,
      });
      console.log(event);
      return res.send({});
    }

    return res.send({});
  } catch (err) {
    console.log(err);
    return res.send({});
  }
});

app.listen(4004, () => {
  console.log('listening to http://localhost:4004');
});
