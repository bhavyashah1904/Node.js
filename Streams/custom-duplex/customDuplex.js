const { Duplex } = require("node:stream");
const fs = require("node:fs");
const { writeFile, read } = require("node:fs");

class customDuplexStream extends Duplex {
  constructor({
    writableHighWaterMark,
    readableHighWaterMark,
    readFileName,
    writeFileName,
  }) {
    super({ readableHighWaterMark, writableHighWaterMark });
    this.readFileName = readFileName;
    this.writeFileName = writeFileName;
    this.readFd = null;
    this.writeFd = null;
    this.chunksArr = [];
    this.chunkSize = 0;
  }

  //   _construct(callback) {
  //     fs.open(this.readFileName, "r", (err, readFd) => {
  //       return err ? callback(err) : ((this.readFd = readFd), callback());
  //     });
  //     fs.open(this.writeFileName, "w", (err, writeFd) => {
  //       return err ? callback(err) : ((this.writeFd = writeFd), callback());
  //     });
  //   }

  _construct(callback) {
    fs.open(this.readFileName, "r", (err, readFd) => {
      if (err) return callback(err);
      this.readFd = readFd;
      fs.open(this.writeFileName, "w", (err, writeFd) => {
        if (err) return callback(err);
        this.writeFd = writeFd;
        callback();
      });
    });
  }

  _write(chunk, encoding, callback) {
    // console.log(this.fd);
    //Do the write operation
    this.chunksArr.push(chunk);
    this.chunkSize += chunk.length;

    if (this.chunkSize > this.writableHighWaterMark) {
      fs.write(this.writeFd, Buffer.concat(this.chunksArr), (err) => {
        //once done writing, call the callback function
        if (err) {
          console.log(err);
          return callback(err);
        } else {
          this.chunksArr = [];
          this.chunkSize = 0;
          callback();
        }
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    fs.write(this.writeFd, Buffer.concat(this.chunksArr), (err) => {
      if (err) {
        console.log(err);
        return callback(err);
      } else {
        this.chunksArr = [];
        callback();
      }
    });
  }

  _read(size) {
    const buff = Buffer.alloc(size);
    fs.read(this.readFd, buff, 0, size, null, (err, bytesRead) => {
      return err
        ? this.destroy(err)
        : this.push(bytesRead > 0 ? buff.subarray(0, bytesRead) : null);
    });
  }

  //Technically you should close the file here but we're avoiding just for simplicity
  _destroy(error, callback) {
    callback(error);
  }
}

const duplex = new customDuplexStream({
  readFileName: "read.txt",
  writeFileName: "write.txt",
});

duplex.write(Buffer.from("I am here \n"));
duplex.write(Buffer.from("I am here \n"));
duplex.write(Buffer.from("I am here \n"));
duplex.write(Buffer.from("I am here \n"));
duplex.write(Buffer.from("I am here \n"));
duplex.end(Buffer.from("I am going. Bye"));

duplex.on("data", (chunk) => {
  console.log(chunk.toString("utf-8"));
});
