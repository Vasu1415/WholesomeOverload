const http = require('http'); 
const bodyParser = require("body-parser");  
const express = require('express'); 
const app = express();    
const path = require("path"); 

const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
const databaseAndCollection = {db: `${process.env.MONGO_DB_NAME}`, collection:`${process.env.MONGO_COLLECTION}`};
const user_name = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const uri = "mongodb+srv://" + user_name + ":" + password + "@cluster%1415.r81rd4e.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });

process.stdin.setEncoding("utf8");

let global_user = {};
let global_arr = [];
let todoList = false;

if (process.argv.length != 3) { 
	process.stdout.write(`Usage: node Personify.js portNumber\n`); 
	process.exit(1); 
}
const portNumber = process.argv[2];
console.log(`Web server started and running at https://wholesomeoverload.onrender.com:${portNumber}`); 
process.stdout.write(`Stop to shutdown the server: `);
process.stdin.on("readable", function (){ 
    let dataInput = process.stdin.read(); 
	if (dataInput != null){ 
	    let command = dataInput.trim(); 
	    if (command === "stop"){ 
	        process.stdout.write("Shutting down the server\n"); 
	        process.exit(0); 
	    }else{
            process.stdout.write("Invalid Command\n");
            process.exit(1);
        }
    }
});

app.get("/", (request, response) => {  
	response.render("main_page");  
});

app.set("views", path.resolve(__dirname, "templates"));  
app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({extended:false}));

app.get("/logIn", (request, response) => { 
    const varaible = {portNumber};
    response.render("login_page",varaible);
});

async function userfinder(client,databaseAndCollection,target_name,target_email){
    await client.connect();
    let filter = {name: target_name, email: target_email};
    const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
    const result = await cursor.toArray();
    return result;
}

app.post("wholesomeoverload.onrender.com/logIn", async (request, response) => {
    const { name, email } = request.body;
    try {
        let result = await userfinder(client, databaseAndCollection, name, email);
        if (result.length > 0) { 
            response.render("login_successful_page");
        } else {
            response.render("error_page");
        }
    } catch (error) {
        console.log(error);
        response.render("error_page");
    } finally {
        await client.close();
    }
});


app.get("/sign_up",(request, response) => { 
    const varaible = {portNumber};
    response.render("signup_page",varaible);
});

async function insert_user(client,databaseAndCollection,new_application){
    await client.connect();
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(new_application);
}

app.post("wholesomeoverload.onrender.com/sign_up", async (request,response) =>{
    const {name,email} = request.body;
    global_user['name'] = name;
    global_user['email'] = email;
    try {
        await insert_user(client, databaseAndCollection, {name,email});
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    } 
    response.render("signup_successful_page");
});

app.get("/cat", async (request, response) => {
    try {
        const { default: fetch } = await import('node-fetch');
        const cat = await fetch('https://api.thecatapi.com/v1/images/search?limit=12', {
            headers: {
                'x-api-key': 'live_K52aq337tJtkBlQEDVInzTubVXA0ywO99qK4WzvhDlfcaQy0ktLyPVO0Jsjq65Hx'
            }
        });
        const catImages = await cat.json();
        response.render("cat_page", { catImages });
    } catch (error) {
        console.error(error);
        response.render("error_page");
    }
});


app.listen(portNumber);
