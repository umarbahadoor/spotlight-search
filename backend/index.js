const path = require('path');
const cors = require('cors');
const express = require('express');
const app = express();

if (typeof process.argv[2] === 'undefined') {
    throw new Error('Please provide a port number');
}

const port = process.argv[2];

app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", port);
});