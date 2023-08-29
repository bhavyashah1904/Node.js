const { exists } = require('fs');
const fs = require('fs/promises');


(async () => {
    
    //COMMANDS
    const CREATE_FILE = "create a file";
    const DELETE_FILE = "delete the file";
    const RENAME_FILE = "rename the file";
    const ADD_TO_FILE = "add to the file"
    
    //Function Definition to create a file
    const createFile = async (path) =>{

     //first check if file with that is already present or not
    try{
       let existingFileCheck = await fs.open(path,"r");
        existingFileCheck.close();
        //If file exists return console and exit 
     return console.log(`The file ${path} already exists!!`);
    }
        //If theres an error means no file with that name exists, go ahead create anew file
    catch(e){
        const newFileCreate = await fs.open(path,"w");
        console.log("File Created Successfully!!");
        newFileCreate.close();
    }
    }

    //Function Definition to delete a file
   
  const deleteFile = async (path) => {
    try {
      await fs.unlink(path);
      console.log("The file was successfully removed.");
    } catch (e) {
      if (e.code === "ENOENT") {
        console.log("No file at this path to remove.");
      } else {
        console.log("An error occurred while removing the file: ");
        console.log(e);
      }
    }
  };

    //Function Definition to rename a file
    const renameFile = async (oldFilepath,newFilePath) =>{
    //console.log(`renaming file from ${oldFilepath} to ${newFilePath}`);
    try{
        await fs.rename(oldFilepath,newFilePath);
        console.log(`The File ${oldFilepath} was successfully renamed to ${newFilePath}`)
    }catch(e){
        if(e.code === "ENONET"){
            console.log("No file at this path to rename, or the destination doesn't exist.");
        }else{
            console.log("An error occurred while removing the file: ");
        console.log(e); 
        }
    }
    };

    //Function Definition to add to a file.
    let addedContent;
    const addToFile = async (path, content) => {
        if (addedContent === content) return;
        try {
          const fileHandle = await fs.open(path, "a");
          fileHandle.write(content);
          addedContent = content;
          console.log("The content was added successfully.");
        } catch (e) {
          console.log("An error occurred while removing the file: ");
          console.log(e);
        }
      };
    

    //Reading from Command.txt file 
    //You have to first open a file to read or write
    const commandFileHandler = await fs.open("Command.txt","r");
   
    commandFileHandler.on("onChange", async () => {
         //the file was changed
        //console.log(event);

      //Find the size of the file to allocate that to buffer size
       const sizeOfFile = (await commandFileHandler.stat()).size;
       //const sizeOfFile = fileStats.size;

        //Read the change in file or the content of the file

        // A Buffer that will be filled when read starts
        const buffer =  Buffer.alloc(sizeOfFile);
        //location in the buffer at which to start filing
        const offset = 0;
        //no of bytes to read
        const length = buffer.byteLength;
        //The location where to begin reading data from the file.
        const location = 0;

        //We Always want to read all the content from the begining of the file to the end
        await commandFileHandler.read(buffer,offset,length,location);
        const command = buffer.toString("utf-8");

        //Create a File
        if(command.includes(CREATE_FILE)){
            const filePath = command.substring(CREATE_FILE.length + 1);
            createFile(filePath);
        }

        //delete the file
        if(command.includes(DELETE_FILE)){
            const filePath = command.substring(DELETE_FILE.length + 1);
            deleteFile(filePath);
        }
        
        //rename file:
        //rename the file <path> to <new-path>
        if(command.includes(RENAME_FILE)){
            const idx = command.indexOf(" to ");
            const oldFilePath = command.substring(RENAME_FILE.length + 1,idx);
            const newFilePath = command.substring(idx + 4);
            renameFile(oldFilePath,newFilePath);
        }

        //add to file
        //add to the file <path> this content: <content>
        if(command.includes(ADD_TO_FILE)){
            const idx = command.indexOf(" this content: ");
            const filePath = command.substring(ADD_TO_FILE.length + 1,idx);
            const content = command.substring(idx + 15);
            addToFile(filePath,content);
        }

    }
)
    //Watcher
    const watcher = fs.watch("Command.txt");
    for await(const event of watcher){
    if(event.eventType === "change"){
        commandFileHandler.emit("onChange")
    }
}
})();