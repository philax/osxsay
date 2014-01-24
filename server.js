var express = require('express');
var exec = require('child_process').exec;
var sanitizer = require('sanitizer');
var app = express();

app.use(express.json());
app.use(express.urlencoded());

function hereDoc(f) {
  return f.toString().
    replace(/^[^\/]+\/\*!?/, '').
    replace(/\*\/[^\/]+$/, '');
}

function makeLog(collection, open, close) {
  var formattedSaid = [];
  
  if (!collection.length) {
    return open + 'nothing' + close;
  }
  
  for (var i = 0, len = collection.length; i < len; i++) {
    formattedSaid.push('<strong>' + sanitizer.sanitize(collection[i].voice) + ':</strong> ' + sanitizer.sanitize(collection[i].message));
  }
  return [
    open,
    formattedSaid.join(close + open),
    close
  ].join('');
}

function sayLoop() {
  if (queue.length > 0) {
    var next = queue.shift();
    var voice = next.voice.replace(/[^a-z0-9.-_,']/g, '');
    var message = next.message.replace(/[^a-z0-9.-_,']/g, '').replace(/\./g, '...');
    said.unshift(next)
    
    if (said.length > 20) {
      said = said.slice(0, 20);
    }
    
    command = 'say -v "{{VOICE}}" "{{MESSAGE}}"';
    command = command.replace(/\{\{VOICE\}\}/g, voice).replace(/\{\{MESSAGE\}\}/g, message);
    
    exec(command, function(error, stdout, stderr) {
      // and again
      setImmediate(sayLoop);
    });
  }
  else {
    // and again
    setImmediate(sayLoop);
  }
}

var said = [];
var queue = [];

app.get('/', function(req, res){
  var body = hereDoc(function() {/*!
    <html>
    <head>
      <title>Gooogle</title>
    </head>
    <body>
      <div style="width: 500px">
      <form method="POST" action="/send">
        <select name="voice" style="width: 100px">
          <option value="Agnes">Agnes</option>
          <option value="Kathy">Kathy</option>
          <option value="Princess">Princess</option>
          <option value="Vicki">Vicki</option>
          <option value="Victoria">Victoria </option>
          <option value="Alex">Alex</option>
          <option value="Bruce">Bruce</option>
          <option value="Fred">Fred</option>
          <option value="Junior">Junior</option>
          <option value="Ralph">Ralph</option>
          <option value="Albert">Albert</option>
          <option value="Bad News">Bad News</option>
          <option value="Bahh">Bahh</option>
          <option value="Bells">Bells</option>
          <option value="Boing">Boing</option>
          <option value="Bubbles">Bubbles</option>
          <option value="Cellos">Cellos</option>
          <option value="Deranged">Deranged </option>
          <option value="Good News">Good News</option>
          <option value="Hysterical">Hysterical </option>
          <option value="Pipe Organ">Pipe Organ </option>
          <option value="Trinoids">Trinoids </option>
          <option value="Whisper">Whisper </option>
          <option value="Zarvox">Zarvox</option>
        </select>
        <input type="text" id="message" name="message" placeholder="Say what?" style="width:300px"/>
        <input type="submit" name="submit" value="Say" style="width: 50px"/>
      </form>
      <h2>Gonna Say</h2>
      <ol>
        {{PENDING}}
      </ol>
      <h2>Said</h2>
      <ol>
        {{LOG}}
      </ol>
      <script>
        var voice = '{{VOICE}}';
        var els;
        if (voice) {
          els = document.getElementsByTagName('option');
          for (var i = 0, len = els.length; i < len; i++) {
            if (els[i].value == voice) {
              els[i].selected = 'SELECTED';
            }
          }
        }
        document.getElementById('message').focus();
      </script>
    </body>
    </html>
  */});
  body = body.replace(/\{\{PENDING\}\}/g, makeLog(queue, '<li>', '</li>'));
  body = body.replace(/\{\{LOG\}\}/g, makeLog(said, '<li>', '</li>'));
  body = body.replace(/\{\{VOICE\}\}/g, sanitizer.sanitize(req.query.voice));
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
});

app.post('/send', function(req, res) {
  // too long of a queue resets
  if (queue.length > 20) {
    queue = [];
  }
  
  if (!req.body.voice || !req.body.message) {
    res.redirect('/?voice=' + req.body.voice);
    return;
  }

  queue.push({
    voice: req.body.voice,
    message: req.body.message
  });
  
  // back to main
  res.redirect('/?voice=' + req.body.voice);
});

app.listen(4242);
sayLoop();