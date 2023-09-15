//Implementing our own custom writable stream
//1]importing the Writable stream from the stream module
const { Writable } = require("node:stream");
const fs = require("node:fs");

//2] create a class to extend or inherit the Writable object
class fileCustomWriteStream extends Writable {
  //3] call the parent constructor
  constructor({ highWaterMark, fileName }) {
    //specify specific options that we want to pass to our constructor
    super({ highWaterMark });
    //save the filename
    this.fileName = fileName;
    this.fd = null;
    this.chunksArr = [];
    this.chunkSize = 0;
    this.writesCount;
  }

  //3] Implement the _construct method
  // This will run after the constructor, and it will put off all calling the other
  // methods until we call the callback function
  _construct(callback) {
    fs.open(this.fileName, "w", (err, fd) => {
      if (err) {
        // so if we call the callback with an argument, it means that we have an error
        // and we should not proceed
        callback(err);
      } else {
        this.fd = fd;
        // no argument means it was successful
        callback();
      }
    });
  }

  //4] Implement specific methods. now in case of write stream they are
  //_write(), _writev?(), _final().
  //_write() method will be called whenever we try to write to a file by calling the stream.write() method.

  _write(chunk, encoding, callback) {
    console.log(this.fd);
    //Do the write operation
    this.chunksArr.push(chunk);
    this.chunkSize += chunk.length;

    if (this.chunkSize > this.writableHighWaterMark) {
      fs.write(this.fd, Buffer.concat(this.chunksArr), (err) => {
        //once done writing, call the callback function
        if (err) {
          console.log(err);
          return callback(err);
        } else {
          this.chunksArr = [];
          this.chunkSize = 0;
          ++this.writesCount;
          callback();
        }
      });
    } else {
      callback();
    }
  }

  //If our chunkSize does not reach the highWaterMark, use the final method to write anyway
  _final(callback) {
    fs.write(this.fd, Buffer.concat(this.chunksArr), (err) => {
      if (err) {
        console.log(err);
        return callback(err);
      } else {
        this.chunksArr = [];
        callback();
      }
    });
  }
}

//Initializing the stream
const stream = new fileCustomWriteStream({
  highWaterMark: 1800,
  fileName: "text.txt",
});

//perform the write
stream.write(
  Buffer.from("This is the string that needs to be added to the file")
);

//Call the end method. Without this the _final() won't get called.
stream.end(Buffer.from("End of stream!!"));
