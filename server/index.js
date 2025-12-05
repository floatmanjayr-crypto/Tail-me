const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  socket.on('join', uid => socket.join(uid));
  socket.on('tail', data => {
    // data = {to, from, url, title, img, price, note}
    io.to(data.to).emit('incomingTail', data);
  });
});

server.listen(4000, () => console.log('Tail-me server on :4000'));