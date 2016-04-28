'use strict';

var socket = io();

function plus(x,y) { return x + y }
function minus(x,y) { return y - x }

var body = $('body');
var norm = body[0].scrollHeight// - body[0].parentNode.clientHeight;

var scrolls = $(window).asEventStream("scroll");

var positionsDeltas = scrolls.map(x => body.scrollTop()).diff(0, minus).toEventStream();

var stateUpdates = Bacon.fromEventTarget(socket, 'state-update');

function reduceDeltas(deltas) {
  return deltas.map(x => x.diff).reduce((x, y) => x + y, 0);
}

var commands = Bacon.when([stateUpdates, positionsDeltas], Bacon.never(), [positionsDeltas], x => Bacon.once(x)).flatMap(x => x)
  .bufferWithTime(500).map(x => x.reduce(plus, 0.0));

class ClientState{
  constructor(){
    this.ackState = { seq: 0, state: 0};
    this.deltasQueue = [];
  }
  newDelta(delta){
    this.deltasQueue.push(delta);
  }
  ackPosition(position){
    var oldDeltas = this.deltasQueue.filter(x => x.seq <= position.seq);
    var clientSideState = this.ackState.state + reduceDeltas(oldDeltas);
    this.deltasQueue = this.deltasQueue.slice(oldDeltas.length);
    this.ackState = position;
    if (clientSideState == position.state) {
      $(window).scroll();
    } else {
      body.scrollTop((position.state + reduceDeltas(this.deltasQueue)) * norm);
    }
  }
}

function sendDeltaUpdate(x){
  socket.emit('delta-update', x);
}

var clientState = new ClientState();

var diffs = commands.scan({seq: 0, diff: 0}, (x,y) => ({seq: x.seq + 1, diff: y / norm})).skip(1).toEventStream();

diffs.forEach(sendDeltaUpdate);
diffs.forEach(x => clientState.newDelta(x));

stateUpdates.forEach(x => clientState.ackPosition(x));
