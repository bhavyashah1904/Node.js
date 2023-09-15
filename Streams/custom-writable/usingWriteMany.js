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
    this.writesCount = 0;
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
    // console.log(this.fd);
    //Do the write operation
    this.chunksArr.push(chunk);
    this.chunkSize += chunk.length;

    if (this.chunkSize > this.writableHighWaterMark) {
      fs.write(this.fd, Buffer.concat(this.chunksArr), (err) => {
        //once done writing, call the callback function
        if (err) {
          console.log(err);
          return callback(err);
        }
        this.chunksArr = [];
        this.chunkSize = 0;
        ++this.writesCount;
        callback();
      });
    } else {
      // when we're done, we should call the callback function
      callback();
    }
  }

  //If our chunkSize does not reach the highWaterMark, use the final method to write anyway
  //Once the final method's callback is called, the _destroy method will get called.
  _final(callback) {
    fs.write(this.fd, Buffer.concat(this.chunksArr), (err) => {
      if (err) {
        console.log(err);
        return callback(err);
      } else {
        ++this.writesCount;
        this.chunksArr = [];
        callback();
      }
    });
  }

  //closing our file. the _final method will emit the "finish" event after its callback is called successfully.
  _destroy(error, callback) {
    console.log("Number of writes: ", this.writesCount);
    if (this.fd) {
      fs.close(this.fd, (err) => {
        callback(err || error);
      });
    } else {
      callback(error);
    }
  }
}

(async () => {
  console.time("writeMany");
  const stream = new fileCustomWriteStream({
    fileName: "text.txt",
  });
  //   const fileHandle = await fs.open("textBig.txt", "w");
  //   const stream = fileHandle.createWriteStream();

  let i = 0;
  const writeMany = () => {
    while (i <= 1000000) {
      const buff = Buffer.from(` ${i} `, "utf-8");
      if (i === 1000000) {
        return stream.end(buff);
      }
      //the stream.write method return false if the buffer is full
      //so if the "if" condition is fulfilled i.e when we get a false, we need to break from the loop
      if (!stream.write(buff)) break;
      i++;
    }
  };

  writeMany();
  let d = 0;
  // resume our loop once our stream's internal buffer is emptied
  stream.on("drain", () => {
    ++d;
    writeMany();
  });

  stream.on("finish", () => {
    console.log("Number of drains:", d);
    console.timeEnd("writeMany");
  });
})();
