Mural Challenge
===============

* Basic client-server architecture: clients send deltas, server sends absolute positions
  * The server keeps the the current position.
  * Server applies deltas as they arrive and broadcasts the new absolute position to every client.
  * There is no real need to send the updated position every time it changes, it could be sampled at regular intervals or use any other scheme to avoid flooding the network(although it would increase the latency of changes from other users).
  * A simple sequence number is used to implement latency compensation. Any monotonic sequence could be used, e.g. timestamps. A production quality protocol would use the sequence for other purposes, like duplicate message detection, acks, etc.

* Latency compensation
  * The latency compensation scheme allows for a smooth real time experience client side, while keeping the server as the arbiter.
  * It is based in https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization#Lag_Compensation. 
  
* Client
  * The client is mainly build using Bacon.js, a FRP framework.
  * Scroll events are buffered within a time window of 500 milliseconds, to avoid generating a large number of deltas. It is even worse when the browser smooths the scrolling.  
  * The scroll deltas are normalized between [0, 1] to account for differences in resolutions, and to keep the server agnostic of dimensions.
  * The deltas are kept and manipulated in a simple array. IRL, a circular buffer should be used, to limit the number of deltas kept.

* Bonus point 1: Do the math to to coordinate both Windows when they have multiple sizes.
  * Even when not accounting for windows of different sizes, the experience is quite good: the upper border stays at the same text position in all the windows, which is great for synchronized reading.
  * If keeping the thumb range synchronized is a must, the normalization term can be changed to `body.scrollHeight - body.parentNode.clientHeight`, but the nice properties of the previous point would be lost.

* Bonus Points 2: How would you keep versioning on the database, if we wanted to store the last read position on each document (i.e. pick we're you've left). Research tech, and describe the solution no code required.
  * A design where the deltas themselves are saved, with periodic snapshots of the consolidated positions to allow fast random access of history. To avoid continuous access to a database, a write ahead log should be used.

* Bonus Points 3: How would you run this same app on multiple servers behind a Load Balancer?
  * A simple option would be to shard documents, to keep state local to one server. If documents access is very skewed, this strategy would require to reshard constantly.
  * Another option is to keep the state in Redis or similar.
  * The servers could see each other as just another client, which would allow clients to change server at any time. For this solution to be possible, a sampling strategy is essential, because if every client message results in a message exchange between servers, no load distribution would occur. Also, the deltas from other servers should be treated differently to avoid storing them.    
  
